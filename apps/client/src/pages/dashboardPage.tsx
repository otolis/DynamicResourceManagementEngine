import { useState } from 'react';
import { FluidShell } from '../components/layout/fluidShell';
import { SchemaRenderer } from '../components/renderer/SchemaRenderer';
import type { SchemaField } from '../components/renderer/SchemaRenderer';
import { CyberButton } from '../components/ui/cyberButton';
import { AnimatedCard } from '../components/ui/animatedCard';

const DEMO_SCHEMA: SchemaField[] = [
  { name: 'projectName', displayName: 'Project Name', dataType: 'STRING', isRequired: true },
  { name: 'description', displayName: 'Description', dataType: 'TEXT' },
  { name: 'budget', displayName: 'Initial Budget', dataType: 'DECIMAL' },
  { name: 'status', displayName: 'Project Status', dataType: 'ENUM', options: [
    { value: 'DRAFT', displayName: 'Draft Mode' },
    { value: 'ACTIVE', displayName: 'Active Pipeline' },
    { value: 'COMPLETED', displayName: 'Archived / Complete' },
  ]},
  { name: 'deadline', displayName: 'Release Date', dataType: 'DATE' },
  { name: 'isPriority', displayName: 'High Priority Flag', dataType: 'BOOLEAN' },
];

export function DashboardPage() {
  const [formData, setFormData] = useState<Record<string, unknown>>({
    projectName: 'Cyber-Fluid Demo',
    status: 'ACTIVE',
    isPriority: true,
  });

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log('Saving Data:', formData);
    alert('Data saved! Check console for details.');
  };

  return (
    <FluidShell>
      <div className="flex flex-col gap-xl">
        <AnimatedCard delay={0}>
          <h2 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-bright)' }}>
            Schema Renderer Demo
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)' }}>
            This form is dynamically generated from a JSON schema definition.
          </p>
          <SchemaRenderer
            fields={DEMO_SCHEMA}
            values={formData}
            onChange={handleFieldChange}
          />
          <div className="flex gap-md justify-end" style={{ marginTop: 'var(--spacing-lg)' }}>
            <CyberButton variant="ghost" onClick={() => setFormData({})}>
              Reset
            </CyberButton>
            <CyberButton variant="primary" onClick={handleSave}>
              Save Project
            </CyberButton>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-bright)' }}>
            Current State
          </h3>
          <pre 
            className="text-mono" 
            style={{ 
              padding: 'var(--spacing-md)', 
              background: 'var(--glass-bg-active)', 
              borderRadius: 'var(--radius-md)',
              overflow: 'auto',
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)'
            }}
          >
            {JSON.stringify(formData, null, 2)}
          </pre>
        </AnimatedCard>
      </div>
    </FluidShell>
  );
}
