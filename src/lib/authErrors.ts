/**
 * User-facing auth copy and Supabase error mapping.
 * Optional override: VITE_MARKETING_APPLY_URL (see project env docs).
 */
export type AuthFlowMessage =
  | { kind: 'plain'; text: string }
  | {
      kind: 'membership';
      intro: string;
      linkLabel: string;
      applyUrl: string;
    };

const DEFAULT_APPLY_URL = 'https://joinpier.com/sign-up';

export function getMarketingApplyUrl(): string {
  const fromEnv = import.meta.env.VITE_MARKETING_APPLY_URL as string | undefined;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  return DEFAULT_APPLY_URL;
}

function membershipMessage(): AuthFlowMessage {
  return {
    kind: 'membership',
    intro:
      "We couldn't find an active Pier membership for this email. If you'd like to join, ",
    linkLabel: 'apply here',
    applyUrl: getMarketingApplyUrl(),
  };
}

function looksLikeOtpSendNoMembership(raw: string): boolean {
  const m = raw.toLowerCase();
  return (
    m.includes('signups not allowed') ||
    m.includes('signup_disabled') ||
    m.includes('sign up not allowed') ||
    m.includes('email not found') ||
    m.includes('user not found') ||
    m.includes('no user') ||
    m.includes('not found') ||
    (m.includes('otp') && m.includes('not allowed'))
  );
}

function looksLikeInvalidRefreshToken(raw: string): boolean {
  const m = raw.toLowerCase();
  return (
    m.includes('invalid refresh token') ||
    m.includes('refresh token not found')
  );
}

/** Clears bad local session state when Supabase reports an unusable refresh token. */
export function shouldClearLocalSessionOnInitError(message: string | undefined): boolean {
  if (!message) return false;
  return looksLikeInvalidRefreshToken(message);
}

/**
 * Map Supabase / network messages to UI-safe copy.
 */
export function mapAuthErrorMessage(
  rawMessage: string | undefined,
  context: 'otp_send' | 'otp_verify' | 'password' | 'profile'
): AuthFlowMessage {
  const raw = (rawMessage || '').trim();
  const m = raw.toLowerCase();

  if (context === 'profile') {
    return membershipMessage();
  }

  if (context === 'otp_send') {
    if (looksLikeOtpSendNoMembership(raw)) {
      return membershipMessage();
    }
    if (m.includes('too many requests') || m.includes('rate limit')) {
      return { kind: 'plain', text: 'Too many attempts. Please wait a moment and try again.' };
    }
    if (m.includes('network') || m.includes('fetch')) {
      return { kind: 'plain', text: 'Connection error. Please check your internet and try again.' };
    }
    return { kind: 'plain', text: raw || 'Unable to send a sign-in code. Please try again.' };
  }

  if (context === 'otp_verify') {
    if (m.includes('expired') || m.includes('has expired')) {
      return { kind: 'plain', text: 'That code has expired. Request a new code and try again.' };
    }
    if (
      m.includes('invalid') ||
      m.includes('token') ||
      m.includes('otp') ||
      m.includes('wrong') ||
      m.includes('malformed')
    ) {
      return { kind: 'plain', text: "That code doesn't look right. Double-check the email or request a new code." };
    }
    if (m.includes('too many requests') || m.includes('rate limit')) {
      return { kind: 'plain', text: 'Too many attempts. Please wait a moment and try again.' };
    }
    return { kind: 'plain', text: raw || 'Invalid or expired code. Please try again.' };
  }

  // password
  if (
    m.includes('invalid login credentials') ||
    m.includes('invalid_credentials') ||
    m.includes('invalid password') ||
    m.includes('wrong password')
  ) {
    return { kind: 'plain', text: 'Incorrect email or password. Please try again.' };
  }
  if (m.includes('email not confirmed')) {
    return { kind: 'plain', text: 'Please verify your email address before signing in.' };
  }
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return { kind: 'plain', text: 'Too many sign in attempts. Please wait a moment and try again.' };
  }
  if (m.includes('user not found') || m.includes('no user')) {
    return { kind: 'plain', text: 'No account found with this email address.' };
  }
  if (m.includes('network') || m.includes('fetch')) {
    return { kind: 'plain', text: 'Connection error. Please check your internet and try again.' };
  }
  return { kind: 'plain', text: raw || 'Unable to sign in. Please try again.' };
}

export class AuthUserFacingError extends Error {
  readonly display: AuthFlowMessage;

  constructor(display: AuthFlowMessage) {
    const textForSuper =
      display.kind === 'plain'
        ? display.text
        : `${display.intro}${display.linkLabel} (${display.applyUrl})`;
    super(textForSuper);
    this.name = 'AuthUserFacingError';
    this.display = display;
    Object.setPrototypeOf(this, AuthUserFacingError.prototype);
  }
}

export function isAuthUserFacingError(e: unknown): e is AuthUserFacingError {
  return e instanceof AuthUserFacingError;
}
