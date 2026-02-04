// Componente: Dropdown Moderno
import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  badge?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  label?: string;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
}

export default function Dropdown({
  options,
  value,
  onChange,
  label,
  placeholder = 'Selecionar...',
  searchable = false,
  disabled = false,
  error,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = searchable
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-white/90">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={clsx(
            'w-full px-4 py-3 rounded-xl text-left flex items-center justify-between',
            'bg-white/5 border border-white/20 text-white',
            'hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50',
            'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500/50'
          )}
        >
          <span className={selectedOption ? 'text-white' : 'text-white/40'}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={clsx(
            'w-5 h-5 text-white/40 transition-transform',
            isOpen && 'rotate-180'
          )} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-xl z-10 overflow-hidden">
            {searchable && (
              <div className="p-2 border-b border-white/10">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>
            )}

            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-white/60">
                  Nenhuma opção encontrada
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange?.(option.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={clsx(
                      'w-full px-4 py-3 text-left flex items-center justify-between',
                      'hover:bg-white/10 transition-colors',
                      value === option.value && 'bg-red-600/20'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && (
                        <span className="text-white/60">{option.icon}</span>
                      )}
                      <span>{option.label}</span>
                    </div>
                    {option.badge && (
                      <span className="px-2 py-1 text-xs bg-red-600/20 text-red-300 rounded">
                        {option.badge}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400/90">{error}</p>
      )}
    </div>
  );
}
