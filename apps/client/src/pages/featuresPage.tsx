import { Link } from 'react-router-dom';
import { Code, Database, Shield, Zap, Layers, Settings } from 'lucide-react';
import { CyberButton } from '../components/ui/cyberButton';
import { PublicHeader } from '../components/layout/PublicHeader';
import '../styles/pages.css';

export function FeaturesPage() {
  const features = [
    {
      icon: Code,
      title: 'Dynamic Forms',
      description: 'Generate forms from JSON schemas automatically. Support for all field types including text, numbers, dates, enums, booleans, and relations. Real-time validation with custom rules.',
    },
    {
      icon: Database,
      title: 'Multi-Tenancy',
      description: 'Built-in tenant isolation ensures data security across organizations. Configurable partitioning strategies support row-level, schema-level, or database-level isolation.',
    },
    {
      icon: Shield,
      title: 'RBAC/ABAC Security',
      description: 'Role-Based and Attribute-Based Access Control. Define granular permissions at the field level. Integrate with existing identity providers.',
    },
    {
      icon: Zap,
      title: 'Schema-Driven Architecture',
      description: 'Your schema is the single source of truth. Define entity types, attributes, and relationships once. Generate APIs, forms, and documentation automatically.',
    },
    {
      icon: Layers,
      title: 'Entity Type Management',
      description: 'Create, update, and manage entity types with full CRUD operations. Version control for schema changes. Migration support for production deployments.',
    },
    {
      icon: Settings,
      title: 'Extensible Plugins',
      description: 'Extend functionality with custom plugins. Hook into the rendering pipeline. Add custom field types and validation rules.',
    },
  ];

  return (
    <div className="public-page">
      <PublicHeader />

      <section className="hero" style={{ minHeight: '40vh' }}>
        <h1 className="hero__title">Features</h1>
        <p className="hero__subtitle">
          Everything you need to build powerful, enterprise-grade applications.
        </p>
      </section>

      <section className="page-section">
        <div className="feature-grid feature-grid--3col">
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

      <section className="page-section" style={{ textAlign: 'center' }}>
        <h2>Ready to get started?</h2>
        <p className="text-muted mb-lg">
          Try DRME today and experience the future of resource management.
        </p>
        <Link to="/app">
          <CyberButton variant="primary" size="lg">Enter App</CyberButton>
        </Link>
      </section>

      <footer className="public-footer">
        <p>2026 DRME / Built for the future of resource management.</p>
      </footer>
    </div>
  );
}
