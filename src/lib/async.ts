/** Client-side ceiling for PostgREST reads so UI never spins unbounded. */
export const CAPITAL_SUPABASE_TIMEOUT_MS = 12_000;

export function capitalAbortSignal(ms = CAPITAL_SUPABASE_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(ms);
}

export class AsyncTimeoutError extends Error {
  readonly label: string;
  readonly ms: number;

  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`);
    this.name = 'AsyncTimeoutError';
    this.label = label;
    this.ms = ms;
  }
}

export function isAsyncTimeoutError(err: unknown): err is AsyncTimeoutError {
  return err instanceof AsyncTimeoutError;
}

export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new AsyncTimeoutError(label, ms)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export function isTransientLoadError(err: unknown): boolean {
  if (isAsyncTimeoutError(err)) return true;
  if (!err || typeof err !== 'object') return false;
  const name = 'name' in err && typeof err.name === 'string' ? err.name : '';
  const message = 'message' in err && typeof err.message === 'string' ? err.message : '';
  if (name === 'AbortError' || name === 'AuthRetryableFetchError') return true;
  if ('isAcquireTimeout' in err && err.isAcquireTimeout) return true;
  return /aborted|abort|failed to fetch|networkerror|timed out|timeout/i.test(message);
}

export async function withTransientRetry<T>(
  run: () => Promise<T>,
  options?: { attempts?: number; delayMs?: number }
): Promise<T> {
  const attempts = options?.attempts ?? 2;
  const delayMs = options?.delayMs ?? 400;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts - 1 || !isTransientLoadError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

export function describeCapitalLoadFailure(err: unknown, fallback: string): string {
  if (isTransientLoadError(err)) {
    return 'This is taking longer than expected. Check your connection, or try again in a moment.';
  }
  return err instanceof Error && err.message ? err.message : fallback;
}
