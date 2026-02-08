import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';
import { AnimatedCard } from '../components/ui/animatedCard';
import { CyberButton } from '../components/ui/cyberButton';
import '../styles/pages.css';

type VerificationStatus = 'loading' | 'success' | 'error' | 'no-token';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const tenantId = searchParams.get('tenant') || 'default-tenant';

  const [status, setStatus] = useState<VerificationStatus>(token ? 'loading' : 'no-token');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await authApi.verifyEmail(token, tenantId);
        setStatus('success');
        setMessage(response.message || 'Your email has been verified successfully!');
      } catch (err) {
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message :
          (err as { message?: string })?.message || 'Verification failed. The link may have expired.';
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [token, tenantId]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <h2 className="login-card__title">Verifying Email</h2>
            <div className="auth-loading">
              <div className="auth-loading__spinner" />
              <p className="auth-loading__text">Please wait while we verify your email...</p>
            </div>
          </>
        );

      case 'success':
        return (
          <>
            <h2 className="login-card__title">Email Verified</h2>
            <div className="auth-success">
              <div className="auth-success__icon">✓</div>
              <p className="auth-success__message">{message}</p>
            </div>
            <Link to="/login">
              <CyberButton variant="primary" size="lg">
                Continue to Sign In
              </CyberButton>
            </Link>
          </>
        );

      case 'error':
        return (
          <>
            <h2 className="login-card__title">Verification Failed</h2>
            <div className="auth-error">
              <div className="auth-error__icon">✕</div>
              <p className="auth-error__message">{message}</p>
            </div>
            <p className="login-card__footer">
              Need a new verification link?{' '}
              <Link to="/register">Register again</Link>
            </p>
          </>
        );

      case 'no-token':
        return (
          <>
            <h2 className="login-card__title">Invalid Link</h2>
            <div className="auth-error">
              <div className="auth-error__icon">?</div>
              <p className="auth-error__message">
                No verification token found. Please use the link from your email.
              </p>
            </div>
            <p className="login-card__footer">
              <Link to="/login">Go to Sign In</Link>
            </p>
          </>
        );
    }
  };

  return (
    <div className="public-page">
      {/* Navigation */}
      <nav className="public-nav">
        <Link to="/" className="public-nav__logo">
          <span className="public-nav__logo-icon">&#9670;</span>
          DRME
        </Link>
      </nav>

      {/* Verification Content */}
      <section className="hero">
        <AnimatedCard>
          <div className="login-card">
            {renderContent()}
          </div>
        </AnimatedCard>
      </section>
    </div>
  );
}
