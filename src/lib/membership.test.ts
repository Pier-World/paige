import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPierPlus,
  isStaffAdmin,
  membershipBadgeLabel,
  membershipIsPierPlus,
} from './membership.ts';

test('Standard is never Pier+', () => {
  assert.equal(membershipIsPierPlus('Standard'), false);
  assert.equal(isPierPlus({ membership_level: 'Standard', role: 'member' }), false);
});

test('admin role does not grant Pier+ in the member UI', () => {
  assert.equal(isPierPlus({ membership_level: 'Standard', role: 'admin' }), false);
  assert.equal(isStaffAdmin({ membership_level: 'Standard', role: 'admin' }), true);
});

test('Premium, Executive, and Founding Member are Pier+', () => {
  assert.equal(isPierPlus({ membership_level: 'Premium', role: 'member' }), true);
  assert.equal(isPierPlus({ membership_level: 'Executive', role: 'member' }), true);
  assert.equal(isPierPlus({ membership_level: 'Founding Member', role: 'member' }), true);
});

test('billing leftovers and aliases are not Pier+', () => {
  assert.equal(membershipIsPierPlus('pro'), false);
  assert.equal(membershipIsPierPlus('Pro'), false);
  assert.equal(membershipIsPierPlus('Core'), false);
  assert.equal(membershipIsPierPlus('standard'), false);
  assert.equal(isPierPlus({ membership_level: 'Standard', role: 'member' }), false);
});

test('badge copy follows membership_level, not role', () => {
  assert.equal(membershipBadgeLabel(null), 'Community');
  assert.equal(membershipBadgeLabel({ membership_level: 'Standard', role: 'admin' }), 'Community');
  assert.equal(membershipBadgeLabel({ membership_level: 'Premium', role: 'member' }), 'Member');
  assert.equal(membershipBadgeLabel({ membership_level: 'Executive', role: 'member' }), 'Member');
  assert.equal(membershipBadgeLabel({ membership_level: 'Founding Member', role: 'member' }), 'Member');
});
