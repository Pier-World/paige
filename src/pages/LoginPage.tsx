import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coerceToAuthUserFacingError, isAuthUserFacingError } from '../lib/authErrors';
import { postAuthPath } from '../lib/capitalOnboarding';
import { Button } from '../components/ui/Button';
import {
  AuthCard,
  AuthShell,
  authInputClass,
  authLabelClass,
  authOtpClass,
  authSecondaryClass,
} from './auth/AuthShell';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

function AuthAlert({ error }: { error: Error | null }) {
  if (!error) return null;

  const content = isAuthUserFacingError(error) ? (
    error.display.kind === 'plain' ? (
      error.display.text
    ) : (
      <>
        {error.display.intro}
        <a
          href={error.display.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink/60"
        >
          {error.display.linkLabel}
        </a>
        .
      </>
    )
  ) : (
    error.message
  );

  return (
    <div
      className="mb-8 rounded-pier border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed text-slate"
      role="alert"
    >
      {content}
    </div>
  );
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [otpCode, setOtpCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { signIn, sendMagicLink, verifyMagicLinkCode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    try {
      const { error: sendError } = await sendMagicLink(email);
      if (sendError) {
        setAuthError(coerceToAuthUserFacingError(sendError, 'otp_send'));
        return;
      }
      setStep('code');
      setOtpCode(Array(CODE_LENGTH).fill(''));
      setResendCooldown(RESEND_COOLDOWN_SEC);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const submitOtpToken = React.useCallback(
    async (token: string) => {
      if (token.length !== CODE_LENGTH || isLoading) return;
      setAuthError(null);
      setIsLoading(true);
      try {
        const { data, error: verifyError } = await verifyMagicLinkCode(email, token);
        if (verifyError) {
          setAuthError(coerceToAuthUserFacingError(verifyError, 'otp_verify'));
          return;
        }
        if (data) navigate(postAuthPath(data));
      } finally {
        setIsLoading(false);
      }
    },
    [email, isLoading, verifyMagicLinkCode, navigate]
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

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...otpCode];
      next[index - 1] = '';
      setOtpCode(next);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpCode.join('');
    if (token.length !== CODE_LENGTH) {
      setAuthError(new Error('Please enter the 6-digit code from your email.'));
      return;
    }
    submitOtpToken(token);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    try {
      const { data, error: signInError } = await signIn(email, password);
      if (signInError) {
        setAuthError(coerceToAuthUserFacingError(signInError, 'password'));
        return;
      }
      if (data) navigate(postAuthPath(data));
    } catch (err) {
      setAuthError(err instanceof Error ? err : new Error('An unexpected error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitle =
    step === 'email' ? 'Sign in' : step === 'code' ? 'Check your email' : 'Welcome back';

  return (
    <AuthShell>
      <AuthCard>
        <h2 className="mb-2 text-left text-xl font-medium text-ink">{stepTitle}</h2>
        <p className="mb-8 text-left text-sm text-slate">
          {step === 'email' && 'We’ll email you a one-time code.'}
          {step === 'code' && 'Enter the code we sent you.'}
          {step === 'password' && 'Sign in with your member password.'}
        </p>

        <AuthAlert error={authError} />

        {step === 'email' && (
          <form onSubmit={handleSendMagicLink}>
            <div className="mb-6">
              <label htmlFor="email" className={authLabelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClass}
                required
                autoComplete="email"
                placeholder="Email"
              />
            </div>
            <Button type="submit" className="w-full" loading={isLoading}>
              Continue
            </Button>
            <div className="mt-8 text-left">
              <button type="button" onClick={() => setStep('password')} className={authSecondaryClass}>
                Sign in with password instead
              </button>
            </div>
          </form>
        )}

        {step === 'code' && (
          <>
            <p className="mb-8 text-left text-sm text-slate">
              We sent a code to <span className="font-medium text-ink">{email}</span>.
            </p>
            <form onSubmit={handleVerifyCode}>
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
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={authOtpClass}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>
              <Button type="submit" className="w-full" loading={isLoading}>
                Verify and sign in
              </Button>
              <div className="mt-8 flex flex-col gap-3 text-left text-sm">
                {resendCooldown > 0 ? (
                  <span className="text-slate">Resend code ({resendCooldown}s)</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendMagicLink({ preventDefault: () => {} } as React.FormEvent)}
                    className={authSecondaryClass}
                  >
                    Resend code
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setAuthError(null);
                  }}
                  className={authSecondaryClass}
                >
                  Use a different email
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="password-email" className={authLabelClass}>
                Email
              </label>
              <input
                id="password-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClass}
                required
                autoComplete="email"
                placeholder="Email"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className={authLabelClass}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authInputClass}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" loading={isLoading}>
              Sign in
            </Button>
            <div className="mt-8 flex flex-col gap-3 text-left text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setAuthError(null);
                }}
                className={authSecondaryClass}
              >
                Use magic link instead
              </button>
              <Link to="/forgot-password" className={authSecondaryClass}>
                Forgot your password?
              </Link>
            </div>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  );
};

export default LoginPage;
