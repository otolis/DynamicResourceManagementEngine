import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useAnimeOnDemand } from '../../hooks/useAnime';
import clsx from 'clsx';

type CyberButtonVariant = 'primary' | 'glass' | 'ghost';
type CyberButtonSize = 'sm' | 'md' | 'lg';

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: CyberButtonVariant;
  size?: CyberButtonSize;
  children: ReactNode;
}

export function CyberButton({
  variant = 'primary',
  size = 'md',
  children,
  className,
  onClick,
  ...props
}: CyberButtonProps) {
  const [ref, trigger] = useAnimeOnDemand<HTMLButtonElement>({
    scale: [0.95, 1],
    duration: 400,
    easing: 'easeOutElastic(1, .6)',
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    trigger();
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      className={clsx(
        'cyber-button',
        `cyber-button--${variant}`,
        `cyber-button--${size}`,
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
