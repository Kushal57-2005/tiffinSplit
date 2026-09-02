import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      let credential = searchParams.get('credential') || searchParams.get('id_token') || searchParams.get('token');
      const code = searchParams.get('code');

      if (!credential && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        credential = hashParams.get('id_token') || hashParams.get('access_token');
      }

      const validCredential = (credential && credential.trim()) || (code && code.trim());

      if (validCredential) {
        try {
          await loginWithGoogle({ credential: validCredential });
          navigate('/dashboard', { replace: true });
          return;
        } catch (err) {
          console.error('Google callback auth error:', err);
          setError(err.message || 'Google authentication failed');
        }
      } else {
        setError('No Google authorization token found in URL parameters.');
      }

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    };

    handleCallback();
  }, [searchParams, loginWithGoogle, navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--bg)'
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
        {error ? (
          <div>
            <div style={{ color: 'var(--error-text)', fontWeight: '600', marginBottom: '0.5rem' }}>
              Authentication Failed
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{error}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Redirecting to login...
            </p>
          </div>
        ) : (
          <LoadingSpinner message="Completing Google Sign-In..." />
        )}
      </div>
    </div>
  );
}
