import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

export default function FinalCTA() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden">
      {/* Same hero gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-santander-600 via-[#8B0000] to-[#1A0005] dark:from-[#1A0005] dark:via-santander-900 dark:to-[#660000]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl md:text-5xl text-white font-bold leading-tight"
        >
          {t('landing.finalCta.title')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-body text-lg text-white/70 max-w-xl mx-auto mt-4"
        >
          {t('landing.finalCta.subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8"
        >
          <Link
            to="/register"
            className="inline-block bg-white text-santander-500 font-semibold px-8 py-4 rounded-full hover:bg-gray-100 shadow-lg transition-all duration-300 font-body"
          >
            {t('landing.finalCta.cta')} →
          </Link>
          <div className="mt-4">
            <Link
              to="/login"
              className="text-white/60 text-sm hover:text-white/80 transition-colors font-body"
            >
              {t('landing.finalCta.login')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
