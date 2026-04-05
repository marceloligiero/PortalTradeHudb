import type { LucideIcon } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Slot for action buttons (export, period filter, etc.) */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** CSS var(--card-index) for stagger animation */
  index?: number;
}

export default function ChartCard({
  title, subtitle, icon: Icon, actions, children, className = '', index = 0,
}: ChartCardProps) {
  return (
    <div
      className={`rep-card-enter bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}
      style={{ '--card-index': index } as React.CSSProperties}
    >
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-[#EC0000] flex-shrink-0" />}
            <p className="text-sm font-headline font-bold text-gray-900 dark:text-white">
              {title}
            </p>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 ml-6">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
