import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BookOpen, Users, BarChart3, LifeBuoy, Settings } from 'lucide-react';
import { useInView } from '../../hooks/useInView';
import { cn } from '../../lib/cn';

const FEATURES = [
  {
    key: 'courses',
    icon: BookOpen,
    colSpan: 'md:col-span-2 md:row-span-2',
    gradient: 'bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-gray-900',
  },
  {
    key: 'tutoring',
    icon: Users,
    colSpan: '',
    gradient: 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950',
  },
  {
    key: 'reports',
    icon: BarChart3,
    colSpan: '',
    gradient: 'bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-900',
  },
  {
    key: 'tickets',
    icon: LifeBuoy,
    colSpan: '',
    gradient: 'bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900',
  },
  {
    key: 'masterdata',
    icon: Settings,
    colSpan: '',
    gradient: 'bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-gray-900',
    badge: 'ADMIN',
  },
];

export default function FeaturesGrid() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="py-24 md:py-32 bg-white dark:bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-16">
          {t('landing.features.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={cn(
                  'rounded-2xl overflow-hidden p-8 border border-gray-200 dark:border-gray-800 hover:scale-[1.02] transition-transform duration-300',
                  feat.gradient,
                  feat.colSpan
                )}
              >
                <Icon className="w-8 h-8 text-santander-500 mb-4" />
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {t(`landing.features.${feat.key}.title`)}
                </h3>
                <p className="font-body text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(`landing.features.${feat.key}.description`)}
                </p>
                {feat.badge && (
                  <span className="inline-block mt-3 bg-red-50 dark:bg-red-900/30 text-santander-500 text-xs rounded-full px-2 py-0.5 font-mono">
                    {feat.badge}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
