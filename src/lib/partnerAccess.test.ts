import assert from 'node:assert/strict';
import test from 'node:test';
import { partnerAccessLabel } from './partnerAccess.ts';

test('Founding Member partners are labeled Pier+', () => {
  assert.equal(partnerAccessLabel('Founding Member'), 'Pier+');
  assert.equal(partnerAccessLabel('  founding   member '), 'Pier+');
});

test('Premium, Executive, and Standard partners have no label', () => {
  assert.equal(partnerAccessLabel('Premium'), null);
  assert.equal(partnerAccessLabel('Executive'), null);
  assert.equal(partnerAccessLabel('Standard'), null);
  assert.equal(partnerAccessLabel(''), null);
  assert.equal(partnerAccessLabel(null), null);
  assert.equal(partnerAccessLabel(undefined), null);
});
