import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data) {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

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
            style={{ 
              fontSize: '48px', 
              fontWeight: 300, 
              letterSpacing: '-0.02em' 
            }}
          >
            PIER
          </h1>
          <p className="text-text-secondary" style={{ fontSize: '16px', fontWeight: 300 }}>
            Member Portal
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-lg p-8">
          <h2 
            className="text-2xl font-light mb-6 text-text-primary"
            style={{ fontSize: '24px', fontWeight: 300 }}
          >
            Sign In
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

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label 
                htmlFor="email" 
                className="block text-sm font-normal text-text-secondary mb-2"
                style={{ fontSize: '14px', fontWeight: 400 }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                required
                autoComplete="email"
              />
            </div>

            <div className="mb-6">
              <label 
                htmlFor="password" 
                className="block text-sm font-normal text-text-secondary mb-2"
                style={{ fontSize: '14px', fontWeight: 400 }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/forgot-password" 
              className="text-sm text-text-secondary hover:text-accent transition-colors"
              style={{ fontSize: '14px', fontWeight: 300 }}
            >
              Forgot your password?
            </Link>
          </div>
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