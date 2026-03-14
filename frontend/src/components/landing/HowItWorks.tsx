import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

const STEPS = [
  { number: 1, key: 'register' },
  { number: 2, key: 'access' },
  { number: 3, key: 'tutoring' },
  { number: 4, key: 'evolve' },
];

export default function HowItWorks() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="py-24 md:py-32 bg-gray-50 dark:bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-16">
          {t('landing.howItWorks.title')}
        </h2>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-0.5 bg-santander-500/30 -translate-x-1/2" />

          {STEPS.map((step, i) => {
            const isLeft = i % 2 === 0;
            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="relative flex items-start mb-12 last:mb-0"
              >
                {/* Mobile: content always right */}
                <div className="md:hidden flex items-start gap-4">
                  <div className="relative z-10 w-10 h-10 rounded-full bg-santander-500 text-white font-mono font-bold flex items-center justify-center shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {t(`landing.howItWorks.${step.key}.title`)}
                    </h3>
                    <p className="font-body text-gray-500 dark:text-gray-400">
                      {t(`landing.howItWorks.${step.key}.description`)}
                    </p>
                  </div>
                </div>

                {/* Desktop: alternating */}
                <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:gap-8 md:items-center w-full">
                  <div className={isLeft ? 'text-right' : ''}>
                    {isLeft && (
                      <>
                        <h3 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {t(`landing.howItWorks.${step.key}.title`)}
                        </h3>
                        <p className="font-body text-gray-500 dark:text-gray-400">
                          {t(`landing.howItWorks.${step.key}.description`)}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="relative z-10 w-10 h-10 rounded-full bg-santander-500 text-white font-mono font-bold flex items-center justify-center">
                    {step.number}
                  </div>
                  <div>
                    {!isLeft && (
                      <>
                        <h3 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {t(`landing.howItWorks.${step.key}.title`)}
                        </h3>
                        <p className="font-body text-gray-500 dark:text-gray-400">
                          {t(`landing.howItWorks.${step.key}.description`)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
