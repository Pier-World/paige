/** Client-side ceiling for PostgREST reads so UI never spins unbounded (see Workstream B). */
export const CAPITAL_SUPABASE_TIMEOUT_MS = 25_000;

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

export function describeCapitalLoadFailure(err: unknown, fallback: string): string {
  if (isAsyncTimeoutError(err)) {
    const seconds = Math.round(err.ms / 1000);
    return `This is taking longer than expected (over ${seconds}s). Check your connection, or try again in a moment.`;
  }
  return err instanceof Error ? err.message : fallback;
}
