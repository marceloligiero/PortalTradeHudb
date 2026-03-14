import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

export default function QuoteSection() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="bg-santander-500 py-20 md:py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl md:text-5xl text-white leading-tight"
        >
          {t('landing.quote.text')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8"
        >
          <Link
            to="/register"
            className="inline-block border border-white/40 text-white hover:bg-white/10 px-6 py-3 rounded-full font-body font-medium transition-colors duration-300"
          >
            {t('landing.quote.cta')} →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
