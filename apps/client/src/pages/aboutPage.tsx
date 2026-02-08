import { Link } from 'react-router-dom';
import { CyberButton } from '../components/ui/cyberButton';
import '../styles/pages.css';

const stack = [
  { label: 'Frontend', value: 'React + TypeScript + Vite' },
  { label: 'Backend', value: 'NestJS + Prisma' },
  { label: 'Database', value: 'PostgreSQL' },
  { label: 'Auth', value: 'JWT + Refresh Tokens' },
  { label: 'Infra', value: 'Docker + Docker Compose' },
];

export function AboutPage() {
  return (
    <div className="public-page">
      <nav className="public-nav">
        <Link to="/" className="public-nav__logo">
          <span className="public-nav__logo-icon">&#9670;</span>
          DRME
        </Link>
        <div className="public-nav__links">
          <Link to="/features" className="public-nav__link">Features</Link>
          <Link to="/pricing" className="public-nav__link">Pricing</Link>
          <Link to="/about" className="public-nav__link public-nav__link--active">About</Link>
          <Link to="/contact" className="public-nav__link">Contact</Link>
          <Link to="/app">
            <CyberButton variant="primary" size="sm">Enter App</CyberButton>
          </Link>
        </div>
      </nav>

      <section className="hero" style={{ minHeight: '40vh' }}>
        <h1 className="hero__title">About DRME</h1>
        <p className="hero__subtitle">
          The Dynamic Resource Management Engine powering the next generation of enterprise applications.
        </p>
      </section>

      {/* What is DRME */}
      <section className="about-section">
        <div className="about-section__label">01 / What</div>
        <div className="about-section__content">
          <h2 className="about-section__title">Schema-driven, not hard-coded</h2>
          <p className="about-section__text">
            DRME is a platform for building dynamic, multi-tenant applications.
            Instead of hard-coding forms and data structures, you define them in
            schemas that DRME interprets at runtime to generate UIs, APIs, and
            database structures automatically.
          </p>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="about-section">
        <div className="about-section__label">02 / Stack</div>
        <div className="about-section__content">
          <h2 className="about-section__title">Technology</h2>
          <div className="about-stack">
            {stack.map((item) => (
              <div key={item.label} className="about-stack__row">
                <span className="about-stack__label">{item.label}</span>
                <span className="about-stack__value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="about-section">
        <div className="about-section__label">03 / Vision</div>
        <div className="about-section__content">
          <h2 className="about-section__title">Build more, configure less</h2>
          <p className="about-section__text">
            We believe in empowering developers to build complex applications
            faster without sacrificing flexibility or security. DRME provides the
            foundation so you can focus on what makes your application unique.
          </p>
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <Link to="/features">
              <CyberButton variant="primary" size="md">See Features</CyberButton>
            </Link>
          </div>
        </div>
      </section>

      <footer className="public-footer">
        <p>2026 DRME / Built for the future of resource management.</p>
      </footer>
    </div>
  );
}
