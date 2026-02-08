import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { CyberButton } from '../components/ui/cyberButton';
import { PublicHeader } from '../components/layout/PublicHeader';
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
      <PublicHeader />

      <section className="hero" style={{ minHeight: '40vh' }}>
        <h1 className="hero__title">Pricing</h1>
        <p className="hero__subtitle">
          Simple, transparent pricing for teams of all sizes.
        </p>
      </section>

      <section className="page-section">
        <div className="pricing-grid">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`pricing-card ${tier.featured ? 'pricing-card--featured' : ''}`}
            >
              <h3 className="pricing-card__name">{tier.name}</h3>
              <div className="pricing-card__price">
                {tier.price}
                {tier.period && <span>{tier.period}</span>}
              </div>
              <p className="text-sm text-muted">{tier.description}</p>
              <ul className="pricing-card__features">
                {tier.features.map((feature) => (
                  <li key={feature} className="pricing-card__feature">
                    <Check size={16} className="pricing-card__feature-icon" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'auto' }}>
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
            </div>
          ))}
        </div>
      </section>

      <footer className="public-footer">
        <p>2026 DRME / Built for the future of resource management.</p>
      </footer>
    </div>
  );
}
