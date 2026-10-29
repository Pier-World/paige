import { createClient, type Session } from '@supabase/supabase-js';
import { withTimeout } from './async';
import { shouldClearLocalSessionOnInitError } from './authErrors';
import {
  accessTokenStillValid,
  readStoredAccessSession,
  sessionNeedsRefresh,
} from './sessionRefresh';
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
const AUTH_STORAGE_KEY = 'pier_auth_token';
const SESSION_REFRESH_TIMEOUT_MS = 8_000;

export const supabase = createClient<Database>(
  cleanSupabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: AUTH_STORAGE_KEY,
      // Disable verbose debug logging to reduce console noise
      debug: false
    }
  }
);

const originalGetSession = supabase.auth.getSession.bind(supabase.auth);

function storedSession() {
  return readStoredAccessSession(window.localStorage, AUTH_STORAGE_KEY);
}

// Page loads call getSession before every query. Keep a still-valid access
// token in use when the refresh request times out, instead of failing the page.
supabase.auth.getSession = async () => {
  const stored = storedSession();
  if (stored && !sessionNeedsRefresh(stored.expires_at)) {
    return { data: { session: stored as unknown as Session }, error: null };
  }

  try {
    const result = await withTimeout(originalGetSession(), SESSION_REFRESH_TIMEOUT_MS, 'session');
    if (result.error && shouldClearLocalSessionOnInitError(result.error.message)) return result;
    if (result.data.session || !stored || !accessTokenStillValid(stored.expires_at)) return result;
    return { data: { session: stored as unknown as Session }, error: null };
  } catch (error) {
    if (stored && accessTokenStillValid(stored.expires_at)) {
      return { data: { session: stored as unknown as Session }, error: null };
    }
    throw error;
  }
};
