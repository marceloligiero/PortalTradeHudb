import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

// ANIM 1 — Hero Stagger Blur Reveal
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const child = {
  hidden:  { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] } },
};

// ANIM 9 — Magnetic Button
function MagneticButton({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
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
    x.set((e.clientX - (rect.left + rect.width  / 2)) * 0.15);
    y.set((e.clientY - (rect.top  + rect.height / 2)) * 0.15);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

export default function FinalCTA() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden">
      {/* Same hero gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-santander-600 via-[#8B0000] to-[#1A0005] dark:from-[#1A0005] dark:via-santander-900 dark:to-[#660000]" />

      {/* Noise grain */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ANIM 2 — Floating Glow */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-santander-500/20 blur-[120px] pointer-events-none"
        style={{ top: '50%', left: '50%', translateX: '-50%', translateY: '-50%' }}
        animate={{ x: [0, -30, 20, 0], y: [0, 30, -20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ANIM 1 — Stagger Blur Reveal */}
      <motion.div
        className="relative z-10 max-w-3xl mx-auto px-6 text-center"
        variants={container}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        <motion.h2 variants={child} className="font-headline text-3xl md:text-5xl text-white font-bold leading-tight">
          {t('landing.finalCta.title')}
        </motion.h2>

        <motion.p variants={child} className="font-text text-lg text-white/70 max-w-xl mx-auto mt-4">
          {t('landing.finalCta.subtitle')}
        </motion.p>

        <motion.div variants={child} className="mt-8 flex flex-col items-center gap-4">
          {/* ANIM 9 — Magnetic CTA principal */}
          <MagneticButton
            href="/register"
            className="inline-block bg-white text-santander-500 font-text font-bold px-8 py-4 rounded-full hover:bg-gray-100 shadow-lg transition-all duration-300 cursor-pointer"
          >
            {t('landing.finalCta.cta')} →
          </MagneticButton>

          <a
            href="/login"
            className="text-white/60 text-sm font-text hover:text-white/80 transition-colors"
          >
            {t('landing.finalCta.login')}
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
