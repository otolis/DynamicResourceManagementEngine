import React from 'react';
import { clsx } from 'clsx';

interface BrutalistInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  mono?: boolean;
}

export const BrutalistInput: React.FC<BrutalistInputProps> = ({
  label,
  error,
  mono = false,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="brutalist-input-group border-all">
      <label 
        htmlFor={inputId}
        className="brutalist-label border-bottom text-mono"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={clsx(
          'brutalist-input',
          mono && 'text-mono',
          error && 'brutalist-input--error',
          className
        )}
        {...props}
      />
      {error && (
        <div className="brutalist-error border-top text-mono">
          {error}
        </div>
      )}
    </div>
  );
};
