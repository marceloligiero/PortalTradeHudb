// Componente: Spinner Moderno
import React from 'react';
import clsx from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'red' | 'white' | 'blue';
  text?: string;
}

const sizeStyles = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

const colorStyles = {
  red: 'text-red-500',
  white: 'text-white',
  blue: 'text-blue-500',
};

export default function Spinner({
  size = 'md',
  color = 'red',
  text,
}: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={clsx('relative', sizeStyles[size])}>
        {/* Outer ring */}
        <svg
          className={clsx(
            'absolute inset-0 animate-spin',
            colorStyles[color]
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>

        {/* Inner glow */}
        <div
          className={clsx(
            'absolute inset-2 rounded-full blur-sm',
            'bg-gradient-to-r from-red-500/20 to-transparent'
          )}
        />
      </div>

      {text && (
        <p className="text-white/70 text-sm font-medium">{text}</p>
      )}
    </div>
  );
}
