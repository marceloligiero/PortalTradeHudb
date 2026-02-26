// Componente: Radio Group Moderno
import React from 'react';
import clsx from 'clsx';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  label?: string;
  error?: string;
  orientation?: 'horizontal' | 'vertical';
}

export default function RadioGroup({
  options,
  value,
  onChange,
  name,
  label,
  error,
  orientation = 'vertical',
}: RadioGroupProps) {
  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-white/90">
          {label}
        </label>
      )}

      <div className={clsx(
        'flex gap-4',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
      )}>
        {options.map((option) => (
          <div key={option.value} className="flex items-start gap-3">
            <div className="relative flex items-center">
              <input
                type="radio"
                id={`${name}-${option.value}`}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange?.(option.value)}
                disabled={option.disabled}
                className="peer sr-only"
              />
              <label
                htmlFor={`${name}-${option.value}`}
                className={clsx(
                  'w-5 h-5 rounded-full border-2 cursor-pointer transition-all',
                  'flex items-center justify-center',
                  'peer-checked:border-red-600',
                  'peer-focus:ring-2 peer-focus:ring-red-500/50 peer-focus:ring-offset-2 peer-focus:ring-offset-[#0a0a0a]',
                  'hover:border-white/40',
                  option.disabled && 'opacity-50 cursor-not-allowed',
                  error ? 'border-red-500/50' : 'border-white/30'
                )}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 opacity-0 peer-checked:opacity-100 transition-opacity" />
              </label>
            </div>

            <div className="flex-1">
              <label
                htmlFor={`${name}-${option.value}`}
                className={clsx(
                  'block text-sm font-medium cursor-pointer',
                  option.disabled ? 'text-white/40' : 'text-white'
                )}
              >
                {option.label}
              </label>
              {option.description && (
                <p className="text-sm text-white/60 mt-0.5">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-400/90">{error}</p>
      )}
    </div>
  );
}
