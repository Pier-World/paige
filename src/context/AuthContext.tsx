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
      const { data: userData, error: userError } = await supabase
        .from('members')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (!userData) {
        throw new Error('No user profile found');
      }

      // Try to fetch profile data - use SELECT * to avoid 406 errors if columns don't exist
      let profileData: any = null;
      let onboardingCompleted = false;
      
      try {
        // Use SELECT * to avoid 406 errors when specific columns don't exist in production
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          // Profile query failed - this is OK, profile might not exist yet
          console.warn('Error fetching profile (may not exist yet):', error.message);
          onboardingCompleted = false;
        } else if (data) {
          profileData = data;
          
          // Check onboarding_completed field if it exists
          if ('onboarding_completed' in data) {
            onboardingCompleted = data.onboarding_completed === true;
          }
          
          // Fallback: If personal_context has data, user completed onboarding
          if (!onboardingCompleted && data.personal_context) {
            const hasPersonalContext = 
              typeof data.personal_context === 'object' &&
              (data.personal_context.name || data.personal_context.goals?.length > 0);
            
            if (hasPersonalContext) {
              console.log('Using personal_context as fallback indicator for completed onboarding');
              onboardingCompleted = true;
            }
          }
        }
        // If data is null, profile doesn't exist - onboardingCompleted stays false
      } catch (error) {
        // Query failed entirely - default to false so user can complete onboarding
        console.warn('Profile fetch failed, defaulting onboarding to false');
        onboardingCompleted = false;
      }

      return {
        id: userId,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        member_id: userData.member_id,
        phone: userData.phone,
        preferences: userData.preferences,
        membership_level: userData.membership_level,
        created_at: userData.created_at,
        full_name: profileData?.full_name || `${userData.first_name} ${userData.last_name}`,
        front_user_hash: profileData?.front_user_hash || null,
        membership_tier: userData.membership_level,
        onboarding_completed: onboardingCompleted,
      };
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Set a safety timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout - setting loading to false');
        setIsLoading(false);
      }
    }, 10000); // Increased to 10 seconds

    const initializeAuth = async () => {
      try {
        // Get session with retry logic
        let session = null;
        let retries = 3;
        
        while (retries > 0 && !session) {
          try {
            const result = await supabase.auth.getSession();
            session = result.data?.session;
            if (session) break;
          } catch (error) {
            console.warn(`Auth session fetch attempt failed, retries left: ${retries - 1}`, error);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }

        if (session?.user && mounted) {
          try {
            const profile = await fetchUserProfile(session.user.id);
            if (mounted) {
              if (timeoutId) clearTimeout(timeoutId);
              if (profile) {
                setUser(profile);
              }
              // Only set loading to false AFTER profile is fetched
              // This prevents race condition where user is null but loading is false
              setIsLoading(false);
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            if (mounted) {
              if (timeoutId) clearTimeout(timeoutId);
              setIsLoading(false);
            }
          }
        } else if (mounted) {
          if (timeoutId) clearTimeout(timeoutId);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          if (timeoutId) clearTimeout(timeoutId);
          setIsLoading(false);
        }
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