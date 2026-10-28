import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONCIERGE_EMAIL,
  DATA_ROOM_EMAIL,
  conciergeMailto,
  dataRoomMailto,
} from './conciergeMailto.ts';

test('data room requests go to Vestera, not concierge', () => {
  const href = dataRoomMailto('Arbor SPV VII');
  const url = new URL(href);
  assert.equal(DATA_ROOM_EMAIL, 'bpucci@vesteracap.com');
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, DATA_ROOM_EMAIL);
  assert.equal(url.searchParams.get('subject'), 'Requesting Data Room: Arbor SPV VII');
  assert.equal(href.includes(CONCIERGE_EMAIL), false);
});

test('concierge mail still uses the general inbox', () => {
  const href = conciergeMailto('Hello');
  const url = new URL(href);
  assert.equal(CONCIERGE_EMAIL, 'hello@joinpier.com');
  assert.equal(url.pathname, CONCIERGE_EMAIL);
});
