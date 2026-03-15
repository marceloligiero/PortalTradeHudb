import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// ANIM 1 — Hero Stagger Blur Reveal
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};
const child = {
  hidden:  { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] } },
};

// ANIM 9 — Magnetic Button
function MagneticLink({ to, className, children }: { to: string; className: string; children: React.ReactNode }) {
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMouse = (e: React.MouseEvent) => {
    if (prefersReduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width  / 2;
    const centerY = rect.top  + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.a
      ref={ref}
      href={to}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className={className}
    >
      {children}
    </motion.a>
  );
}

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

      {/* ANIM 2 — Floating Glow (respira) */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-santander-500/20 blur-[120px] pointer-events-none"
        animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content — ANIM 1 Stagger Blur Reveal */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={child}>
          <span className="inline-block bg-white/10 border border-white/20 backdrop-blur text-xs text-white rounded-full px-4 py-1.5 font-text mb-8">
            {t('landing.hero.badge')}
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={child}
          className="font-headline text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6"
        >
          {t('landing.hero.title')}{' '}
          {/* ANIM 12 — Text Shimmer na palavra destaque */}
          <span
            className="inline-block"
            style={{
              background: 'linear-gradient(110deg, #EC0000 30%, #FF6666 50%, #EC0000 70%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          >
            {t('landing.hero.titleHighlight')}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={child}
          className="font-text text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10"
        >
          {t('landing.hero.subtitle')}
        </motion.p>

        {/* CTAs — ANIM 9 Magnetic */}
        <motion.div variants={child} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <MagneticLink
            to="/register"
            className="bg-santander-500 hover:bg-santander-600 text-white font-text font-bold px-8 py-4 rounded-full shadow-[0_0_40px_rgba(236,0,0,0.35)] hover:shadow-[0_0_60px_rgba(236,0,0,0.5)] transition-all duration-300 cursor-pointer"
          >
            {t('landing.hero.cta')} →
          </MagneticLink>
          <MagneticLink
            to="/login"
            className="border border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-full font-text transition-all duration-300 cursor-pointer"
          >
            {t('landing.hero.ctaSecondary')}
          </MagneticLink>
        </motion.div>
      </motion.div>

      {/* ANIM 11 — Scroll Indicator CSS bounce-down */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-down">
        <ChevronDown className="w-6 h-6 text-white/40" />
      </div>
    </section>
  );
}
