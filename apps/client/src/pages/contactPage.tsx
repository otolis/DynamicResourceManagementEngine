import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CyberButton } from '../components/ui/cyberButton';
import { CyberInput, CyberTextarea } from '../components/ui/cyberInput';
import { AnimatedCard } from '../components/ui/animatedCard';
import '../styles/pages.css';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitted(true);
    console.log('Form submitted:', formData);
  };

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
          <Link to="/about" className="public-nav__link">About</Link>
          <Link to="/contact" className="public-nav__link public-nav__link--active">Contact</Link>
          <Link to="/app">
            <CyberButton variant="primary" size="sm">Enter App</CyberButton>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" style={{ minHeight: '40vh' }}>
        <h1 className="hero__title">Contact Us</h1>
        <p className="hero__subtitle">
          Have questions? We'd love to hear from you.
        </p>
      </section>

      {/* Contact Form */}
      <section className="page-section">
        <AnimatedCard>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
              <h3 style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-md)' }}>
                Thank you for your message!
              </h3>
              <p style={{ color: 'var(--color-text-muted)' }}>
                We'll get back to you as soon as possible.
              </p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <CyberInput
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                placeholder="Your name"
              />
              <CyberInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                placeholder="your@email.com"
              />
              <CyberTextarea
                label="Message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                error={errors.message}
                placeholder="How can we help?"
              />
              <CyberButton type="submit" variant="primary" size="lg">
                Send Message
              </CyberButton>
            </form>
          )}
        </AnimatedCard>
      </section>

      {/* Footer */}
      <footer className="public-footer">
        <p>© 2026 DRME. Built for the future of resource management.</p>
      </footer>
    </div>
  );
}
