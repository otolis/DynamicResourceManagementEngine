import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { CyberButton } from '../components/ui/cyberButton';
import { AnimatedCard } from '../components/ui/animatedCard';
import '../styles/pages.css';

const tiers = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      'Up to 3 entity types',
      '1,000 records',
      'Basic RBAC',
      'Community support',
    ],
    cta: 'Start Free',
    featured: false,
  },
  {
    name: 'Professional',
    price: '$49',
    period: '/month',
    description: 'For growing teams',
    features: [
      'Unlimited entity types',
      '100,000 records',
      'Advanced RBAC/ABAC',
      'Multi-tenancy',
      'Priority support',
      'Custom plugins',
    ],
    cta: 'Start Trial',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Everything in Professional',
      'Unlimited records',
      'SSO integration',
      'Dedicated support',
      'SLA guarantee',
      'On-premise deployment',
    ],
    cta: 'Contact Sales',
    featured: false,
  },
];

export function PricingPage() {
  return (
    <div className="public-page">
      {/* Navigation */}
      <nav className="public-nav">
        <Link to="/" className="public-nav__logo">
          <span className="public-nav__logo-icon">◈</span>
          DRME
        </Link>
        <div className="public-nav__links">
          <Link to="/features" className="public-nav__link">Features</Link>
          <Link to="/pricing" className="public-nav__link public-nav__link--active">Pricing</Link>
          <Link to="/about" className="public-nav__link">About</Link>
          <Link to="/contact" className="public-nav__link">Contact</Link>
          <Link to="/app">
            <CyberButton variant="primary" size="sm">Enter App</CyberButton>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" style={{ minHeight: '40vh' }}>
        <h1 className="hero__title">Pricing</h1>
        <p className="hero__subtitle">
          Simple, transparent pricing for teams of all sizes.
        </p>
      </section>

      {/* Pricing Grid */}
      <section className="page-section">
        <div className="pricing-grid">
          {tiers.map((tier, index) => (
            <AnimatedCard
              key={tier.name}
              delay={index * 100}
              className={tier.featured ? 'pricing-card--featured' : ''}
            >
              <div className="pricing-card">
                <h3 className="pricing-card__name">{tier.name}</h3>
                <div className="pricing-card__price">
                  {tier.price}
                  {tier.period && <span>{tier.period}</span>}
                </div>
                <p style={{ color: 'var(--color-text-muted)' }}>{tier.description}</p>
                <ul className="pricing-card__features">
                  {tier.features.map((feature) => (
                    <li key={feature} className="pricing-card__feature">
                      <Check size={16} className="pricing-card__feature-icon" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to={tier.name === 'Enterprise' ? '/contact' : '/app'}>
                  <CyberButton
                    variant={tier.featured ? 'primary' : 'glass'}
                    size="md"
                    style={{ width: '100%' }}
                  >
                    {tier.cta}
                  </CyberButton>
                </Link>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="public-footer">
        <p>© 2026 DRME. Built for the future of resource management.</p>
      </footer>
    </div>
  );
}
