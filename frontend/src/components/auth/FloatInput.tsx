import { useState } from 'react';

interface FloatInputProps {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  right?: React.ReactNode;
  autoFocus?: boolean;
  label?: string;
  id?: string;
  'aria-describedby'?: string;
}

/**
 * FloatInput — Unified input component for all auth pages.
 * Santander #EC0000 focus state, optional label, font-body.
 */
export default function FloatInput({
  type = 'text', placeholder, value, onChange, icon, right, autoFocus, label, id,
  'aria-describedby': ariaDescribedBy,
}: FloatInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label htmlFor={id}
          className="text-[10px] font-body font-bold text-gray-500 dark:text-white/50 uppercase tracking-[0.12em] mb-2 block">
          {label}
        </label>
      )}
      <div className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300 ${
        focused
          ? 'border-[#EC0000]/40 bg-black/[0.04] dark:bg-white/[0.06] shadow-[0_0_0_4px_rgba(236,0,0,0.08)]'
          : 'border-gray-200 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.025] hover:border-gray-300 dark:hover:border-white/[0.15] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
      }`}>
        <div className={`flex-shrink-0 transition-colors duration-200 ${focused ? 'text-[#EC0000]' : 'text-gray-400 dark:text-white/40'}`}>
          {icon}
        </div>
        <input
          id={id}
          type={type} value={value} onChange={onChange} autoFocus={autoFocus}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          aria-describedby={ariaDescribedBy}
          className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/35 outline-none text-[15px] font-body font-medium"
        />
        {right}
      </div>
    </div>
  );
}
