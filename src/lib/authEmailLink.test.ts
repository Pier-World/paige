import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { isRetryableOtpFailure, parseEmailLinkType } from './authEmailLink.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('parseEmailLinkType accepts only GoTrue email OTP types', () => {
  assert.equal(parseEmailLinkType('email'), 'email');
  assert.equal(parseEmailLinkType('invite'), 'invite');
  assert.equal(parseEmailLinkType('recovery'), 'recovery');
  assert.equal(parseEmailLinkType('signup'), 'signup');
  assert.equal(parseEmailLinkType('magiclink'), 'magiclink');
  assert.equal(parseEmailLinkType('email_change'), 'email_change');
  assert.equal(parseEmailLinkType('EMAIL'), null);
  assert.equal(parseEmailLinkType('sms'), null);
  assert.equal(parseEmailLinkType(''), null);
  assert.equal(parseEmailLinkType(null), null);
});

test('isRetryableOtpFailure retries mismatched or consumed codes only', () => {
  assert.equal(isRetryableOtpFailure('Token has expired or is invalid', 'otp_expired'), true);
  assert.equal(isRetryableOtpFailure('Email link is invalid or has expired', undefined), true);
  assert.equal(isRetryableOtpFailure('Too many requests', undefined), false);
  assert.equal(isRetryableOtpFailure('Failed to fetch', undefined), false);
  assert.equal(isRetryableOtpFailure(undefined, undefined), false);
});

test('auth email templates do not include a prefetchable GoTrue verify URL', () => {
  const files = [
    'magic-link.html',
    'invite-user.html',
    'confirm-signup.html',
    'reset-password.html',
    'change-email.html',
    'reauthentication.html',
  ];
  for (const file of files) {
    const html = readFileSync(join(root, 'email-templates', file), 'utf8');
    assert.equal(html.includes('.ConfirmationURL'), false, `${file} still uses ConfirmationURL`);
    assert.equal(html.includes('/auth/v1/verify'), false, `${file} links at GoTrue verify`);
  }
});
