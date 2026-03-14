import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GraduationCap, BarChart3, Rocket, ArrowRight } from 'lucide-react';
import { useInView } from '../../hooks/useInView';

const PILLARS = [
  { icon: GraduationCap, key: 'train' },
  { icon: BarChart3, key: 'evaluate' },
  { icon: Rocket, key: 'evolve' },
];

export default function PillarsSection() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="py-24 md:py-32 bg-gray-50 dark:bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('landing.pillars.title')}
          </h2>
          <p className="font-body text-lg text-gray-500 dark:text-gray-400">
            {t('landing.pillars.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.key}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:border-santander-500/30 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-santander-500" />
                </div>
                <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {t(`landing.pillars.${pillar.key}.title`)}
                </h3>
                <p className="font-body text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-4">
                  {t(`landing.pillars.${pillar.key}.description`)}
                </p>
                <span className="inline-flex items-center gap-1 text-santander-500 font-medium font-body group-hover:gap-2 transition-all duration-300">
                  {t('landing.pillars.learnMore')}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
