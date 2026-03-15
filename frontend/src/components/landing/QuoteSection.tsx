import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

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

// ANIM 1 — Blur Reveal (sem stagger, aplicado ao bloco todo)
const blurReveal = {
  hidden:  { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] } },
};

export default function QuoteSection() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="bg-santander-500 py-20 md:py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.p
          variants={blurReveal}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="font-headline text-3xl md:text-5xl text-white leading-tight"
        >
          {t('landing.quote.text')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <MagneticButton
            href="/register"
            className="inline-block border border-white/40 text-white hover:bg-white/10 px-6 py-3 rounded-full font-text font-bold transition-colors duration-300 cursor-pointer"
          >
            {t('landing.quote.cta')} →
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
