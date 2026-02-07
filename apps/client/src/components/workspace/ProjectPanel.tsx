// ProjectPanel - Content panel for an open project tab

import { useState, useEffect } from 'react';
import { SchemaRenderer } from '../renderer/SchemaRenderer';
import type { SchemaField } from '../renderer/SchemaRenderer';
import { CyberButton } from '../ui/cyberButton';
import { AnimatedCard } from '../ui/animatedCard';
import type { EntityType } from '../../api';

interface ProjectPanelProps {
  project: EntityType;
  onSave?: (data: Record<string, unknown>) => void;
}

// Convert entity type to schema fields for rendering
function entityTypeToSchemaFields(): SchemaField[] {
  return [
    { name: 'name', displayName: 'Project Name', dataType: 'STRING', isRequired: true },
    { name: 'displayName', displayName: 'Display Name', dataType: 'STRING', isRequired: true },
    { name: 'description', displayName: 'Description', dataType: 'TEXT' },
    { name: 'tableName', displayName: 'Table Name', dataType: 'STRING' },
    { name: 'isActive', displayName: 'Active', dataType: 'BOOLEAN' },
  ];
}

export function ProjectPanel({ project, onSave }: ProjectPanelProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({
    name: project.name,
    displayName: project.displayName,
    description: project.description || '',
    tableName: project.tableName,
    isActive: project.isActive,
  });
  const [isDirty, setIsDirty] = useState(false);

  // Sync form data when project changes (tab switch)
  useEffect(() => {
    setFormData({
      name: project.name,
      displayName: project.displayName,
      description: project.description || '',
      tableName: project.tableName,
      isActive: project.isActive,
    });
    setIsDirty(false);
  }, [project.id]); // Reset when project ID changes

  const handleFieldChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave?.(formData);
    setIsDirty(false);
  };

  const handleReset = () => {
    setFormData({
      name: project.name,
      displayName: project.displayName,
      description: project.description || '',
      tableName: project.tableName,
      isActive: project.isActive,
    });
    setIsDirty(false);
  };

  const fields = entityTypeToSchemaFields();

  return (
    <div className="project-panel">
      <AnimatedCard>
        <div className="project-panel__header">
          <h3 style={{ color: 'var(--color-text-bright)', marginBottom: 'var(--spacing-xs)' }}>
            {project.displayName}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            ID: {project.id}
          </p>
        </div>

        <div className="project-panel__form">
          <SchemaRenderer
            fields={fields}
            values={formData}
            onChange={handleFieldChange}
          />
        </div>

        <div className="project-panel__actions">
          <CyberButton variant="ghost" onClick={handleReset} disabled={!isDirty}>
            Reset
          </CyberButton>
          <CyberButton variant="primary" onClick={handleSave} disabled={!isDirty}>
            Save Changes
          </CyberButton>
        </div>
      </AnimatedCard>

      <AnimatedCard delay={100}>
        <h4 style={{ color: 'var(--color-text-bright)', marginBottom: 'var(--spacing-md)' }}>
          Project Data
        </h4>
        <pre
          className="text-mono"
          style={{
            padding: 'var(--spacing-md)',
            background: 'var(--glass-bg-active)',
            borderRadius: 'var(--radius-md)',
            overflow: 'auto',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {JSON.stringify(formData, null, 2)}
        </pre>
      </AnimatedCard>
    </div>
  );
}
