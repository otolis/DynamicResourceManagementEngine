import { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { CyberButton } from '../components/ui/cyberButton';
import { CyberInput } from '../components/ui/cyberInput';
import { AnimatedCard } from '../components/ui/animatedCard';
import '../styles/pages.css';

// Password validation requirements (same as register page)
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 12 characters', test: (p: string) => p.length >= 12 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  const passed = PASSWORD_REQUIREMENTS.filter(req => req.test(password)).length;
  
  if (passed === 0) return { score: 0, label: '', color: 'transparent' };
  if (passed <= 2) return { score: 20, label: 'Weak', color: 'var(--color-error)' };
  if (passed <= 3) return { score: 40, label: 'Fair', color: 'var(--color-warning)' };
  if (passed <= 4) return { score: 70, label: 'Good', color: 'var(--color-info)' };
  return { score: 100, label: 'Strong', color: 'var(--color-success)' };
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const tenantId = searchParams.get('tenant') || 'default-tenant';

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);
  const passwordChecks = useMemo(() => 
    PASSWORD_REQUIREMENTS.map(req => ({
      ...req,
      passed: req.test(formData.password),
    })),
    [formData.password]
  );

  const isPasswordValid = passwordChecks.every(check => check.passed);
  const doPasswordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  // No token state
  if (!token) {
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
              <h2 className="login-card__title">Invalid Link</h2>
              <div className="auth-error">
                <div className="auth-error__icon">?</div>
                <p className="auth-error__message">
                  No reset token found. Please use the link from your email or request a new one.
                </p>
              </div>
              <Link to="/forgot-password">
                <CyberButton variant="primary" size="lg">
                  Request New Link
                </CyberButton>
              </Link>
            </div>
          </AnimatedCard>
        </section>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isPasswordValid) {
      setFormError('Password does not meet requirements');
      return;
    }

    if (!doPasswordsMatch) {
      setFormError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, formData.password, tenantId);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message :
        (err as { message?: string })?.message || 'Failed to reset password. The link may have expired.';
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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
              <h2 className="login-card__title">Password Reset</h2>
              <div className="auth-success">
                <div className="auth-success__icon">✓</div>
                <p className="auth-success__message">
                  Your password has been reset successfully. Redirecting to sign in...
                </p>
              </div>
              <Link to="/login">
                <CyberButton variant="primary" size="lg">
                  Sign In Now
                </CyberButton>
              </Link>
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
      </nav>

      {/* Reset Password Form */}
      <section className="hero">
        <AnimatedCard>
          <div className="login-card">
            <h2 className="login-card__title">Reset Password</h2>
            <p className="auth-form__description">
              Create a new secure password for your account.
            </p>

            {formError && (
              <div className="login-card__error">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-card__form">
              <div className="auth-form__password-section">
                <CyberInput
                  label="New Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a strong password"
                  required
                />

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="password-strength">
                    <div className="password-strength__bar">
                      <div 
                        className="password-strength__fill"
                        style={{ 
                          width: `${passwordStrength.score}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>
                    <span 
                      className="password-strength__label"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                )}

                {/* Password Requirements */}
                <ul className="password-requirements">
                  {passwordChecks.map(check => (
                    <li 
                      key={check.id}
                      className={`password-requirements__item ${check.passed ? 'password-requirements__item--passed' : ''}`}
                    >
                      <span className="password-requirements__icon">
                        {check.passed ? '✓' : '○'}
                      </span>
                      {check.label}
                    </li>
                  ))}
                </ul>
              </div>

              <CyberInput
                label="Confirm New Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                required
              />
              
              {formData.confirmPassword && !doPasswordsMatch && (
                <div className="auth-form__mismatch">
                  Passwords do not match
                </div>
              )}

              <CyberButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
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
