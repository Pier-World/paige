/**
 * Supabase refreshes the access token 90s before it expires, and that refresh
 * holds the auth lock. A timed-out refresh then fails every page load.
 * Data reads keep using a token that is still valid and only wait on a refresh
 * in the last few seconds.
 */
export const ACCESS_TOKEN_REFRESH_LEEWAY_MS = 15_000;

export type StoredAccessSession = {
  access_token: string;
  expires_at: number;
  user: { id: string };
};

export function isStoredAccessSession(value: unknown): value is StoredAccessSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<StoredAccessSession> & { user?: { id?: unknown } };
  return (
    typeof session.access_token === 'string' &&
    session.access_token.length > 0 &&
    typeof session.expires_at === 'number' &&
    Number.isFinite(session.expires_at) &&
    typeof session.user?.id === 'string' &&
    session.user.id.length > 0
  );
}

export function accessTokenStillValid(expiresAtSeconds: number, now = Date.now()): boolean {
  return expiresAtSeconds * 1000 > now;
}

export function sessionNeedsRefresh(
  expiresAtSeconds: number | null | undefined,
  now = Date.now()
): boolean {
  if (typeof expiresAtSeconds !== 'number' || !Number.isFinite(expiresAtSeconds)) return true;
  return !accessTokenStillValid(expiresAtSeconds, now + ACCESS_TOKEN_REFRESH_LEEWAY_MS);
}

export function readStoredAccessSession(
  storage: Pick<Storage, 'getItem'>,
  key: string
): StoredAccessSession | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredAccessSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
