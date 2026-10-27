import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import {
  AuthCard,
  AuthLoading,
  AuthShell,
  authInputClass,
  authLabelClass,
  authSecondaryClass,
} from './auth/AuthShell';

/**
 * Landing page for Supabase password recovery links (`redirectTo` → `/reset-password`).
 * Not wrapped in `PublicRoute` so a recovery session is not bounced to `/`.
 */
const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const markReady = (session: { user: { id: string } } | null) => {
      if (cancelled || !session?.user) return;
      setSessionReady(true);
    };

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      markReady(data.session ?? null);
      setCheckingSession(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        markReady(session);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingSession) {
    return <AuthLoading label="Verifying reset link…" />;
  }

  return (
    <AuthShell>
      <AuthCard>
        <Link to="/login" className={`${authSecondaryClass} mb-6 inline-flex items-center`}>
          <ArrowLeft size={16} className="mr-1" />
          Back to sign in
        </Link>

        {!sessionReady ? (
          <>
            <h2 className="text-xl font-medium text-ink">Link invalid or expired</h2>
            <p className="mt-3 mb-6 text-sm leading-relaxed text-slate">
              Request a new reset email and open the link from the same device if possible.
            </p>
            <Link to="/forgot-password" className={authSecondaryClass}>
              Send a new reset link
            </Link>
          </>
        ) : (
          <>
            <h2 className="mb-6 text-xl font-medium text-ink">Set a new password</h2>
            {error ? (
              <div className="mb-6 rounded-pier border border-danger/30 bg-danger/[0.06] px-4 py-3 text-sm text-danger">
                {error}
              </div>
            ) : null}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="new-password" className={authLabelClass}>
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={authInputClass}
                  required
                  minLength={8}
                />
              </div>
              <div className="mb-6">
                <label htmlFor="confirm-password" className={authLabelClass}>
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={authInputClass}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Update password
              </Button>
            </form>
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
};

export default ResetPasswordPage;
