import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { CyberButton } from '../components/ui/cyberButton';
import { CyberInput } from '../components/ui/cyberInput';
import { AnimatedCard } from '../components/ui/animatedCard';
import '../styles/pages.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenantId: 'default-tenant',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.email || !formData.password) {
      setFormError('Email and password are required');
      return;
    }

    try {
      await login(
        { email: formData.email, password: formData.password },
        formData.tenantId
      );
      navigate('/app');
    } catch (err) {
      const message = err instanceof Error ? err.message : 
        (err as { message?: string })?.message || 'Login failed';
      setFormError(message);
    }
  };

  return (
    <div className="public-page">
      {/* Gradient Mesh Background */}
      <div className="mesh-background">
        <div className="mesh-orb mesh-orb--1" />
        <div className="mesh-orb mesh-orb--2" />
        <div className="mesh-orb mesh-orb--3" />
      </div>

      {/* Navigation */}
      <nav className="public-nav">
        <Link to="/" className="public-nav__logo">
          <span className="public-nav__logo-icon">◈</span>
          DRME
        </Link>
        <div className="public-nav__links">
          <Link to="/" className="public-nav__link">Home</Link>
          <Link to="/features" className="public-nav__link">Features</Link>
          <Link to="/pricing" className="public-nav__link">Pricing</Link>
        </div>
      </nav>

      {/* Login Form */}
      <section className="hero" style={{ minHeight: '100vh' }}>
        <AnimatedCard>
          <div style={{ width: '100%', maxWidth: '400px', padding: 'var(--spacing-lg)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-bright)' }}>
              Sign In
            </h2>
            
            {(formError || error) && (
              <div style={{ 
                padding: 'var(--spacing-sm)', 
                marginBottom: 'var(--spacing-md)',
                background: 'var(--color-error-bg)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-error)',
                fontSize: '0.875rem'
              }}>
                {formError || error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <CyberInput
                label="Tenant ID"
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                placeholder="your-tenant-id"
              />
              
              <CyberInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
              />
              
              <CyberInput
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />

              <CyberButton 
                type="submit" 
                variant="primary" 
                size="lg"
                disabled={isLoading}
                style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </CyberButton>
            </form>

            <p style={{ 
              textAlign: 'center', 
              marginTop: 'var(--spacing-lg)', 
              color: 'var(--color-text-muted)',
              fontSize: '0.875rem'
            }}>
              Don't have an account?{' '}
              <Link to="/contact" style={{ color: 'var(--color-accent-light)' }}>
                Contact Admin
              </Link>
            </p>
          </div>
        </AnimatedCard>
      </section>
    </div>
  );
}
