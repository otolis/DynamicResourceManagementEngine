import React from 'react';
import { clsx } from 'clsx';

interface BrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const BrutalistButton: React.FC<BrutalistButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}) => {

  /* We'll use CSS classes that we'll define in a separate CSS module or just rely on global styles */
  const customClasses = clsx(
    'brutalist-button',
    `brutalist-button--${variant}`,
    `brutalist-button--${size}`,
    className
  );

  return (
    <button className={customClasses} {...props}>
      {children}
    </button>
  );
};
