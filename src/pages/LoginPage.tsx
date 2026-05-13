import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { isAuthUserFacingError } from '../lib/authErrors';

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
          className="font-medium text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground/60"
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
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground shadow-hairline"
      role="alert"
    >
      {content}
    </motion.div>
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
        setAuthError(sendError);
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
          setAuthError(verifyError);
          return;
        }
        if (data) navigate('/');
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
        setAuthError(signInError);
        return;
      }
      if (data) navigate('/');
    } catch (err) {
      setAuthError(err instanceof Error ? err : new Error('An unexpected error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const labelClass = 'mb-2 block text-sm font-normal text-muted-foreground';
  const inputClass =
    'w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/70 outline-none transition-shadow focus:border-foreground/20 focus:ring-2 focus:ring-foreground/10';
  const primaryButtonClass =
    'w-full rounded-full bg-foreground py-3.5 text-center text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';
  const linkSecondaryClass =
    'text-left text-sm text-accent transition-colors hover:underline';

  const brandBlock = (
    <div className="text-center md:text-left">
      <h1 className="font-display text-4xl font-normal tracking-tight text-foreground md:text-5xl">PIER</h1>
      <p className="mt-2 font-sans text-sm font-light tracking-wide text-muted-foreground">Member Portal</p>
    </div>
  );

  const stepTitle =
    step === 'email' ? 'Sign in' : step === 'code' ? 'Check your email' : 'Welcome back';

  const formCard = (
    <motion.div
      className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card md:p-10"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="mb-2 text-left text-xl font-semibold text-foreground">{stepTitle}</h2>
      <p className="mb-8 text-left text-sm text-muted-foreground">
        {step === 'email' && 'We’ll email you a one-time code.'}
        {step === 'code' && 'Enter the code we sent you.'}
        {step === 'password' && 'Sign in with your member password.'}
      </p>

      <AuthAlert error={authError} />

      {step === 'email' && (
        <form onSubmit={handleSendMagicLink}>
          <div className="mb-6">
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <button type="submit" className={primaryButtonClass} disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending…
              </span>
            ) : (
              'Continue'
            )}
          </button>
          <div className="mt-8 text-left">
            <button type="button" onClick={() => setStep('password')} className={linkSecondaryClass}>
              Sign in with password instead
            </button>
          </div>
        </form>
      )}

      {step === 'code' && (
        <>
          <p className="mb-8 text-left text-sm text-muted-foreground">
            We sent a code to <span className="font-medium text-foreground">{email}</span>.
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
                  className="h-12 w-11 rounded-xl border border-border bg-background text-center text-lg text-foreground outline-none transition-shadow focus:border-foreground/20 focus:ring-2 focus:ring-foreground/10"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            <button type="submit" className={primaryButtonClass} disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Verifying…
                </span>
              ) : (
                'Verify and sign in'
              )}
            </button>
            <div className="mt-8 flex flex-col gap-3 text-left text-sm">
              {resendCooldown > 0 ? (
                <span className="text-muted-foreground">Resend code ({resendCooldown}s)</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendMagicLink({ preventDefault: () => {} } as React.FormEvent)}
                  className={linkSecondaryClass}
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
                className="text-muted-foreground transition-colors hover:text-foreground hover:underline"
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
            <label htmlFor="password-email" className={labelClass}>
              Email
            </label>
            <input
              id="password-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
              autoComplete="email"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className={primaryButtonClass} disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
          <div className="mt-8 flex flex-col gap-3 text-left text-sm">
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setAuthError(null);
              }}
              className={linkSecondaryClass}
            >
              Use magic link instead
            </button>
            <Link to="/forgot-password" className="text-muted-foreground transition-colors hover:text-foreground">
              Forgot your password?
            </Link>
          </div>
        </form>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-parchment text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <aside className="flex flex-col justify-center border-border px-8 pb-6 pt-12 md:border-r md:px-16 md:py-20 lg:px-20">
          {brandBlock}
          <p className="mx-auto mt-10 hidden max-w-xs text-center text-sm font-light leading-relaxed text-muted-foreground md:mx-0 md:block md:text-left">
            Private access for Pier members. Sign in to reach your concierge and member benefits.
          </p>
        </aside>

        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-4 md:px-12 md:py-20">
          <div className="mb-10 md:hidden">{brandBlock}</div>
          {formCard}
          <p className="mt-10 max-w-md text-center text-sm text-muted-foreground">
            Need assistance?{' '}
            <a href="mailto:concierge@joinpier.com" className="underline decoration-foreground/25 underline-offset-2 hover:text-foreground">
              concierge@joinpier.com
            </a>
          </p>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;
