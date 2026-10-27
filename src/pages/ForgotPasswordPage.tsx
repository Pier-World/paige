import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import {
  AuthCard,
  AuthShell,
  authInputClass,
  authLabelClass,
  authSecondaryClass,
} from './auth/AuthShell';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: resetError } = await resetPassword(email);

      if (resetError) {
        setError('There was an error sending the password reset email. Please try again.');
      } else {
        setIsSubmitted(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <Link to="/login" className={`${authSecondaryClass} mb-6 inline-flex items-center`}>
          <ArrowLeft size={16} className="mr-1" />
          Back to sign in
        </Link>

        {isSubmitted ? (
          <>
            <h2 className="text-xl font-medium text-ink">Check your email</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate">
              If an account exists for {email}, we’ve sent instructions to reset your password.
            </p>
            <p className="mt-4 text-sm text-slate">
              Don’t see it? Check your spam folder or{' '}
              <button type="button" onClick={() => setIsSubmitted(false)} className={authSecondaryClass}>
                try again
              </button>
              .
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-medium text-ink">Reset password</h2>
            <p className="mt-3 mb-6 text-sm leading-relaxed text-slate">
              Enter your email address and we’ll send instructions to reset your password.
            </p>

            {error ? (
              <div className="mb-6 rounded-pier border border-danger/30 bg-danger/[0.06] px-4 py-3 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit}>
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
                Send reset instructions
              </Button>
            </form>
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
