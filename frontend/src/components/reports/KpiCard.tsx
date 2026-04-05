import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  /** Positive = green arrow up, negative = red arrow down */
  delta?: number;
  deltaLabel?: string;
  /** Tailwind bg class for icon box, e.g. "bg-blue-50 dark:bg-blue-900/20" */
  boxClass: string;
  /** Tailwind text class for icon, e.g. "text-blue-600 dark:text-blue-400" */
  iconClass: string;
  /** CSS var(--card-index) for stagger animation, 0-based */
  index?: number;
}

export default function KpiCard({
  icon: Icon, label, value, sub, delta, deltaLabel,
  boxClass, iconClass, index = 0,
}: KpiCardProps) {
  const hasDelta = delta !== undefined;
  const isPositive = hasDelta && delta >= 0;

  return (
    <div
      className="rep-card-enter relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex gap-4 items-start overflow-hidden hover:border-[#EC0000]/30 hover:shadow-sm transition-all duration-200"
      style={{ '--card-index': index } as React.CSSProperties}
    >
      {/* Left accent stripe — the differentiator */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#EC0000] rounded-l-2xl" />

      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${boxClass}`}>
        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white leading-none">
          {value}
        </p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 truncate">
          {label}
        </p>

        {/* Sub or Delta */}
        {hasDelta ? (
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${
            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#EC0000]'
          }`}>
            {isPositive
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />}
            {Math.abs(delta)}%{deltaLabel ? ` ${deltaLabel}` : ''}
          </div>
        ) : sub ? (
          <p className="text-xs mt-1 text-gray-400 dark:text-gray-500 truncate">{sub}</p>
        ) : null}
      </div>
    </div>
  );
}
