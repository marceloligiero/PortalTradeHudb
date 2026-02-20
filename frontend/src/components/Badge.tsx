// Componente: Badge Moderno
import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-red-600/20 text-red-300 border border-red-600/50',
  success: 'bg-green-600/20 text-green-300 border border-green-600/50',
  warning: 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/50',
  danger: 'bg-red-600/20 text-red-300 border border-red-600/50',
  info: 'bg-blue-600/20 text-blue-300 border border-blue-600/50',
};

const sizeStyles = {
  sm: 'px-2.5 py-1 text-xs font-medium',
  md: 'px-3 py-1.5 text-sm font-medium',
  lg: 'px-4 py-2 text-base font-medium',
};

export default function Badge({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
