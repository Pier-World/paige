import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONCIERGE_EMAIL,
  DATA_ROOM_EMAIL,
  SUBMIT_OPPORTUNITY_EMAIL,
  conciergeMailto,
  dataRoomMailto,
  opportunityInquiryMailto,
  submitOpportunityMailto,
  upgradeRequestMailto,
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

test('opportunity inquiries name the fund and email Vestera', () => {
  const href = opportunityInquiryMailto('Northline Fund IV');
  const url = new URL(href);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, DATA_ROOM_EMAIL);
  assert.equal(url.searchParams.get('subject'), 'Opportunity inquiry: Northline Fund IV');
  assert.match(url.searchParams.get('body') ?? '', /Northline Fund IV/);
  assert.equal(href.includes(CONCIERGE_EMAIL), false);
});

test('Pier+ upgrade requests email Vestera', () => {
  const href = upgradeRequestMailto();
  const url = new URL(href);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, DATA_ROOM_EMAIL);
  assert.equal(url.searchParams.get('subject'), 'Pier+ upgrade request');
  assert.equal(href.includes(CONCIERGE_EMAIL), false);
});

test('dealflow submissions email sc@vesteracap.com with a body template', () => {
  const href = submitOpportunityMailto();
  const url = new URL(href);
  assert.equal(SUBMIT_OPPORTUNITY_EMAIL, 'sc@vesteracap.com');
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, SUBMIT_OPPORTUNITY_EMAIL);
  assert.equal(url.searchParams.get('subject'), 'Pier dealflow submission');
  assert.match(url.searchParams.get('body') ?? '', /Type \(fund \/ co-invest/);
  assert.equal(href.includes(CONCIERGE_EMAIL), false);
  assert.equal(href.includes('bpucci@vesteracap.com'), false);
});
