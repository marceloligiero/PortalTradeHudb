// Componente: Textarea Moderno
import React from 'react';
import clsx from 'clsx';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export default function Textarea({
  label,
  error,
  helpText,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || Math.random().toString(36).substr(2, 9);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-white/90"
        >
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        className={clsx(
          'w-full px-4 py-3 rounded-xl resize-y',
          'bg-white/5 border border-white/20 text-white placeholder-white/40',
          'focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50',
          'hover:border-white/30 focus:hover:border-white/40',
          'transition-all duration-200 min-h-[120px]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500/50 focus:ring-red-500/30',
          className
        )}
        {...props}
      />

      {error && (
        <p className="text-sm text-red-400/90">{error}</p>
      )}

      {helpText && !error && (
        <p className="text-sm text-white/40">{helpText}</p>
      )}
    </div>
  );
}
