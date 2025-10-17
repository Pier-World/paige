import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

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
      const { error } = await resetPassword(email);
      
      if (error) {
        setError('There was an error sending the password reset email. Please try again.');
      } else {
        setIsSubmitted(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
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
          <Link to="/login" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900 mb-6">
            <ArrowLeft size={16} className="mr-1" />
            Back to login
          </Link>
          
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-medium mb-4">Check Your Email</h2>
              <p className="text-primary-600 mb-6">
                If an account exists for {email}, we've sent instructions to reset your password.
              </p>
              <p className="text-sm text-primary-500">
                Don't see it? Check your spam folder or <button 
                  onClick={() => setIsSubmitted(false)} 
                  className="text-primary-800 hover:underline"
                >
                  try again
                </button>.
              </p>
            </motion.div>
          ) : (
            <>
              <h2 className="text-2xl font-medium mb-6">Reset Password</h2>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
                  {error}
                </div>
              )}
              
              <p className="text-primary-600 mb-6">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-primary-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input w-full"
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Send Reset Instructions
                </Button>
              </form>
            </>
          )}
        </div>
        
        <div className="text-center mt-8 text-sm text-primary-600">
          <p>
            Need assistance? Contact{' '}
            <a href="mailto:concierge@joinpier.com" className="text-primary-800 hover:underline">
              concierge@joinpier.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;