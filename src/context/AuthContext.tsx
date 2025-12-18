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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, front_user_hash')
        .eq('id', userId)
        .maybeSingle();

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
        membership_tier: userData.membership_level
      };
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const timeout = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 5000);

    const initializeAuth = async () => {
      try {
        // Get session synchronously first to avoid flash of redirect
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          clearTimeout(timeout);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          clearTimeout(timeout);
          // Set loading to false first to prevent redirect flash
          setIsLoading(false);
          const profile = await fetchUserProfile(session.user.id);
          if (profile && mounted) {
            setUser(profile);
            // Front Chat is initialized directly in index.html
          } else if (mounted) {
            // If profile fetch fails, user is still null but we're done loading
            setIsLoading(false);
          }
        } else {
          // No session - user is not authenticated
          clearTimeout(timeout);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          clearTimeout(timeout);
          setIsLoading(false);
        }
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;

          if (event === 'SIGNED_IN' && session?.user) {
            setIsLoading(true);
            const profile = await fetchUserProfile(session.user.id);
            if (profile && mounted) {
              setUser(profile);
              setIsLoading(false);
              // Front Chat is initialized directly in index.html
            } else if (mounted) {
              setIsLoading(false);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsLoading(false);
            clearAuthData();
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Refresh user profile on token refresh to ensure data is up to date
            const profile = await fetchUserProfile(session.user.id);
            if (profile && mounted) {
              setUser(profile);
            }
          }
        }
      );

      authSubscription = subscription;
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(timeout);
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

      // Update members table
      const { error: membersError } = await supabase
        .from('members')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          preferences: data.preferences
        })
        .eq('id', user.id);

      if (membersError) throw membersError;

      // Update profiles table if full_name is present or names are updated
      if (data.first_name || data.last_name || data.full_name) {
        const firstName = data.first_name || (data.full_name ? data.full_name.split(' ')[0] : user.first_name);
        const lastName = data.last_name || (data.full_name ? data.full_name.split(' ').slice(1).join(' ') : user.last_name);
        const fullName = data.full_name || `${firstName} ${lastName}`.trim();

        const { error: profilesError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            first_name: firstName,
            last_name: lastName
          })
          .eq('id', user.id);
        
        if (profilesError) {
          console.error('Error updating profiles table:', profilesError);
          // If profiles table update fails, we still proceed if members table update worked,
          // but we log it. In some schemas, first_name/last_name might not exist in profiles.
          if (profilesError.code === '42703') { // undefined_column
            const { error: fallbackError } = await supabase
              .from('profiles')
              .update({
                full_name: fullName
              })
              .eq('id', user.id);
            
            if (fallbackError) {
              console.error('Fallback profile update also failed:', fallbackError);
            }
          }
        }
      }

      // Update profiles table for phone_number if phone is updated
      if (data.phone) {
        const { error: phoneUpdateError } = await supabase
          .from('profiles')
          .update({
            phone_number: data.phone
          })
          .eq('id', user.id);
        
        if (phoneUpdateError) {
          console.error('Error updating phone_number in profiles:', phoneUpdateError);
        }
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