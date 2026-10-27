import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { coerceToAuthUserFacingError, isAuthUserFacingError } from '../lib/authErrors';
import { postAuthPath } from '../lib/capitalOnboarding';
import { supabase } from '../lib/supabase';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

type InviteState =
  | { status: 'loading' }
  | { status: 'invalid' }
  | { status: 'valid'; email: string; firstName: string | null };

function expiredCopy() {
  return (
    <div className="text-center">
      <h1 className="font-display text-4xl font-normal tracking-tight text-foreground">PIER</h1>
      <p className="mt-8 text-xl font-semibold text-foreground">Link expired</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        This welcome link is no longer valid. Sign in if you already have access, or contact the Pier
        team for a new invite.
      </p>
      <Link
        to="/login"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background hover:opacity-90"
      >
        Go to sign in
      </Link>
    </div>
  );
}

export default function WelcomePage() {
  const [searchParams] = useSearchParams();
  const rawToken = (searchParams.get('token') || '').trim();
  const { user, isLoading: authLoading, sendMagicLink, verifyMagicLinkCode } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteState>({ status: 'loading' });
  const [step, setStep] = useState<'landing' | 'code'>('landing');
  const [otpCode, setOtpCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [authError, setAuthError] = useState<Error | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    let ignore = false;

    async function validate() {
      if (!rawToken) {
        setInvite({ status: 'invalid' });
        return;
      }

      try {
        const { data, error } = await supabase.rpc('validate_member_invite', { p_token: rawToken });
        if (ignore) return;

        const payload = data as { valid?: boolean; email?: string; first_name?: string | null } | null;
        if (error || !payload?.valid || !payload.email) {
          setInvite({ status: 'invalid' });
          return;
        }

        setInvite({
          status: 'valid',
          email: payload.email,
          firstName: payload.first_name ?? null,
        });
      } catch {
        if (!ignore) setInvite({ status: 'invalid' });
      }
    }

    validate();
    return () => {
      ignore = true;
    };
  }, [rawToken]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      navigate(postAuthPath(user), { replace: true });
    }
  }, [authLoading, user, navigate]);

  const requestOtp = async () => {
    if (invite.status !== 'valid') return;
    setAuthError(null);
    setIsWorking(true);
    try {
      const { error: sendError } = await sendMagicLink(invite.email);
      if (sendError) {
        setAuthError(coerceToAuthUserFacingError(sendError, 'otp_send'));
        return;
      }
      setStep('code');
      setOtpCode(Array(CODE_LENGTH).fill(''));
      setResendCooldown(RESEND_COOLDOWN_SEC);
      inputRefs.current[0]?.focus();
    } finally {
      setIsWorking(false);
    }
  };

  const submitOtpToken = React.useCallback(
    async (token: string) => {
      if (invite.status !== 'valid' || token.length !== CODE_LENGTH || isWorking) return;
      setAuthError(null);
      setIsWorking(true);
      try {
        const { data, error: verifyError } = await verifyMagicLinkCode(invite.email, token);
        if (verifyError) {
          setAuthError(coerceToAuthUserFacingError(verifyError, 'otp_verify'));
          return;
        }
        if (data) {
          await supabase.rpc('consume_member_invite', { p_token: rawToken });
          navigate(postAuthPath(data));
        }
      } finally {
        setIsWorking(false);
      }
    },
    [invite, isWorking, verifyMagicLinkCode, rawToken, navigate]
  );

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
      const next = [...otpCode];
      digits.forEach((d, i) => {
        if (index + i < CODE_LENGTH) next[index + i] = d;
      });
      setOtpCode(next);
      const nextFocus = Math.min(index + digits.length, CODE_LENGTH - 1);
      inputRefs.current[nextFocus]?.focus();
      if (next.every(Boolean) && next.join('').length === CODE_LENGTH) {
        submitOtpToken(next.join(''));
      }
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpCode];
    next[index] = digit;
    setOtpCode(next);
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digit && index === CODE_LENGTH - 1 && next.every(Boolean)) {
      submitOtpToken(next.join(''));
    }
  };

  const primaryButtonClass =
    'w-full rounded-full bg-foreground py-3.5 text-center text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-accent" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-accent" />
      </div>
    );
  }

  if (invite.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-accent" />
      </div>
    );
  }

  if (invite.status === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md">{expiredCopy()}</div>
      </div>
    );
  }

  const firstName = invite.firstName || 'there';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <motion.div
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card md:p-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Welcome</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-foreground">Hello, {firstName}.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your Pier membership is ready. Continue to receive a one-time sign-in code at{' '}
          <span className="font-medium text-foreground">{invite.email}</span>.
        </p>

        {authError ? (
          <div className="mt-6 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground" role="alert">
            {isAuthUserFacingError(authError) && authError.display.kind === 'plain'
              ? authError.display.text
              : authError.message}
          </div>
        ) : null}

        {step === 'landing' ? (
          <button type="button" className={`${primaryButtonClass} mt-8`} disabled={isWorking} onClick={requestOtp}>
            {isWorking ? 'Sending…' : 'Continue'}
          </button>
        ) : (
          <form
            className="mt-8"
            onSubmit={(event) => {
              event.preventDefault();
              submitOtpToken(otpCode.join(''));
            }}
          >
            <p className="mb-6 text-sm text-muted-foreground">Enter the 6-digit code from your email.</p>
            <div className="mb-8 flex justify-center gap-2">
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="h-12 w-11 rounded-xl border border-border bg-background text-center text-lg text-foreground outline-none focus:border-foreground/20 focus:ring-2 focus:ring-foreground/10"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            <button type="submit" className={primaryButtonClass} disabled={isWorking}>
              {isWorking ? 'Verifying…' : 'Verify and sign in'}
            </button>
            <div className="mt-6 text-sm">
              {resendCooldown > 0 ? (
                <span className="text-muted-foreground">Resend code ({resendCooldown}s)</span>
              ) : (
                <button type="button" onClick={requestOtp} className="text-accent hover:underline">
                  Resend code
                </button>
              )}
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
