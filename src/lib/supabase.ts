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

const AUTH_LOCK_WAIT_MS = 10_000;
const FETCH_DEADLINE_MS = 12_000;

/**
 * In-tab lock. The default browser lock waits forever (`acquireTimeout` of -1),
 * so one stuck tab freezes every later read until the UI gives up. A deadline
 * here lets the page fail and retry instead of sitting on a blank switch.
 */
const heldAuthLocks = new Map<string, Promise<unknown>>();

function inProcessAuthLock<R>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  const previous = heldAuthLocks.get(name) ?? Promise.resolve();
  const waitMs = acquireTimeout < 0 ? AUTH_LOCK_WAIT_MS : acquireTimeout;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Auth lock "${name}" timed out`) as Error & { isAcquireTimeout?: boolean };
      err.isAcquireTimeout = true;
      reject(err);
    }, waitMs);
  });

  const run = Promise.race([previous.then(() => null, () => null), timeout])
    .then((value) => {
      if (timer) clearTimeout(timer);
      return value;
    })
    .catch((err: unknown) => {
      if (timer) clearTimeout(timer);
      if (err && typeof err === 'object' && 'isAcquireTimeout' in err && err.isAcquireTimeout) {
        throw err;
      }
      return null;
    })
    .then(() => fn());

  const settled = run.then(
    () => undefined,
    async (err: unknown) => {
      if (err && typeof err === 'object' && 'isAcquireTimeout' in err && err.isAcquireTimeout) {
        await previous.then(() => undefined, () => undefined);
      }
    }
  );
  heldAuthLocks.set(name, settled);

  return run;
}

function fetchWithDeadline(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_DEADLINE_MS);
  const callerSignal = init?.signal;
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

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
      debug: false,
      lock: inProcessAuthLock,
    },
    global: {
      fetch: fetchWithDeadline,
    },
  }
);