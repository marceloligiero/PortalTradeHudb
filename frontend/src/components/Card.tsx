// Componente: Card Moderno com hover effect
import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  glassy?: boolean;
  gradient?: boolean;
}

export default function Card({
  children,
  hoverable = true,
  glassy = true,
  gradient = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border transition-all duration-300',
        glassy && 'bg-white dark:bg-white/5 backdrop-blur-sm',
        !glassy && 'bg-gray-50 dark:bg-white/10',
        'border-gray-200 dark:border-white/10',
        hoverable && 'hover:border-gray-300 hover:bg-gray-50 dark:hover:border-white/20 dark:hover:bg-white/8',
        gradient && 'bg-gradient-to-br from-gray-50 to-white dark:from-white/10 dark:to-white/5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
