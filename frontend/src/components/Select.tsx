// Componente: Select/Combobox Moderno
import React, { useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronsUpDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção',
  label,
  error,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(opt => opt.value === value);

  return (
    <div className={clsx('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-white/90 mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full px-4 py-3 rounded-xl text-left flex items-center justify-between',
          'bg-white border-2 border-gray-300 text-gray-900 dark:bg-white/5 dark:border dark:border-white/20 dark:text-white transition-all',
          error ? 'border-red-500 dark:border-red-500/50' : 'hover:border-gray-400 dark:hover:border-white/30',
          'focus:outline-none focus:ring-2 focus:ring-red-500/50'
        )}
      >
        <span className={selected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/40'}>
          {selected?.label || placeholder}
        </span>
        <ChevronsUpDown className="w-5 h-5 text-gray-400 dark:text-white/40" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-2 rounded-xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/20 shadow-2xl max-h-64 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange?.(option.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  'w-full px-4 py-3 text-left flex items-center justify-between',
                  'hover:bg-gray-100 dark:hover:bg-white/10 transition-colors',
                  value === option.value && 'bg-red-50 dark:bg-red-600/20'
                )}
              >
                <div>
                  <div className="text-gray-900 dark:text-white">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-white/60 mt-0.5">
                      {option.description}
                    </div>
                  )}
                </div>
                {value === option.value && (
                  <Check className="w-5 h-5 text-red-400" />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-400/90">{error}</p>
      )}
    </div>
  );
}
