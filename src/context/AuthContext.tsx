import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';
import { loadFrontScript, initFrontChat } from '../lib/frontChat';

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

      // Try to fetch profile data, but handle case where onboarding_completed column might not exist
      let profileData: any = null;
      let onboardingCompleted = false;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, front_user_hash, onboarding_completed')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          // If column doesn't exist, error will be thrown - default to false
          console.warn('Error fetching onboarding status (column may not exist yet):', error);
          onboardingCompleted = false;
        } else {
          profileData = data;
          // Default to false if null/undefined (column doesn't exist or is null)
          onboardingCompleted = data?.onboarding_completed ?? false;
        }
      } catch (error) {
        // Column likely doesn't exist - default to false
        console.warn('onboarding_completed column may not exist, defaulting to false');
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
          if (timeoutId) clearTimeout(timeoutId);
          setIsLoading(false);
          
          try {
            const profile = await fetchUserProfile(session.user.id);
            if (profile && mounted) {
              setUser(profile);
              // Front Chat is initialized directly in index.html
            } else if (mounted) {
              // User exists but profile fetch failed - still set loading to false
              setIsLoading(false);
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            if (mounted) {
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

              // Front Chat is initialized directly in index.html
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
        return {
          data: null,
          error: signInError
        };
      }

      if (!data.user) {
        setIsLoading(false);
        return {
          data: null,
          error: new Error('No user returned from authentication')
        };
      }

      const profile = await fetchUserProfile(data.user.id);
      if (!profile) {
        setIsLoading(false);
        return {
          data: null,
          error: new Error('Failed to fetch user profile')
        };
      }

      setIsLoading(false);
      return { data: profile, error: null };
    } catch (error) {
      setIsLoading(false);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('An unexpected error occurred')
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
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`
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