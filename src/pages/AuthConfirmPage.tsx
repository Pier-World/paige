import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseEmailLinkType, type EmailLinkType } from '../lib/authEmailLink';
import { coerceToAuthUserFacingError, isAuthUserFacingError } from '../lib/authErrors';
import { postAuthPath } from '../lib/capitalOnboarding';
import { Button } from '../components/ui/Button';
import { AuthCard, AuthShell } from './auth/AuthShell';

const COPY: Record<EmailLinkType, { title: string; body: string; action: string }> = {
  invite: {
    title: 'Accept your invitation',
    body: 'Continue on this device to open your Pier membership.',
    action: 'Accept invitation',
  },
  recovery: {
    title: 'Reset your password',
    body: 'Continue on this device to choose a new password.',
    action: 'Continue',
  },
  signup: {
    title: 'Confirm your email',
    body: 'Continue on this device to finish creating your account.',
    action: 'Confirm email',
  },
  email_change: {
    title: 'Confirm your email',
    body: 'Continue on this device to confirm this email address.',
    action: 'Confirm email',
  },
  email: {
    title: 'Sign in to Pier',
    body: 'Continue on this device to finish signing in.',
    action: 'Continue',
  },
  magiclink: {
    title: 'Sign in to Pier',
    body: 'Continue on this device to finish signing in.',
    action: 'Continue',
  },
};

/**
 * Lands email links that carry token_hash. Verification is a click, not a page
 * load: mail scanners prefetch the URL and would otherwise spend the one-time token.
 */
const AuthConfirmPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmailTokenHash } = useAuth();
  const tokenHash = params.get('token_hash')?.trim() || '';
  const type = parseEmailLinkType(params.get('type'));
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const copy = type ? COPY[type] : null;
  const linkReady = Boolean(tokenHash && type && copy);

  const handleContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tokenHash || !type || isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      const { error: verifyError, data } = await verifyEmailTokenHash(tokenHash, type);
      if (verifyError) {
        setError(coerceToAuthUserFacingError(verifyError, 'otp_verify'));
        return;
      }
      if (type === 'recovery') {
        navigate('/reset-password', { replace: true });
        return;
      }
      navigate(postAuthPath(data), { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const alertText = !error
    ? null
    : isAuthUserFacingError(error)
      ? error.display.kind === 'plain'
        ? error.display.text
        : `${error.display.intro}${error.display.linkLabel}.`
      : error.message;

  return (
    <AuthShell>
      <AuthCard>
        <h1 className="mb-3 text-center font-display text-3xl font-normal tracking-tight text-ink">
          {copy?.title ?? 'This link cannot be used'}
        </h1>
        <p className="mb-8 text-center text-sm leading-relaxed text-slate">
          {copy?.body ??
            'Open the newest email from Pier, or request a sign-in code on the member portal.'}
        </p>
        {alertText ? (
          <div
            className="mb-8 rounded-pier border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed text-slate"
            role="alert"
          >
            {alertText}
          </div>
        ) : null}
        {linkReady ? (
          <form onSubmit={handleContinue}>
            <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
              {copy?.action}
            </Button>
          </form>
        ) : (
          <Button type="button" size="lg" className="w-full" onClick={() => navigate('/login')}>
            Go to sign in
          </Button>
        )}
        <Link to="/login" className="mt-6 block text-center text-sm text-slate hover:text-ink hover:underline">
          Use a sign-in code instead
        </Link>
      </AuthCard>
    </AuthShell>
  );
};

export default AuthConfirmPage;
