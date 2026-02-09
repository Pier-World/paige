import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    setIsLoading(true);
    try {
      const { error: sendError } = await sendMagicLink(email);
      if (sendError) {
        setError(sendError.message);
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
      setError(null);
      setIsLoading(true);
      try {
        const { data, error: verifyError } = await verifyMagicLinkCode(email, token);
        if (verifyError) {
          setError(verifyError.message);
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
      setError('Please enter the 6-digit code from your email.');
      return;
    }
    submitOtpToken(token);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { data, error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      if (data) navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const labelClass = 'block text-sm font-normal text-text-secondary mb-2';
  const inputClass = 'input w-full';
  const primaryButtonClass =
    'w-full bg-[#1A1A1A] text-white font-medium py-3 px-4 rounded-lg hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const linkSecondaryClass = 'text-sm text-[#E8764B] hover:underline transition-colors text-left';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <h1
            className="text-5xl font-light mb-2 text-text-primary"
            style={{ fontSize: '48px', fontWeight: 300, letterSpacing: '-0.02em' }}
          >
            PIER
          </h1>
          <p className="text-text-secondary" style={{ fontSize: '16px', fontWeight: 300 }}>
            Member Portal
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-lg p-8">
          <h2
            className="text-2xl font-semibold mb-6 text-text-primary text-left"
            style={{ fontSize: '24px' }}
          >
            {step === 'email' && 'Sign In'}
            {step === 'code' && 'Check your email'}
            {step === 'password' && 'Welcome back'}
          </h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/20 border border-red-800/50 text-red-400 p-4 rounded-lg mb-6"
              style={{ fontSize: '14px', fontWeight: 300 }}
            >
              {error}
            </motion.div>
          )}

          {/* Step 1: Email (magic link primary) */}
          {step === 'email' && (
            <form onSubmit={handleSendMagicLink}>
              <div className="mb-4">
                <label htmlFor="email" className={labelClass} style={{ fontSize: '14px', fontWeight: 400 }}>
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
                  placeholder="Your email"
                />
              </div>
              <button type="submit" className={primaryButtonClass} disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
              <div className="mt-6 text-left">
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className={linkSecondaryClass}
                  style={{ fontSize: '14px' }}
                >
                  Sign in with password instead
                </button>
              </div>
            </form>
          )}

          {/* Step 2: OTP code */}
          {step === 'code' && (
            <>
              <p className="text-text-secondary mb-6 text-left" style={{ fontSize: '14px', fontWeight: 400 }}>
                We've sent a code to <strong className="text-text-primary">{email}</strong>. Enter it below.
              </p>
              <form onSubmit={handleVerifyCode}>
                <div className="flex gap-2 justify-center mb-6">
                  {otpCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-12 text-center text-lg rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 focus:border-[#1A1A1A]"
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
                <button type="submit" className={primaryButtonClass} disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    'Verify & sign in'
                  )}
                </button>
                <div className="mt-6 text-left">
                  {resendCooldown > 0 ? (
                    <span className="text-sm text-text-tertiary" style={{ fontSize: '14px' }}>
                      Resend code ({resendCooldown}s)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendMagicLink({ preventDefault: () => {} } as React.FormEvent)}
                      className={linkSecondaryClass}
                      style={{ fontSize: '14px' }}
                    >
                      Resend code
                    </button>
                  )}
                </div>
                <div className="mt-4 text-left">
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setError(null); }}
                    className="text-sm text-text-secondary hover:text-[#E8764B] hover:underline transition-colors"
                    style={{ fontSize: '14px' }}
                  >
                    Use a different email
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Password (secondary) */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="password-email" className={labelClass} style={{ fontSize: '14px', fontWeight: 400 }}>
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
                <label htmlFor="password" className={labelClass} style={{ fontSize: '14px', fontWeight: 400 }}>
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
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
              <div className="mt-6 text-left">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(null); }}
                  className={linkSecondaryClass}
                  style={{ fontSize: '14px' }}
                >
                  Use magic link instead
                </button>
              </div>
              <div className="mt-4 text-left">
                <Link
                  to="/forgot-password"
                  className="text-sm text-text-secondary hover:text-[#E8764B] transition-colors"
                  style={{ fontSize: '14px', fontWeight: 300 }}
                >
                  Forgot your password?
                </Link>
              </div>
            </form>
          )}
        </div>

        <div className="text-center mt-8 text-sm text-text-tertiary">
          <p style={{ fontSize: '14px', fontWeight: 300 }}>
            Need assistance? Contact{' '}
            <a
              href="mailto:concierge@joinpier.com"
              className="text-text-secondary hover:text-accent transition-colors"
            >
              concierge@joinpier.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
