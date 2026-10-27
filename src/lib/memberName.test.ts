import assert from 'node:assert/strict';
import test from 'node:test';
import {
  composeFullName,
  isPlaceholderName,
  resolveFullName,
  splitFullName,
} from './memberName.ts';

test('composeFullName skips blanks', () => {
  assert.equal(composeFullName('Ada', 'Lovelace'), 'Ada Lovelace');
  assert.equal(composeFullName('Ada', ''), 'Ada');
  assert.equal(composeFullName('  Ada  ', '  Lovelace '), 'Ada Lovelace');
  assert.equal(composeFullName('', ''), '');
});

test('splitFullName keeps extra last-name tokens', () => {
  assert.deepEqual(splitFullName('Ada Lovelace'), { first_name: 'Ada', last_name: 'Lovelace' });
  assert.deepEqual(splitFullName('Jean Luc Picard'), {
    first_name: 'Jean',
    last_name: 'Luc Picard',
  });
  assert.deepEqual(splitFullName('Ada'), { first_name: 'Ada', last_name: '' });
  assert.deepEqual(splitFullName('  '), { first_name: '', last_name: '' });
});

test('isPlaceholderName matches the auth bootstrap stub', () => {
  assert.equal(isPlaceholderName('sc Member', 'sc@vesteracap.com'), true);
  assert.equal(isPlaceholderName('sc', 'sc@vesteracap.com'), true);
  assert.equal(isPlaceholderName('Ada Lovelace', 'sc@vesteracap.com'), false);
  assert.equal(isPlaceholderName('', 'sc@vesteracap.com'), true);
});

test('resolveFullName prefers a real member name over a profile stub', () => {
  assert.equal(
    resolveFullName({
      fullName: 'sc Member',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'sc@vesteracap.com',
    }),
    'Ada Lovelace'
  );
  assert.equal(
    resolveFullName({
      fullName: 'Ada Lovelace',
      firstName: 'sc',
      lastName: 'Member',
      email: 'sc@vesteracap.com',
    }),
    'Ada Lovelace'
  );
  assert.equal(
    resolveFullName({
      fullName: 'sc Member',
      firstName: 'sc',
      lastName: 'Member',
      email: 'sc@vesteracap.com',
    }),
    'sc Member'
  );
});
