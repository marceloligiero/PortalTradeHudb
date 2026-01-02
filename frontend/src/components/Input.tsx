// Componente: Input Moderno com Label integrado
import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helpText?: string;
  theme?: 'dark' | 'light';
}

export default function Input({
  label,
  error,
  icon,
  helpText,
  className,
  id,
  theme,
  ...props
}: InputProps) {
  const inputId = id || Math.random().toString(36).substr(2, 9);
  
  // Auto-detect theme from parent background if not provided
  const isDark = theme === 'dark' || theme === undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(
            'block text-sm font-medium transition-colors',
            isDark ? 'text-white/90' : 'text-gray-700'
          )}
        >
          {label}
        </label>
      )}
      
      <div className="relative group">
        {icon && (
          <div className={clsx(
            'absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none',
            isDark 
              ? 'text-white/40 group-focus-within:text-white/70'
              : 'text-gray-400 group-focus-within:text-gray-600'
          )}>
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          className={clsx(
            'w-full px-4 py-3 rounded-xl',
            'focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            icon && 'pl-10',
            isDark ? [
              'bg-white/5 border border-white/20 text-white placeholder-white/40',
              'hover:border-white/30 focus:hover:border-white/40',
            ] : [
              'bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-400',
              'hover:border-gray-400 focus:hover:border-gray-400',
            ],
            error && (isDark ? 'border-red-500/50 focus:ring-red-500/30' : 'border-red-500 focus:ring-red-500/30'),
            className
          )}
          {...props}
        />
      </div>

      {error && (
        <p className={clsx(
          'text-sm mt-1',
          isDark ? 'text-red-400/90' : 'text-red-600'
        )}>{error}</p>
      )}
      
      {helpText && !error && (
        <p className={clsx(
          'text-sm mt-1',
          isDark ? 'text-white/40' : 'text-gray-500'
        )}>{helpText}</p>
      )}
    </div>
  );
}
