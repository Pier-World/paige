import assert from 'node:assert/strict';
import test from 'node:test';
import { accreditationPreferences } from './accreditation.ts';
import { buildDashboardOrientedSteps, type JoinedGathering } from './orientationSteps.ts';
import type { UserPreferences } from '../types/index.ts';

const joined: JoinedGathering = { id: 'dinner', title: 'Pier dinner' };

function steps(overrides: Partial<Parameters<typeof buildDashboardOrientedSteps>[0]> = {}) {
  return buildDashboardOrientedSteps({
    loading: false,
    calendarError: false,
    capitalRole: 'lp',
    firm: 'Vestera Capital Partners',
    city: 'San Francisco',
    joinedEvent: null,
    hasUpcoming: true,
    preferences: { capital_role: 'lp', firm: 'Vestera Capital Partners', primary_city: 'San Francisco' },
    ...overrides,
  });
}

test('join a gathering opens the events page instead of one registration link', () => {
  const gathering = steps().find((step) => step.id === 'gathering');
  assert.equal(gathering?.state, 'open');
  assert.equal(gathering?.href, '/events');
  assert.equal(gathering?.detail, 'See upcoming gatherings.');
  assert.equal(gathering?.href.startsWith('http'), false);
});

test('a joined gathering stays on the events page', () => {
  const gathering = steps({ joinedEvent: joined, hasUpcoming: true }).find((step) => step.id === 'gathering');
  assert.equal(gathering?.state, 'done');
  assert.equal(gathering?.href, '/events#event-dinner');
});

test('accreditation is a later step and stays open until it is confirmed', () => {
  const oriented = steps();
  assert.deepEqual(
    oriented.map((step) => step.id),
    ['role', 'place', 'gathering', 'accreditation']
  );
  const accreditation = oriented[3];
  assert.equal(accreditation.state, 'open');
  assert.equal(accreditation.href, '/profile/personal#accreditation');
  assert.equal(accreditation.detail, 'Confirm whether you are an accredited investor.');
});

test('accreditation confirmed in onboarding or profile completes the step', () => {
  const confirmed = accreditationPreferences(
    { confirmed: true, basis: 'net_worth', qualifiedPurchaser: false, declined: false },
    '2026-10-27T00:00:00.000Z'
  ) as UserPreferences;
  const declined = accreditationPreferences(
    { confirmed: false, basis: null, qualifiedPurchaser: null, declined: true },
    '2026-10-27T00:00:00.000Z'
  ) as UserPreferences;

  const verified = steps({ preferences: confirmed }).find((step) => step.id === 'accreditation');
  assert.equal(verified?.state, 'done');
  assert.equal(verified?.detail, 'Verified · Net worth');

  const notAccredited = steps({ preferences: declined }).find((step) => step.id === 'accreditation');
  assert.equal(notAccredited?.state, 'done');
  assert.equal(notAccredited?.detail, 'Not accredited');

  const legacy = steps({ preferences: { accredited_investor: 'Yes' } }).find(
    (step) => step.id === 'accreditation'
  );
  assert.equal(legacy?.state, 'open');
});
