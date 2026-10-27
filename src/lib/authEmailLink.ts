/**
 * Email links must not hit GoTrue's GET /verify URL. Mail scanners prefetch that
 * URL, consume the one-time token, and the 6-digit code in the same email dies
 * with otp_expired. Templates link to /auth/confirm, which verifies only after
 * a click, via verifyOtp({ token_hash }).
 */

export const EMAIL_LINK_TYPES = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
] as const;

export type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];

/** Login-code order. Magic-link mail uses `email`; dashboard invites use `invite`. */
export const SIGN_IN_CODE_TYPES = ['email', 'invite', 'signup'] as const satisfies readonly EmailLinkType[];

export function parseEmailLinkType(value: string | null | undefined): EmailLinkType | null {
  if (!value) return null;
  return (EMAIL_LINK_TYPES as readonly string[]).includes(value) ? (value as EmailLinkType) : null;
}

/**
 * A failed verify against the wrong token type looks the same as an expired
 * code (`otp_expired`). Try the next sign-in type. Stop on rate limits and
 * transport errors so we don't burn extra attempts.
 */
export function isRetryableOtpFailure(message: string | undefined, code: string | undefined): boolean {
  const blob = `${message ?? ''} ${code ?? ''}`.toLowerCase();
  if (blob.includes('rate') || blob.includes('too many')) return false;
  if (blob.includes('network') || blob.includes('fetch') || blob.includes('failed to fetch')) return false;
  return blob.includes('expired') || blob.includes('invalid') || blob.includes('otp') || blob.includes('token');
}
