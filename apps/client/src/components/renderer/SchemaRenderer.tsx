import React from 'react';
import DOMPurify from 'dompurify';
import { CyberInput, CyberTextarea, CyberSelect } from '../ui/cyberInput';

export type AttributeType = 
  | 'STRING' 
  | 'TEXT' 
  | 'NUMBER' 
  | 'DECIMAL' 
  | 'DATE' 
  | 'DATETIME' 
  | 'BOOLEAN' 
  | 'ENUM' 
  | 'RELATION' 
  | 'JSON';

export interface SchemaField {
  name: string;
  displayName: string;
  dataType: AttributeType;
  isRequired?: boolean;
  defaultValue?: unknown;
  options?: Array<{ value: string; displayName: string }>;
}

export interface SchemaRendererProps {
  fields: SchemaField[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  errors?: Record<string, string>;
}

export const SchemaRenderer: React.FC<SchemaRendererProps> = ({
  fields,
  values,
  onChange,
  errors = {},
}) => {
  const sanitizeLabel = (label: string) => DOMPurify.sanitize(label);

  const renderField = (field: SchemaField) => {
    const commonProps = {
      label: sanitizeLabel(field.displayName),
      name: field.name,
      value: (values[field.name] as string) || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
        onChange(field.name, e.target.value),
      error: errors[field.name],
      required: field.isRequired,
    };

    switch (field.dataType) {
      case 'TEXT':
        return (
          <CyberTextarea
            key={field.name}
            label={sanitizeLabel(field.displayName)}
            name={field.name}
            value={(values[field.name] as string) || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            error={errors[field.name]}
            required={field.isRequired}
          />
        );

      case 'BOOLEAN':
        return (
          <div key={field.name} className="cyber-input-group">
            <label className="cyber-checkbox-label">
              <input
                type="checkbox"
                id={field.name}
                checked={!!values[field.name]}
                onChange={(e) => onChange(field.name, e.target.checked)}
                className="cyber-checkbox"
              />
              {sanitizeLabel(field.displayName)}
            </label>
          </div>
        );

      case 'ENUM':
        return (
          <CyberSelect
            key={field.name}
            label={sanitizeLabel(field.displayName)}
            name={field.name}
            value={(values[field.name] as string) || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            error={errors[field.name]}
            required={field.isRequired}
          >
            <option value="">Select {field.displayName}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.displayName}
              </option>
            ))}
          </CyberSelect>
        );

      case 'DATE':
        return (
          <CyberInput
            key={field.name}
            {...commonProps}
            type="date"
            mono
          />
        );

      case 'NUMBER':
      case 'DECIMAL':
        return (
          <CyberInput
            key={field.name}
            {...commonProps}
            type="number"
            mono
          />
        );

      default:
        return (
          <CyberInput
            key={field.name}
            {...commonProps}
            type="text"
          />
        );
    }
  };

  return (
    <div className="schema-grid">
      {fields.map(renderField)}
    </div>
  );
};
