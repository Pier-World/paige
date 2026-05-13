import { useEffect } from 'react';
import Intercom from '@intercom/messenger-js-sdk';
import { supabase } from '../lib/supabase';

interface IntercomProviderProps {
  children: React.ReactNode;
}

export function IntercomProvider({ children }: IntercomProviderProps) {
  useEffect(() => {
    const initializeIntercom = async () => {
      try {
        const path = window.location.pathname;
        if (path === '/login' || path === '/forgot-password') {
          return;
        }

        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.log('No authenticated user, skipping Intercom initialization');
          return;
        }

        // Get user profile for additional context - use SELECT * to avoid 406 if columns missing
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        // Get membership data
        const { data: member } = await supabase
          .from('members')
          .select('membership_level')
          .eq('id', user.id)
          .single();

        // Sync user to Intercom (backend will handle this via webhook or separate sync)
        // For now, we'll use user.id as external_id which Intercom will recognize
        
        // Initialize Intercom
        Intercom({
          app_id: 'w43sil3r',
          user_id: user.id, // This becomes external_id in Intercom
          name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pier Member',
          email: user.email,
          phone: profile?.phone_number || undefined,
          created_at: Math.floor(new Date(user.created_at).getTime() / 1000), // Unix timestamp in seconds
          
          // Custom attributes
          membership_level: member?.membership_level || 'Standard',
          user_type: 'member',
          
          // Styling to match Pier design
          action_color: '#c9b896',
          background_color: '#0a0a0a',
          
          // Hide default launcher - we use our own HumanConcierge component instead
          // This prevents overlapping buttons at the bottom-right corner
          hide_default_launcher: true,
        });

        // Sync user to Intercom backend (optional - webhook will handle on first message)
        // This ensures user exists in Intercom before they send a message
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          if (supabaseUrl) {
            // Call sync function (non-blocking)
            fetch(`${supabaseUrl}/functions/v1/sync-user-to-intercom`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
              }),
            }).catch(err => {
              console.warn('Failed to sync user to Intercom (non-critical):', err);
            });
          }
        } catch (err) {
          // Non-critical, continue
          console.warn('User sync failed (non-critical):', err);
        }

        console.log('✅ Intercom initialized for:', user.email);
      } catch (error) {
        console.error('❌ Intercom initialization failed:', error);
      }
    };

    initializeIntercom();

    // Cleanup on unmount
    return () => {
      if (window.Intercom) {
        window.Intercom('shutdown');
      }
    };
  }, []);

  return <>{children}</>;
}

// TypeScript declarations
declare global {
  interface Window {
    Intercom: any;
    intercomSettings: any;
  }
}

