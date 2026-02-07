import type { ReactNode } from 'react';
import { useAnime } from '../../hooks/useAnime';
import clsx from 'clsx';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({ children, className, delay = 0 }: AnimatedCardProps) {
  const ref = useAnime<HTMLDivElement>(
    {
      translateY: [30, 0],
      opacity: [0, 1],
      duration: 600,
      delay,
      easing: 'easeOutCubic',
    },
    []
  );

  return (
    <div
      ref={ref}
      className={clsx('animated-card', 'animated-card--initial', className)}
    >
      {children}
    </div>
  );
}
