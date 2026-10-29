import assert from 'node:assert/strict';
import test from 'node:test';
import { AsyncTimeoutError, isTransientLoadError, withTransientRetry } from './async.ts';

test('network and timeout failures are transient', () => {
  assert.equal(isTransientLoadError(new TypeError('Failed to fetch')), true);
  assert.equal(isTransientLoadError(new AsyncTimeoutError('events', 12_000)), true);
  assert.equal(isTransientLoadError(Object.assign(new Error('lock'), { name: 'AuthRetryableFetchError' })), true);
  assert.equal(isTransientLoadError(new Error('Unable to load capital events: permission denied')), false);
});

test('a transient page load is retried once', async () => {
  let calls = 0;
  const result = await withTransientRetry(
    async () => {
      calls += 1;
      if (calls === 1) throw new TypeError('Failed to fetch');
      return 'events';
    },
    { delayMs: 0 }
  );
  assert.equal(result, 'events');
  assert.equal(calls, 2);
});

test('a real load error is not retried', async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      withTransientRetry(
        async () => {
          calls += 1;
          throw new Error('Unable to load capital events: permission denied');
        },
        { delayMs: 0 }
      ),
    /permission denied/
  );
  assert.equal(calls, 1);
});
