import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalProfileHref, isProfileSection } from './profileSections.ts';

test('bare /profile lands on personal information', () => {
  assert.equal(canonicalProfileHref(undefined, ''), '/profile/personal');
});

test('legacy edit query maps onto section pages', () => {
  assert.equal(canonicalProfileHref(undefined, 'edit=personal'), '/profile/personal');
  assert.equal(canonicalProfileHref(undefined, 'edit=capital'), '/profile/capital');
  assert.equal(canonicalProfileHref(undefined, 'edit=events'), '/profile/events');
  assert.equal(canonicalProfileHref(undefined, 'edit=member'), '/profile/privacy');
  assert.equal(canonicalProfileHref(undefined, 'edit=notifications'), '/profile/notifications');
});

test('legacy member path and accreditation focus canonicalize', () => {
  assert.equal(canonicalProfileHref('member', ''), '/profile/privacy');
  assert.equal(
    canonicalProfileHref(undefined, 'focus=accreditation', '#accreditation'),
    '/profile/personal#accreditation'
  );
  assert.equal(
    canonicalProfileHref('personal', 'focus=accreditation'),
    '/profile/personal#accreditation'
  );
});

test('canonical section URLs do not redirect', () => {
  assert.equal(canonicalProfileHref('personal', ''), null);
  assert.equal(canonicalProfileHref('privacy', '', '#accreditation'), null);
  assert.equal(canonicalProfileHref('personal', '', '#accreditation'), null);
  assert.equal(canonicalProfileHref(undefined, '', '#personal'), '/profile/personal');
});

test('unknown sections fall back to personal', () => {
  assert.equal(isProfileSection('personal'), true);
  assert.equal(isProfileSection('member'), false);
  assert.equal(canonicalProfileHref('unknown', ''), '/profile/personal');
});
