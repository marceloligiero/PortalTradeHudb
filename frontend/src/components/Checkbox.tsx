// Componente: Checkbox Moderno
import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

export default function Checkbox({
  label,
  description,
  error,
  className,
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || Math.random().toString(36).substr(2, 9);

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id={checkboxId}
            className="peer sr-only"
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className={clsx(
              'w-5 h-5 rounded-md border-2 cursor-pointer transition-all',
              'flex items-center justify-center',
              'peer-checked:bg-red-600 peer-checked:border-red-600',
              'peer-focus:ring-2 peer-focus:ring-red-500/50 peer-focus:ring-offset-2 peer-focus:ring-offset-[#0a0a0a]',
              'hover:border-white/40',
              error ? 'border-red-500/50' : 'border-white/30',
              className
            )}
          >
            <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
          </label>
        </div>

        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={checkboxId}
                className="block text-sm font-medium text-white cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-white/60 mt-0.5">{description}</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400/90 ml-8">{error}</p>
      )}
    </div>
  );
}
