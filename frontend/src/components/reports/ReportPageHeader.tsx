import type { LucideIcon } from 'lucide-react';

interface ReportPageHeaderProps {
  /** Uppercase badge above the title (e.g. "Portal de Relatórios") */
  badge?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Optional right-side slot for action buttons */
  actions?: React.ReactNode;
  /** Wrap in card shell (default false — inline header) */
  card?: boolean;
}

export default function ReportPageHeader({
  badge, title, subtitle, icon: Icon, actions, card = false,
}: ReportPageHeaderProps) {
  const content = (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-[#EC0000]/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-[#EC0000]" />
          </div>
        )}
        <div>
          {badge && (
            <p className="text-xs font-bold uppercase tracking-widest text-[#EC0000] mb-0.5">
              {badge}
            </p>
          )}
          <h1 className="text-2xl font-headline font-bold text-gray-900 dark:text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );

  if (card) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        {content}
      </div>
    );
  }

  return content;
}
