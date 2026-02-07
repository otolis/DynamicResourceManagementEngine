import { Link } from 'react-router-dom';
import { CyberButton } from '../components/ui/cyberButton';
import { AnimatedCard } from '../components/ui/animatedCard';
import '../styles/pages.css';

export function AboutPage() {
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
          <Link to="/pricing" className="public-nav__link">Pricing</Link>
          <Link to="/about" className="public-nav__link public-nav__link--active">About</Link>
          <Link to="/contact" className="public-nav__link">Contact</Link>
          <Link to="/app">
            <CyberButton variant="primary" size="sm">Enter App</CyberButton>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" style={{ minHeight: '50vh' }}>
        <h1 className="hero__title">About DRME</h1>
        <p className="hero__subtitle">
          The Dynamic Resource Management Engine powering the next generation of enterprise applications.
        </p>
      </section>

      {/* Content */}
      <section className="page-section">
        <div className="feature-grid" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <AnimatedCard delay={0}>
            <h3 className="feature-card__title">What is DRME?</h3>
            <p className="feature-card__description">
              DRME is a schema-driven platform for building dynamic, multi-tenant applications. 
              Instead of hard-coding forms and data structures, you define them in schemas that 
              DRME interprets at runtime to generate UIs, APIs, and database structures.
            </p>
          </AnimatedCard>

          <AnimatedCard delay={100}>
            <h3 className="feature-card__title">Technology Stack</h3>
            <p className="feature-card__description">
              Built with React and TypeScript on the frontend, NestJS on the backend, 
              and Prisma with PostgreSQL for data persistence. Designed for performance, 
              type safety, and developer experience.
            </p>
          </AnimatedCard>

          <AnimatedCard delay={200}>
            <h3 className="feature-card__title">Our Vision</h3>
            <p className="feature-card__description">
              We believe in empowering developers to build complex applications faster 
              without sacrificing flexibility or security. DRME provides the foundation 
              so you can focus on what makes your application unique.
            </p>
          </AnimatedCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="public-footer">
        <p>© 2026 DRME. Built for the future of resource management.</p>
      </footer>
    </div>
  );
}
