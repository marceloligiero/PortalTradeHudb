import { useTranslation } from 'react-i18next';
import { GraduationCap, ShieldAlert, BarChart3, Headphones, Settings } from 'lucide-react';

const ITEM_ICONS = [GraduationCap, ShieldAlert, BarChart3, Headphones, Settings];
const ITEM_KEYS = ['training', 'tutoring', 'reports', 'tickets', 'masterData'] as const;

export default function SocialProofBar() {
  const { t } = useTranslation();

  const ITEMS = ITEM_KEYS.map((key, i) => ({
    icon: ITEM_ICONS[i],
    label: t(`landing.socialProof.${key}`),
  }));

  const REPEATED = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden bg-[#F8F9FB] dark:bg-[#111113] border-t border-b border-gray-200 dark:border-white/10 py-5">
      <div className="flex animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
        {REPEATED.map((item, i) => {
          const Icon = item.icon;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-2 mx-10 shrink-0 text-gray-400 dark:text-gray-600"
              style={{ opacity: 0.6 }}
            >
              <Icon className="w-4 h-4" />
              <span className="font-body text-xs uppercase" style={{ letterSpacing: '0.14em' }}>
                {item.label}
              </span>
              <span className="ml-8 text-gray-300 dark:text-white/10">·</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
