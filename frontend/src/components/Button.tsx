// Componente: Button Moderno com Variantes
import React from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-600/20 hover:shadow-red-600/40',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200 hover:border-gray-300 dark:bg-gradient-to-r dark:from-white/10 dark:to-white/5 dark:text-white dark:hover:from-white/20 dark:hover:to-white/10 dark:border-white/20 dark:hover:border-white/40',
  ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10',
  danger: 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 hover:border-red-300 dark:bg-red-600/20 dark:text-red-300 dark:hover:bg-red-600/30 dark:border-red-600/50 dark:hover:border-red-500',
  outline: 'border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-white/30 dark:text-white dark:hover:border-white/60 dark:hover:bg-white/5',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0a0a0a]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}
