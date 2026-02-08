import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api';
import { CyberButton } from '../components/ui/cyberButton';
import { CyberInput } from '../components/ui/cyberInput';
import { AnimatedCard } from '../components/ui/animatedCard';
import '../styles/pages.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState('default-tenant');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.forgotPassword(email, tenantId);
      setSubmitted(true);
    } catch (err) {
      // Always show success message to prevent email enumeration attacks
      // Even if the email doesn't exist, we don't reveal that information
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="public-page">
        <nav className="public-nav">
          <Link to="/" className="public-nav__logo">
            <span className="public-nav__logo-icon">&#9670;</span>
            DRME
          </Link>
        </nav>

        <section className="hero">
          <AnimatedCard>
            <div className="login-card">
              <h2 className="login-card__title">Check Your Email</h2>
              <div className="auth-success">
                <div className="auth-success__icon">✉</div>
                <p className="auth-success__message">
                  If an account exists with <strong>{email}</strong>, you will receive a password reset 
                  link shortly. Please check your inbox and spam folder.
                </p>
              </div>
              <p className="login-card__footer">
                Remember your password?{' '}
                <Link to="/login">Sign In</Link>
              </p>
            </div>
          </AnimatedCard>
        </section>
      </div>
    );
  }

  return (
    <div className="public-page">
      {/* Navigation */}
      <nav className="public-nav">
        <Link to="/" className="public-nav__logo">
          <span className="public-nav__logo-icon">&#9670;</span>
          DRME
        </Link>
        <div className="public-nav__links">
          <Link to="/" className="public-nav__link">Home</Link>
          <Link to="/features" className="public-nav__link">Features</Link>
          <Link to="/pricing" className="public-nav__link">Pricing</Link>
        </div>
      </nav>

      {/* Forgot Password Form */}
      <section className="hero">
        <AnimatedCard>
          <div className="login-card">
            <h2 className="login-card__title">Forgot Password</h2>
            <p className="auth-form__description">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {formError && (
              <div className="login-card__error">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-card__form">
              <CyberInput
                label="Tenant ID"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="your-tenant-id"
              />

              <CyberInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

              <CyberButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </CyberButton>
            </form>

            <p className="login-card__footer">
              Remember your password?{' '}
              <Link to="/login">Sign In</Link>
            </p>
          </div>
        </AnimatedCard>
      </section>
    </div>
  );
}
