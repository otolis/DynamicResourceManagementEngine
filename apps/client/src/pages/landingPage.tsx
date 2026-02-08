import { Link } from 'react-router-dom';
import { Zap, Shield, Database, Code } from 'lucide-react';
import { useRef, useEffect } from 'react';
import anime from 'animejs';
import { CyberButton } from '../components/ui/cyberButton';
import { PublicHeader } from '../components/layout/PublicHeader';
import '../styles/pages.css';

export function LandingPage() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      anime({
        targets: titleRef.current,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutCubic',
      });
    }

    if (subtitleRef.current) {
      anime({
        targets: subtitleRef.current,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: 150,
        easing: 'easeOutCubic',
      });
    }
  }, []);

  const features = [
    {
      icon: Code,
      title: 'Dynamic Forms',
      description: 'Schema-driven form generation with real-time validation and type safety.',
    },
    {
      icon: Database,
      title: 'Multi-Tenancy',
      description: 'Built-in tenant isolation with configurable data partitioning strategies.',
    },
    {
      icon: Shield,
      title: 'RBAC/ABAC Security',
      description: 'Fine-grained access control with role-based and attribute-based policies.',
    },
    {
      icon: Zap,
      title: 'Schema-Driven',
      description: 'Define once, render everywhere. Your schema is the single source of truth.',
    },
  ];

  return (
    <div className="public-page">
      <PublicHeader />

      {/* Hero Section */}
      <section className="hero">
        <h1 ref={titleRef} className="hero__title" style={{ opacity: 0 }}>
          Dynamic Resource
          <br />
          <span className="hero__title-accent">Management Engine</span>
        </h1>
        <p ref={subtitleRef} className="hero__subtitle" style={{ opacity: 0 }}>
          Build powerful, schema-driven applications with enterprise-grade security
          and multi-tenant architecture out of the box.
        </p>
        <div className="hero__cta">
          <Link to="/app">
            <CyberButton variant="primary" size="lg">Get Started</CyberButton>
          </Link>
          <Link to="/features">
            <CyberButton variant="glass" size="lg">Learn More</CyberButton>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="page-section">
        <h2 className="page-section__title">Why DRME?</h2>
        <div className="feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="feature-card">
                <div className="feature-card__icon">
                  <Icon size={22} />
                </div>
                <h3 className="feature-card__title">{feature.title}</h3>
                <p className="feature-card__description">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="public-footer">
        <p>2026 DRME / Built for the future of resource management.</p>
      </footer>
    </div>
  );
}
