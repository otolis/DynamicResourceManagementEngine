import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';
import { apiClient } from '../api/client';
import { CyberButton } from '../components/ui/cyberButton';
import { CyberInput } from '../components/ui/cyberInput';
import { AnimatedCard } from '../components/ui/animatedCard';
import '../styles/pages.css';

// Password validation requirements
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

export function RegisterPage() {
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    tenantId: searchParams.get('tenant') || apiClient.getTenantId() || 'default-tenant',
  });

  // Sync with URL params if tenant changes
  useEffect(() => {
    const urlTenant = searchParams.get('tenant');
    if (urlTenant) {
      setFormData(prev => ({ ...prev, tenantId: urlTenant }));
    }
  }, [searchParams]);
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

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Please enter a valid email';
    if (!isPasswordValid) return 'Password does not meet requirements';
    if (!doPasswordsMatch) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register(
        {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        formData.tenantId
      );
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message :
        (err as { message?: string })?.message || 'Registration failed';
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
              <h2 className="login-card__title">Check Your Email</h2>
              <div className="auth-success">
                <div className="auth-success__icon">✓</div>
                <p className="auth-success__message">
                  We've sent a verification link to <strong>{formData.email}</strong>. 
                  Please check your inbox and click the link to verify your account.
                </p>
              </div>
              <p className="login-card__footer">
                Already verified?{' '}
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

      {/* Registration Form */}
      <section className="hero">
        <AnimatedCard>
          <div className="login-card login-card--wide">
            <h2 className="login-card__title">Create Account</h2>

            {formError && (
              <div className="login-card__error">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-card__form">
              <CyberInput
                label="Organization Slug or ID"
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                placeholder="e.g. acme-corp or UUID"
              />

              <div className="auth-form__row">
                <CyberInput
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  required
                />
                <CyberInput
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  required
                />
              </div>

              <CyberInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                required
              />

              <div className="auth-form__password-section">
                <CyberInput
                  label="Password"
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
                label="Confirm Password"
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
                {isLoading ? 'Creating account...' : 'Create Account'}
              </CyberButton>

              <div className="login-card__divider">
                <span>OR</span>
              </div>

              <CyberButton
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => window.location.href = `http://127.0.0.1:3000/auth/google?tenant=${formData.tenantId}`}
                className="google-btn"
              >
                <svg className="google-btn__icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </CyberButton>
            </form>

            <p className="login-card__footer">
              Already have an account?{' '}
              <Link to="/login">Sign In</Link>
            </p>
          </div>
        </AnimatedCard>
      </section>
    </div>
  );
}
