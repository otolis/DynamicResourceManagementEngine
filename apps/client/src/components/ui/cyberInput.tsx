import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface CyberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  mono?: boolean;
}

export function CyberInput({
  label,
  error,
  mono,
  className,
  id,
  ...props
}: CyberInputProps) {
  const inputId = id || `cyber-input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="cyber-input-group">
      {label && (
        <label htmlFor={inputId} className="cyber-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'cyber-input',
          mono && 'cyber-input--mono',
          error && 'cyber-input--error',
          className
        )}
        {...props}
      />
      {error && <span className="cyber-error">{error}</span>}
    </div>
  );
}

interface CyberTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function CyberTextarea({
  label,
  error,
  className,
  id,
  ...props
}: CyberTextareaProps) {
  const textareaId = id || `cyber-textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="cyber-input-group">
      {label && (
        <label htmlFor={textareaId} className="cyber-label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={clsx(
          'cyber-textarea',
          error && 'cyber-textarea--error',
          className
        )}
        {...props}
      />
      {error && <span className="cyber-error">{error}</span>}
    </div>
  );
}

interface CyberSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function CyberSelect({
  label,
  error,
  children,
  className,
  id,
  ...props
}: CyberSelectProps) {
  const selectId = id || `cyber-select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="cyber-input-group">
      {label && (
        <label htmlFor={selectId} className="cyber-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx('cyber-select', className)}
        {...props}
      >
        {children}
      </select>
      {error && <span className="cyber-error">{error}</span>}
    </div>
  );
}

interface CyberCheckboxOption {
  value: string;
  label: string;
}

interface CyberCheckboxGroupProps {
  label?: string;
  options: CyberCheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  name: string;
}

export function CyberCheckboxGroup({
  label,
  options,
  selectedValues,
  onChange,
  name,
}: CyberCheckboxGroupProps) {
  const handleChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter((v) => v !== value));
    }
  };

  return (
    <div className="cyber-input-group">
      {label && <span className="cyber-label">{label}</span>}
      <div className="cyber-checkbox-group">
        {options.map((option) => (
          <label key={option.value} className="cyber-checkbox-label">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={selectedValues.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              className="cyber-checkbox"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
