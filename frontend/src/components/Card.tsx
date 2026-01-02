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
        glassy && 'bg-white/5 backdrop-blur-sm',
        !glassy && 'bg-white/10',
        'border-white/10',
        hoverable && 'hover:border-white/20 hover:bg-white/8',
        gradient && 'bg-gradient-to-br from-white/10 to-white/5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
