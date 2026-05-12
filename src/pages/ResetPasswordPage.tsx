import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-medium mb-2">PIER</h1>
          <p className="text-primary-600">Member Portal</p>
        </div>

        <div className="bg-white rounded-lg shadow-card p-8">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900 mb-6"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to login
          </Link>

          {checkingSession ? (
            <p className="text-primary-600">Verifying reset link…</p>
          ) : !sessionReady ? (
            <>
              <h2 className="text-2xl font-medium mb-4">Link invalid or expired</h2>
              <p className="text-primary-600 mb-6">
                Request a new reset email and open the link from the same device/browser if possible.
              </p>
              <Link to="/forgot-password" className="text-primary-800 font-medium hover:underline">
                Send a new reset link
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-medium mb-6">Set a new password</h2>
              {error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">{error}</div>
              ) : null}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="new-password" className="block text-sm font-medium text-primary-700 mb-1">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full"
                    required
                    minLength={8}
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-primary-700 mb-1">
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input w-full"
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Update password
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
