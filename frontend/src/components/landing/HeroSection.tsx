import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-santander-600 via-[#8B0000] to-[#1A0005] dark:from-[#1A0005] dark:via-santander-900 dark:to-[#660000]" />

      {/* Noise grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-santander-500/20 rounded-full blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div {...fadeUp(0.1)}>
          <span className="inline-block bg-white/10 border border-white/20 backdrop-blur text-xs text-white rounded-full px-4 py-1.5 font-body mb-8">
            {t('landing.hero.badge')}
          </span>
        </motion.div>

        <motion.h1
          {...fadeUp(0)}
          className="font-display text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6"
        >
          {t('landing.hero.title')}{' '}
          <span className="relative inline-block">
            {t('landing.hero.titleHighlight')}
            <span className="absolute bottom-0 left-0 w-full h-1 bg-santander-300/50 rounded-full" />
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.2)}
          className="font-body text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10"
        >
          {t('landing.hero.subtitle')}
        </motion.p>

        <motion.div {...fadeUp(0.4)} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="bg-santander-500 hover:bg-santander-600 text-white font-semibold px-8 py-4 rounded-full shadow-[0_0_40px_rgba(236,0,0,0.35)] hover:shadow-[0_0_60px_rgba(236,0,0,0.5)] transition-all duration-300 font-body"
          >
            {t('landing.hero.cta')} →
          </Link>
          <Link
            to="/login"
            className="border border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-full transition-all duration-300 font-body"
          >
            {t('landing.hero.ctaSecondary')}
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="w-6 h-6 text-white/40" />
      </motion.div>
    </section>
  );
}
