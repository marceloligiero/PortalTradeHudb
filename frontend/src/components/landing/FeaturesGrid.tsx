import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useMotionValue } from 'framer-motion';
import { BookOpen, Users, BarChart3, LifeBuoy, Settings } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '../../lib/cn';

gsap.registerPlugin(ScrollTrigger);

// Cores corrigidas: apenas paleta Santander (vermelho, cinza, sky — sem azul/laranja/violeta)
const FEATURES = [
  {
    key: 'courses',
    icon: BookOpen,
    colSpan: 'md:col-span-2 md:row-span-2',
    gradient: 'bg-gradient-to-br from-santander-50 to-white dark:from-red-950/30 dark:to-gray-900',
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
    gradient: 'bg-gradient-to-br from-santander-50/60 to-white dark:from-red-950/20 dark:to-gray-900',
  },
  {
    key: 'tickets',
    icon: LifeBuoy,
    colSpan: '',
    // sky é a terceira cor Santander (#DEEDF2)
    gradient: 'bg-gradient-to-br from-[#DEEDF2]/60 to-white dark:from-gray-800/40 dark:to-gray-950',
  },
  {
    key: 'masterdata',
    icon: Settings,
    colSpan: '',
    gradient: 'bg-gradient-to-br from-gray-100 to-white dark:from-gray-800/60 dark:to-gray-950',
    badge: 'ADMIN',
  },
];

// ANIM 10 — Glow Card
function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef    = useRef<HTMLDivElement>(null);
  const glowX      = useMotionValue(0);
  const glowY      = useMotionValue(0);
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

export default function FeaturesGrid() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef   = useRef<HTMLHeadingElement>(null);
  const bentoRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set([titleRef.current, '.bento-card'], { opacity: 1, y: 0, scale: 1 });
        return;
      }

      // ANIM 4 — título
      gsap.from(titleRef.current, {
        y: 80, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: titleRef.current, start: 'top 85%' },
      });

      // ANIM 6 — Bento Grid Stagger
      gsap.from('.bento-card', {
        y: 40, opacity: 0, scale: 0.95, duration: 0.7,
        stagger: { each: 0.15, from: 'start' },
        ease: 'power2.out',
        scrollTrigger: { trigger: bentoRef.current, start: 'top 80%' },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-white dark:bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6">
        <h2
          ref={titleRef}
          className="font-headline text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-16"
        >
          {t('landing.features.title')}
        </h2>

        <div ref={bentoRef} className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <GlowCard
                key={feat.key}
                className={cn(
                  'bento-card rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:border-santander-500/30 transition-colors duration-300 cursor-default',
                  feat.gradient,
                  feat.colSpan
                )}
              >
                <Icon className="w-8 h-8 text-santander-500 mb-4" />
                <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {t(`landing.features.${feat.key}.title`)}
                </h3>
                <p className="font-text text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t(`landing.features.${feat.key}.description`)}
                </p>
                {feat.badge && (
                  <span className="inline-block mt-3 bg-red-50 dark:bg-red-900/30 text-santander-500 text-xs rounded-full px-2 py-0.5 font-mono">
                    {feat.badge}
                  </span>
                )}
              </GlowCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
