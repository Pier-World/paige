import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Remove trailing slashes from URL if present
const cleanSupabaseUrl = supabaseUrl.replace(/\/$/, '');

// Get the site URL for redirects (unused for now, but may be needed for OAuth redirects)
// const siteUrl = window.location.origin;

export const supabase = createClient<Database>(
  cleanSupabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'pier_auth_token',
      // Disable verbose debug logging to reduce console noise
      debug: false
    }
  }
);