import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AuthUserFacingError,
  mapAuthErrorMessage,
  shouldClearLocalSessionOnInitError,
} from '../lib/authErrors';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  profile: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  sendMagicLink: (email: string) => Promise<{ error: Error | null }>;
  verifyMagicLinkCode: (email: string, token: string) => Promise<{
    error: Error | null;
    data: User | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  updateProfile: (data: Partial<User>) => Promise<{
    error: Error | null;
    data: User | null;
  }>;
  updateEmail: (newEmail: string, password: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  updateMembershipLevel: (level: 'Standard' | 'Premium' | 'Executive' | 'Founding Member') => Promise<{
    error: Error | null;
    data: User | null;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthData = () => {
    localStorage.removeItem('pier_auth_token');
    sessionStorage.removeItem('pier_auth_token');
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
    // Clear all Supabase auth related items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      // Auth identity is auth.users.id. We use the same id for both:
      // - members: canonical member record (role, membership_level, etc.)
      // - profiles: onboarding, preferences, personal_context (can be missing for some users)
      // Select only columns we use so existing users without new columns (e.g. stripe_customer_id) still work
      const { data: userData, error: userError } = await supabase
        .from('members')
        .select('id, email, first_name, last_name, role, member_id, phone, preferences, membership_level, created_at, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.warn('Members fetch error:', userError.message);
        throw userError;
      }

      if (!userData) {
        throw new Error('No user profile found');
      }

      // Safe reads for existing rows that may have nulls or missing fields
      const email = userData.email ?? '';
      const firstName = userData.first_name ?? '';
      const lastName = userData.last_name ?? '';
      const role = (userData.role === 'admin' ? 'admin' : 'member') as 'member' | 'admin';
      const memberId = userData.member_id ?? '';
      const membershipLevel = (userData.membership_level as User['membership_level']) ?? 'Standard';
      const created_at = userData.created_at ?? new Date().toISOString();

      let profileData: {
        full_name?: string | null;
        onboarding_completed?: boolean | null;
        personal_context?: unknown;
        event_preferences?: Record<string, string> | null;
        concierge_preferences?: Record<string, string> | null;
        front_user_hash?: string | null;
      } | null = null;
      // Prefer onboarding_completed from members (denormalized, always present); fallback to profiles
      let onboardingCompleted = (userData as { onboarding_completed?: boolean })?.onboarding_completed === true;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'full_name, onboarding_completed, personal_context, event_preferences, concierge_preferences, front_user_hash'
          )
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching profile (may not exist yet):', error.message);
        } else if (data) {
          profileData = data as typeof profileData;
          if (!onboardingCompleted) {
            if (data.onboarding_completed === true) onboardingCompleted = true;
            else if (data.personal_context && typeof data.personal_context === 'object') {
              const pc = data.personal_context as { name?: string; goals?: unknown[] };
              if (pc.name || (Array.isArray(pc.goals) && pc.goals.length > 0)) onboardingCompleted = true;
            }
          }
        }
      } catch {
        console.warn('Profile fetch failed');
      }

      const memberPrefs =
        userData.preferences && typeof userData.preferences === 'object'
          ? (userData.preferences as Record<string, unknown>)
          : {};
      const mergedPreferences = {
        ...memberPrefs,
        ...(profileData?.event_preferences
          ? { event_preferences: profileData.event_preferences }
          : memberPrefs.event_preferences
            ? { event_preferences: memberPrefs.event_preferences }
            : {}),
        ...(profileData?.concierge_preferences
          ? { concierge_preferences: profileData.concierge_preferences }
          : memberPrefs.concierge_preferences
            ? { concierge_preferences: memberPrefs.concierge_preferences }
            : {}),
      };

      return {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        member_id: memberId,
        phone: userData.phone ?? undefined,
        preferences: Object.keys(mergedPreferences).length > 0 ? mergedPreferences : undefined,
        membership_level: membershipLevel,
        created_at,
        full_name: profileData?.full_name || `${firstName} ${lastName}`.trim() || 'Member',
        front_user_hash: profileData?.front_user_hash ?? null,
        membership_tier: membershipLevel,
        onboarding_completed: onboardingCompleted,
      };
    } catch (error) {
      console.warn('fetchUserProfile failed:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const SAFETY_TIMEOUT_MS = 6000;
    const SESSION_FETCH_TIMEOUT_MS = 5000;
    const PROFILE_FETCH_TIMEOUT_MS = 5000;

    const setLoadingFalse = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (mounted) setIsLoading(false);
    };

    // Safety net: if init doesn't finish in time, show login so user isn't stuck
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout - setting loading to false');
        setLoadingFalse();
      }
    }, SAFETY_TIMEOUT_MS);

    const initializeAuth = async () => {
      try {
        const raced = await Promise.race([
          supabase.auth.getSession().then((r) => ({ tag: 'session' as const, ...r })),
          new Promise<{ tag: 'timeout' }>((resolve) =>
            setTimeout(() => resolve({ tag: 'timeout' }), SESSION_FETCH_TIMEOUT_MS)
          ),
        ]);

        if (raced.tag === 'timeout') {
          if (mounted) setLoadingFalse();
        } else {
          const { data, error: sessionError } = raced;
          if (sessionError?.message && shouldClearLocalSessionOnInitError(sessionError.message)) {
            try {
              await supabase.auth.signOut({ scope: 'local' });
            } catch {
              /* ignore */
            }
            clearAuthData();
          }

          const session = data?.session ?? null;

          if (session?.user && mounted) {
            try {
              const profile = await Promise.race([
                fetchUserProfile(session.user.id),
                new Promise<null>((resolve) =>
                  setTimeout(() => resolve(null), PROFILE_FETCH_TIMEOUT_MS)
                ),
              ]);
              if (mounted) {
                setLoadingFalse();
                if (profile) setUser(profile);
              }
            } catch (profileError) {
              console.error('Error fetching user profile:', profileError);
              setLoadingFalse();
            }
          } else if (mounted) {
            setLoadingFalse();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoadingFalse();
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;

          if (event === 'SIGNED_IN' && session?.user) {
            const profile = await fetchUserProfile(session.user.id);
            if (profile && mounted) {
              setUser(profile);
            }
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            const profile = await fetchUserProfile(session.user.id);
            if (profile && mounted) {
              setUser(profile);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            clearAuthData();
          }
        }
      );

      authSubscription = subscription;
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Sync auth state when another tab changes localStorage (sign-in, sign-out, token refresh)
  useEffect(() => {
    let mounted = true;

    const handleStorage = async (event: StorageEvent) => {
      const key = event.key;
      const isAuthKey =
        key === 'pier_auth_token' ||
        key === 'supabase.auth.token' ||
        (key?.startsWith('sb-') ?? false) ||
        (key?.includes('supabase') ?? false);
      if (!isAuthKey) return;

      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (!mounted) return;
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted && profile) {
            setUser(profile);
          }
        } else {
          setUser(null);
        }
      } catch (_err) {
        if (mounted) {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: true
        }
      });

      if (signInError) {
        setIsLoading(false);
        const display = mapAuthErrorMessage(signInError.message, 'password', {
          errorCode:
            typeof (signInError as { code?: string }).code === 'string'
              ? (signInError as { code?: string }).code
              : undefined,
        });
        return {
          data: null,
          error: new AuthUserFacingError(display),
        };
      }

      if (!data.user) {
        setIsLoading(false);
        return {
          data: null,
          error: new AuthUserFacingError({
            kind: 'plain',
            text: 'Unable to sign in. Please try again.',
          }),
        };
      }

      const profile = await fetchUserProfile(data.user.id);
      if (!profile) {
        setIsLoading(false);
        return {
          data: null,
          error: new AuthUserFacingError(mapAuthErrorMessage(undefined, 'profile')),
        };
      }

      setUser(profile);
      setIsLoading(false);
      return { data: profile, error: null };
    } catch (error) {
      setIsLoading(false);
      console.error('Sign in error:', error);
      return {
        data: null,
        error: new AuthUserFacingError({
          kind: 'plain',
          text: 'An unexpected error occurred. Please try again.',
        }),
      };
    }
  };

  const sendMagicLink = async (email: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });
      if (error) {
        const display = mapAuthErrorMessage(error.message, 'otp_send', {
          errorCode: typeof (error as { code?: string }).code === 'string' ? (error as { code?: string }).code : undefined,
        });
        return { error: new AuthUserFacingError(display) };
      }
      return { error: null };
    } catch (err) {
      console.error('Send magic link error:', err);
      return {
        error: new AuthUserFacingError({
          kind: 'plain',
          text: err instanceof Error ? err.message : 'Failed to send access code',
        }),
      };
    }
  };

  const verifyMagicLinkCode = async (
    email: string,
    token: string
  ): Promise<{ error: Error | null; data: User | null }> => {
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (verifyError) {
        const display = mapAuthErrorMessage(verifyError.message, 'otp_verify', {
          errorCode:
            typeof (verifyError as { code?: string }).code === 'string'
              ? (verifyError as { code?: string }).code
              : undefined,
        });
        return {
          data: null,
          error: new AuthUserFacingError(display),
        };
      }
      if (!data?.user) {
        return {
          data: null,
          error: new AuthUserFacingError({
            kind: 'plain',
            text: 'Verification failed. Please try again.',
          }),
        };
      }
      const profile = await fetchUserProfile(data.user.id);
      if (!profile) {
        return {
          data: null,
          error: new AuthUserFacingError(mapAuthErrorMessage(undefined, 'profile')),
        };
      }
      setUser(profile);
      return { data: profile, error: null };
    } catch (err) {
      console.error('Verify OTP error:', err);
      return {
        data: null,
        error: new AuthUserFacingError(
          mapAuthErrorMessage(err instanceof Error ? err.message : undefined, 'otp_verify', {
            errorCode:
              err instanceof Error && typeof (err as { code?: string }).code === 'string'
                ? (err as { code?: string }).code
                : undefined,
          })
        ),
      };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      clearAuthData();
    } catch (_error) {
      // Even if signOut fails, clear local data
      clearAuthData();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Always use production URL for email links to avoid localhost in emails
      const PRODUCTION_URL = 'https://pier.vip';
      const redirectUrl = import.meta.env.PROD 
        ? `${PRODUCTION_URL}/reset-password`
        : `${window.location.origin}/reset-password`;
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: redirectUrl
        }
      );

      return { data, error };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('An unexpected error occurred') 
      };
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) throw new Error('No authenticated user');

      const memberUpdates: Record<string, unknown> = {};
      if (data.phone !== undefined) memberUpdates.phone = data.phone;
      if (data.first_name !== undefined) memberUpdates.first_name = data.first_name;
      if (data.last_name !== undefined) memberUpdates.last_name = data.last_name;

      if (data.preferences !== undefined) {
        const { event_preferences: _e, concierge_preferences: _c, ...memberOnlyPrefs } = data.preferences;
        memberUpdates.preferences = {
          ...(user.preferences ?? {}),
          ...memberOnlyPrefs,
        };
      }

      if (Object.keys(memberUpdates).length > 0) {
        const { error: memberError } = await supabase
          .from('members')
          .update(memberUpdates)
          .eq('id', user.id);

        if (memberError) throw memberError;
      }

      const profileUpdates: Record<string, unknown> = { id: user.id };
      let hasProfileUpdates = false;

      if (data.full_name !== undefined) {
        profileUpdates.full_name = data.full_name.trim() || null;
        hasProfileUpdates = true;
      }

      if (data.preferences?.event_preferences !== undefined) {
        profileUpdates.event_preferences = data.preferences.event_preferences;
        hasProfileUpdates = true;
      }

      if (data.preferences?.concierge_preferences !== undefined) {
        profileUpdates.concierge_preferences = data.preferences.concierge_preferences;
        hasProfileUpdates = true;
      }

      if (hasProfileUpdates) {
        const { error: profileError } = await supabase.from('profiles').upsert(profileUpdates, {
          onConflict: 'id',
        });

        if (profileError) throw profileError;
      }

      const updatedProfile = await fetchUserProfile(user.id);
      if (!updatedProfile) throw new Error('Failed to fetch updated profile');

      setUser(updatedProfile);
      return { data: updatedProfile, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to update profile')
      };
    }
  };

  const updateEmail = async (newEmail: string, password: string) => {
    try {
      if (!user) throw new Error('No authenticated user');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password
      });

      if (signInError) throw new Error('Current password is incorrect');

      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (updateError) throw updateError;

      return {
        data: { message: 'Please check your new email for verification instructions.' },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to update email')
      };
    }
  };

  const updateMembershipLevel = async (level: 'Standard' | 'Premium' | 'Executive' | 'Founding Member') => {
    try {
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('members')
        .update({
          membership_level: level
        })
        .eq('id', user.id);

      if (error) throw error;

      // Log membership change
      const { error: logError } = await supabase
        .from('membership_changes')
        .insert({
          user_id: user.id,
          previous_level: user.membership_level,
          new_level: level
        });

      if (logError) {
        // Silently handle log error
      }

      const updatedProfile = await fetchUserProfile(user.id);
      if (!updatedProfile) throw new Error('Failed to fetch updated profile');

      setUser(updatedProfile);
      return { data: updatedProfile, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to update membership level')
      };
    }
  };

  const value = {
    user,
    profile: user,
    isLoading,
    signIn,
    sendMagicLink,
    verifyMagicLinkCode,
    signOut,
    resetPassword,
    updateProfile,
    updateEmail,
    updateMembershipLevel
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};