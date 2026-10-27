import assert from 'node:assert/strict';
import test from 'node:test';
import {
  accreditationPreferences,
  answerAccredited,
  answerQualifiedPurchaser,
  draftFromAccreditation,
  emptyAccreditationDraft,
  isAccreditationDraftComplete,
  parseAccreditationDraft,
  readAccreditation,
} from './accreditation.ts';

test('a yes/no answer without a basis is not verified', () => {
  assert.equal(readAccreditation({ accredited_investor: 'Yes' }), null);
  assert.equal(readAccreditation({ accredited_investor: 'No' }), null);
});

test('salary, net worth, and license attestations round-trip', () => {
  for (const basis of ['income', 'net_worth', 'license'] as const) {
    const patch = accreditationPreferences(
      {
        confirmed: true,
        basis,
        qualifiedPurchaser: basis === 'license',
        declined: false,
      },
      '2026-10-27T00:00:00.000Z'
    );
    assert.equal(patch?.accredited_investor, 'Yes');
    const record = readAccreditation(patch ?? undefined);
    assert.equal(record?.basis, basis);
    assert.equal(record?.qualified_purchaser, basis === 'license');
    assert.equal(draftFromAccreditation(record).basis, basis);
  }
});

test('declining accreditation clears the qualification', () => {
  const patch = accreditationPreferences(
    { confirmed: false, basis: null, qualifiedPurchaser: null, declined: true },
    '2026-10-27T00:00:00.000Z'
  );
  assert.equal(patch?.accredited_investor, 'No');
  assert.equal(patch?.accreditation?.accredited, false);
  assert.equal(isAccreditationDraftComplete(draftFromAccreditation(readAccreditation(patch))), true);
});

test('a qualified-purchaser answer does not by itself count as accredited', () => {
  const draft = answerQualifiedPurchaser(emptyAccreditationDraft(), true);
  assert.equal(draft.confirmed, false);
  assert.equal(draft.declined, false);
  assert.equal(isAccreditationDraftComplete(draft), false);
  assert.equal(accreditationPreferences(draft), null);
});

test('saying no is complete and clears a previous qualification', () => {
  const yes = answerAccredited(emptyAccreditationDraft(), true);
  const declined = answerAccredited(
    { ...yes, basis: 'income', qualifiedPurchaser: true },
    false
  );
  assert.equal(declined.declined, true);
  assert.equal(declined.basis, null);
  assert.equal(declined.qualifiedPurchaser, null);
  assert.equal(isAccreditationDraftComplete(declined), true);
});

test('an unfinished confirmation is not saved', () => {
  const draft = parseAccreditationDraft({
    confirmed: true,
    basis: 'income',
    qualifiedPurchaser: null,
    declined: false,
  });
  assert.equal(isAccreditationDraftComplete(draft), false);
  assert.equal(accreditationPreferences(draft), null);
});
