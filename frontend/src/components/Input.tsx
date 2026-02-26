// Componente: Input Moderno com Label integrado
import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helpText?: string;
}

export default function Input({
  label,
  error,
  icon,
  helpText,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || Math.random().toString(36).substr(2, 9);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium transition-colors text-gray-700 dark:text-white/90"
        >
          {label}
        </label>
      )}
      
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none text-gray-400 group-focus-within:text-gray-600 dark:text-white/40 dark:group-focus-within:text-white/70">
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
            'bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-400',
            'hover:border-gray-400 focus:hover:border-gray-400',
            'dark:bg-white/5 dark:border dark:border-white/20 dark:text-white dark:placeholder-white/40',
            'dark:hover:border-white/30 dark:focus:hover:border-white/40',
            error && 'border-red-500 focus:ring-red-500/30 dark:border-red-500/50',
            className
          )}
          {...props}
        />
      </div>

      {error && (
        <p className="text-sm mt-1 text-red-600 dark:text-red-400/90">{error}</p>
      )}
      
      {helpText && !error && (
        <p className="text-sm mt-1 text-gray-500 dark:text-white/40">{helpText}</p>
      )}
    </div>
  );
}
