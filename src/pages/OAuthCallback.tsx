import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const provider = searchParams.get('provider');

    const providerName = provider === 'calendar' ? 'Google Calendar' : 'Gmail';

    if (success === 'true') {
      setStatus('success');
      setMessage(`Your ${providerName} account has been connected successfully.`);
      
      // Notify parent window
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth-success', provider }, '*');
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        // Not a popup, redirect to profile after 1.5 seconds
        setTimeout(() => {
          window.location.href = `/profile?connected=${provider}`;
        }, 1500);
      }
    } else if (error) {
      setStatus('error');
      
      // Set appropriate error message
      switch (error) {
        case 'access_denied':
          setMessage('You cancelled the authorization.');
          break;
        case 'token_exchange':
          setMessage('Failed to exchange authorization code. Please try again.');
          break;
        case 'database':
          setMessage('Failed to save your connection. Please try again.');
          break;
        case 'missing_params':
          setMessage('Missing required parameters. Please try again.');
          break;
        default:
          setMessage('An error occurred during authorization. Please try again.');
      }
      
      // Notify parent window
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth-error', error }, '*');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    }
  }, [searchParams]);

  const closeWindow = () => {
    if (window.opener) {
      window.opener.postMessage({ 
        type: status === 'success' ? 'oauth-success' : 'oauth-error' 
      }, '*');
    }
    window.close();
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      background: '#0a0a0a',
      color: '#e5e5e5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%',
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: '16px',
        padding: '48px 32px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: '72px',
              height: '72px',
              margin: '0 auto 32px',
              background: 'rgba(229, 200, 150, 0.1)',
              border: '2px solid rgba(229, 200, 150, 0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                border: '3px solid rgba(229, 200, 150, 0.3)',
                borderTopColor: '#e5c896',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 300,
              letterSpacing: '-0.02em',
              marginBottom: '12px',
              color: '#f5f5f5',
            }}>
              Processing...
            </h1>
            <p style={{
              fontSize: '15px',
              color: '#a0a0a0',
              lineHeight: 1.6,
              fontWeight: 300,
            }}>
              Please wait while we complete the authorization.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '72px',
              height: '72px',
              margin: '0 auto 32px',
              background: 'rgba(229, 200, 150, 0.1)',
              border: '2px solid rgba(229, 200, 150, 0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'scaleIn 0.4s ease-out',
            }}>
              <svg fill="none" stroke="#e5c896" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: '36px', height: '36px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 300,
              letterSpacing: '-0.02em',
              marginBottom: '12px',
              color: '#f5f5f5',
            }}>
              Connected Successfully
            </h1>
            <p style={{
              fontSize: '15px',
              color: '#a0a0a0',
              lineHeight: 1.6,
              marginBottom: '32px',
              fontWeight: 300,
            }}>
              {message}
            </p>
            <button
              onClick={closeWindow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 24px',
                background: '#e5c896',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d4c4a6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#e5c896';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Close Window
            </button>
            <p style={{
              fontSize: '13px',
              color: '#666',
              marginTop: '16px',
              fontWeight: 300,
            }}>
              This window will close automatically...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '72px',
              height: '72px',
              margin: '0 auto 32px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'scaleIn 0.4s ease-out',
            }}>
              <svg fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24" style={{ width: '36px', height: '36px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 300,
              letterSpacing: '-0.02em',
              marginBottom: '12px',
              color: '#f5f5f5',
            }}>
              Authorization Failed
            </h1>
            <p style={{
              fontSize: '15px',
              color: '#a0a0a0',
              lineHeight: 1.6,
              marginBottom: '32px',
              fontWeight: 300,
            }}>
              {message}
            </p>
            <button
              onClick={closeWindow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 24px',
                background: '#e5c896',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d4c4a6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#e5c896';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Close Window
            </button>
            <a
              href="/profile"
              style={{
                display: 'inline-block',
                marginTop: '16px',
                padding: '10px 20px',
                background: 'rgba(229, 200, 150, 0.1)',
                border: '1px solid rgba(229, 200, 150, 0.3)',
                borderRadius: '8px',
                color: '#e5c896',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 400,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(229, 200, 150, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(229, 200, 150, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(229, 200, 150, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(229, 200, 150, 0.3)';
              }}
            >
              Return to Profile
            </a>
          </>
        )}
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

