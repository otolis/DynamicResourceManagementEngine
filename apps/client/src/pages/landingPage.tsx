import { Link } from 'react-router-dom';
import { Zap, Shield, Database, Code } from 'lucide-react';
import { useRef, useEffect } from 'react';
import anime from 'animejs';
import { CyberButton } from '../components/ui/cyberButton';
import { AnimatedCard } from '../components/ui/animatedCard';
import '../styles/pages.css';

export function LandingPage() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero text entrance
    if (titleRef.current) {
      anime({
        targets: titleRef.current,
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutCubic',
      });
    }

    if (subtitleRef.current) {
      anime({
        targets: subtitleRef.current,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 800,
        delay: 200,
        easing: 'easeOutCubic',
      });
    }

    // Animate gradient orbs
    const orbs = [orb1Ref.current, orb2Ref.current, orb3Ref.current];
    const animations: anime.AnimeInstance[] = [];

    orbs.forEach((orb, index) => {
      if (!orb) return;
      const anim = anime({
        targets: orb,
        translateX: [
          { value: (index + 1) * 25, duration: 4000 + index * 1000 },
          { value: -(index + 1) * 25, duration: 4000 + index * 1000 },
        ],
        translateY: [
          { value: -(index + 1) * 20, duration: 3000 + index * 800 },
          { value: (index + 1) * 20, duration: 3000 + index * 800 },
        ],
        scale: [
          { value: 1.15, duration: 5000 + index * 500 },
          { value: 0.85, duration: 5000 + index * 500 },
        ],
        easing: 'easeInOutSine',
        loop: true,
        direction: 'alternate',
      });
      animations.push(anim);
    });

    return () => {
      animations.forEach((anim) => anim.pause());
      orbs.forEach((orb) => orb && anime.remove(orb));
    };
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
      {/* Gradient Mesh Background */}
      <div className="mesh-background">
        <div ref={orb1Ref} className="mesh-orb mesh-orb--1" />
        <div ref={orb2Ref} className="mesh-orb mesh-orb--2" />
        <div ref={orb3Ref} className="mesh-orb mesh-orb--3" />
      </div>

      {/* Navigation */}
      <nav className="public-nav">
        <Link to="/" className="public-nav__logo">
          <span className="public-nav__logo-icon">◈</span>
          DRME
        </Link>
        <div className="public-nav__links">
          <Link to="/features" className="public-nav__link">Features</Link>
          <Link to="/pricing" className="public-nav__link">Pricing</Link>
          <Link to="/about" className="public-nav__link">About</Link>
          <Link to="/contact" className="public-nav__link">Contact</Link>
          <Link to="/app">
            <CyberButton variant="primary" size="sm">Enter App</CyberButton>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <h1 ref={titleRef} className="hero__title initial-hidden">
          Dynamic Resource
          <br />
          Management Engine
        </h1>
        <p ref={subtitleRef} className="hero__subtitle initial-hidden">
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
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <AnimatedCard key={feature.title} delay={index * 100}>
                <div className="feature-card">
                  <div className="feature-card__icon">
                    <Icon size={24} />
                  </div>
                  <h3 className="feature-card__title">{feature.title}</h3>
                  <p className="feature-card__description">{feature.description}</p>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="public-footer">
        <p>© 2026 DRME. Built for the future of resource management.</p>
      </footer>
    </div>
  );
}
