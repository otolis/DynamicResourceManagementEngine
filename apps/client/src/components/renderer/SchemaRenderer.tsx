import React from 'react';
import DOMPurify from 'dompurify';
import { BrutalistInput } from '../common/BrutalistInput';

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
  defaultValue?: any;
  options?: Array<{ value: string; displayName: string }>;
}

export interface SchemaRendererProps {
  fields: SchemaField[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
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
      value: values[field.name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
        onChange(field.name, e.target.value),
      error: errors[field.name],
      required: field.isRequired,
    };

    switch (field.dataType) {
      case 'TEXT':
        return (
          <div key={field.name} className="brutalist-input-group border-all">
            <label className="brutalist-label border-bottom text-mono">
              {sanitizeLabel(field.displayName)}
            </label>
            <textarea
              className="brutalist-input text-sans"
              rows={4}
              name={field.name}
              value={values[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.isRequired}
            />
          </div>
        );

      case 'BOOLEAN':
        return (
          <div key={field.name} className="brutalist-checkbox-group border-all p-md flex items-center">
             <input
                type="checkbox"
                id={field.name}
                checked={!!values[field.name]}
                onChange={(e) => onChange(field.name, e.target.checked)}
                className="brutalist-checkbox"
              />
              <label htmlFor={field.name} className="text-mono ml-sm uppercase font-black">
                {sanitizeLabel(field.displayName)}
              </label>
          </div>
        );

      case 'ENUM':
        return (
          <div key={field.name} className="brutalist-input-group border-all">
            <label className="brutalist-label border-bottom text-mono">
              {sanitizeLabel(field.displayName)}
            </label>
            <select
              className="brutalist-input text-mono uppercase"
              name={field.name}
              value={values[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.isRequired}
            >
              <option value="">SELECT {field.displayName}</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.displayName}
                </option>
              ))}
            </select>
          </div>
        );

      case 'DATE':
        return (
          <BrutalistInput
            key={field.name}
            {...commonProps}
            type="date"
            mono
          />
        );

      case 'NUMBER':
      case 'DECIMAL':
        return (
          <BrutalistInput
            key={field.name}
            {...commonProps}
            type="number"
            mono
          />
        );

      default:
        return (
          <BrutalistInput
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
