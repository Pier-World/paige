import React, { createContext, useContext, useEffect, useState } from 'react';
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

      let profileData: any = null;
      // Prefer onboarding_completed from members (denormalized, always present); fallback to profiles
      let onboardingCompleted = (userData as { onboarding_completed?: boolean })?.onboarding_completed === true;

      if (!onboardingCompleted) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, onboarding_completed, personal_context')
            .eq('id', userId)
            .maybeSingle();

          if (error) {
            console.warn('Error fetching profile (may not exist yet):', error.message);
          } else if (data) {
            profileData = data;
            if (data.onboarding_completed === true) onboardingCompleted = true;
            else if (data.personal_context && typeof data.personal_context === 'object') {
              const pc = data.personal_context as { name?: string; goals?: unknown[] };
              if (pc.name || (Array.isArray(pc.goals) && pc.goals.length > 0)) onboardingCompleted = true;
            }
          }
        } catch {
          console.warn('Profile fetch failed');
        }
      } else {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, personal_context')
            .eq('id', userId)
            .maybeSingle();
          if (data) profileData = data;
        } catch {
          // optional profile for display name
        }
      }

      return {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        member_id: memberId,
        phone: userData.phone ?? undefined,
        preferences: userData.preferences ?? undefined,
        membership_level: membershipLevel,
        created_at,
        full_name: profileData?.full_name || `${firstName} ${lastName}`.trim() || 'Member',
        front_user_hash: (profileData as any)?.front_user_hash ?? null,
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
        // Get session with hard timeout so we don't hang (e.g. Supabase unreachable)
        const session = await Promise.race([
          supabase.auth.getSession().then((r) => r.data?.session ?? null),
          new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), SESSION_FETCH_TIMEOUT_MS)
          ),
        ]);

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
      } catch (err) {
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
        // Convert Supabase error messages to user-friendly messages
        let friendlyMessage = 'Unable to sign in. Please try again.';
        const errorMsg = signInError.message?.toLowerCase() || '';
        
        if (errorMsg.includes('invalid login credentials') || 
            errorMsg.includes('invalid_credentials') ||
            errorMsg.includes('invalid password') ||
            errorMsg.includes('wrong password')) {
          friendlyMessage = 'Incorrect email or password. Please try again.';
        } else if (errorMsg.includes('email not confirmed')) {
          friendlyMessage = 'Please verify your email address before signing in.';
        } else if (errorMsg.includes('too many requests') || errorMsg.includes('rate limit')) {
          friendlyMessage = 'Too many sign in attempts. Please wait a moment and try again.';
        } else if (errorMsg.includes('user not found') || errorMsg.includes('no user')) {
          friendlyMessage = 'No account found with this email address.';
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          friendlyMessage = 'Connection error. Please check your internet and try again.';
        }
        
        return {
          data: null,
          error: new Error(friendlyMessage)
        };
      }

      if (!data.user) {
        setIsLoading(false);
        return {
          data: null,
          error: new Error('Unable to sign in. Please try again.')
        };
      }

      const profile = await fetchUserProfile(data.user.id);
      if (!profile) {
        setIsLoading(false);
        return {
          data: null,
          error: new Error('Account found but profile could not be loaded. Please contact support.')
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
        error: new Error('An unexpected error occurred. Please try again.')
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
        const friendlyMessage =
          error.message?.toLowerCase().includes('not found') ||
          error.message?.toLowerCase().includes('no user')
            ? 'No account found with this email. Please contact support.'
            : error.message;
        return { error: new Error(friendlyMessage) };
      }
      return { error: null };
    } catch (err) {
      console.error('Send magic link error:', err);
      return {
        error: err instanceof Error ? err : new Error('Failed to send access code'),
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
        return {
          data: null,
          error: new Error(verifyError.message || 'Invalid or expired code. Please try again.'),
        };
      }
      if (!data?.user) {
        return { data: null, error: new Error('Verification failed. Please try again.') };
      }
      const profile = await fetchUserProfile(data.user.id);
      if (!profile) {
        return {
          data: null,
          error: new Error('Account found but profile could not be loaded. Please contact support.'),
        };
      }
      setUser(profile);
      return { data: profile, error: null };
    } catch (err) {
      console.error('Verify OTP error:', err);
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Verification failed. Please try again.'),
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
    } catch (error) {
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

      const { error } = await supabase
        .from('members')
        .update({
          phone: data.phone,
          preferences: data.preferences
        })
        .eq('id', user.id);

      if (error) throw error;

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