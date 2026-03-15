import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useMotionValue } from 'framer-motion';
import { GraduationCap, BarChart3, Rocket, ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PILLARS = [
  { icon: GraduationCap, key: 'train'    },
  { icon: BarChart3,     key: 'evaluate' },
  { icon: Rocket,        key: 'evolve'   },
];

// ANIM 10 — Glow Card: glow radial segue cursor
function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef   = useRef<HTMLDivElement>(null);
  const glowX     = useMotionValue(0);
  const glowY     = useMotionValue(0);
  const glowOpacity = useMotionValue(0);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    glowX.set(e.clientX - rect.left);
    glowY.set(e.clientY - rect.top);
    glowOpacity.set(1);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={() => glowOpacity.set(0)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Glow radial layer */}
      <motion.div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(400px circle at ${glowX}px ${glowY}px, rgba(236,0,0,0.08), transparent 60%)`,
          opacity: glowOpacity,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}

export default function PillarsSection() {
  const { t } = useTranslation();
  const sectionRef  = useRef<HTMLElement>(null);
  const titleRef    = useRef<HTMLDivElement>(null);
  const cardsRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set([titleRef.current, '.pillar-card'], { opacity: 1, y: 0 });
        return;
      }

      // ANIM 4 — Scroll Reveal no título
      gsap.from(titleRef.current, {
        y: 80, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: titleRef.current, start: 'top 85%' },
      });

      // ANIM 5 — Cards Stagger
      gsap.from('.pillar-card', {
        y: 60, opacity: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out',
        scrollTrigger: { trigger: cardsRef.current, start: 'top 75%' },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-gray-50 dark:bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={titleRef} className="text-center mb-16">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('landing.pillars.title')}
          </h2>
          <p className="font-text text-lg text-gray-500 dark:text-gray-400">
            {t('landing.pillars.subtitle')}
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <GlowCard
                key={pillar.key}
                className="pillar-card bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:border-santander-500/30 hover:shadow-xl hover:shadow-red-500/5 transition-colors duration-300 group cursor-default"
              >
                <div className="w-14 h-14 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-santander-500" />
                </div>
                <h3 className="font-headline text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {t(`landing.pillars.${pillar.key}.title`)}
                </h3>
                <p className="font-text text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-4">
                  {t(`landing.pillars.${pillar.key}.description`)}
                </p>
                <span className="inline-flex items-center gap-1 text-santander-500 font-text font-bold group-hover:gap-2 transition-all duration-300">
                  {t('landing.pillars.learnMore')}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </GlowCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
