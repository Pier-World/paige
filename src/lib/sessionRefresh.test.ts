import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACCESS_TOKEN_REFRESH_LEEWAY_MS,
  accessTokenStillValid,
  readStoredAccessSession,
  sessionNeedsRefresh,
} from './sessionRefresh.ts';

const now = Date.parse('2026-10-28T17:00:00.000Z');

function session(expiresAtSeconds: number) {
  return {
    access_token: 'access',
    refresh_token: 'refresh',
    expires_at: expiresAtSeconds,
    user: { id: 'user-1' },
  };
}

test('a token with time left does not need a refresh', () => {
  const expiresAt = Math.floor((now + 2 * 60_000) / 1000);
  assert.equal(sessionNeedsRefresh(expiresAt, now), false);
  assert.equal(accessTokenStillValid(expiresAt, now), true);
});

test('a token inside the leeway needs a refresh but is still usable', () => {
  const expiresAt = Math.floor((now + ACCESS_TOKEN_REFRESH_LEEWAY_MS - 1_000) / 1000);
  assert.equal(sessionNeedsRefresh(expiresAt, now), true);
  assert.equal(accessTokenStillValid(expiresAt, now), true);
});

test('an expired token needs a refresh and cannot be reused', () => {
  const expiresAt = Math.floor((now - 5_000) / 1000);
  assert.equal(sessionNeedsRefresh(expiresAt, now), true);
  assert.equal(accessTokenStillValid(expiresAt, now), false);
  assert.equal(sessionNeedsRefresh(null, now), true);
  assert.equal(sessionNeedsRefresh(undefined, now), true);
});

test('stored sessions are read only when they can authorize a request', () => {
  const expiresAt = Math.floor(now / 1000) + 3600;
  const storage = {
    getItem(key: string) {
      assert.equal(key, 'pier_auth_token');
      return JSON.stringify(session(expiresAt));
    },
  };
  assert.deepEqual(readStoredAccessSession(storage, 'pier_auth_token')?.user.id, 'user-1');
  assert.equal(readStoredAccessSession({ getItem: () => 'not-json' }, 'pier_auth_token'), null);
  assert.equal(readStoredAccessSession({ getItem: () => null }, 'pier_auth_token'), null);
  assert.equal(
    readStoredAccessSession({ getItem: () => JSON.stringify({ access_token: 'x' }) }, 'pier_auth_token'),
    null
  );
});
