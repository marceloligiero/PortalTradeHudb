import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useInView } from '../../hooks/useInView';
import { useCountUp } from '../../hooks/useCountUp';

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { value: 5,   key: 'portals'   },
  { value: 341, key: 'tests'     },
  { value: 5,   key: 'roles'     },
  { value: 3,   key: 'languages' },
];

function StatItem({ value, labelKey, started, isLast }: {
  value: number; labelKey: string; started: boolean; isLast: boolean;
}) {
  const { t } = useTranslation();
  const count = useCountUp(value, 1500, started);

  return (
    <div className="flex items-center">
      <div className="text-center flex-1">
        {/* ANIM 7 já implementado via useCountUp ✅ — font-mono correcto (skill 09) */}
        <div className="font-mono text-5xl md:text-6xl font-bold text-white">
          {count}
        </div>
        <div className="font-text text-sm uppercase tracking-widest text-white/50 mt-2">
          {t(`landing.stats.${labelKey}`)}
        </div>
      </div>
      {!isLast && (
        <div className="hidden md:block w-px h-16 bg-white/10 mx-4" />
      )}
    </div>
  );
}

export default function StatsSection() {
  const { ref: inViewRef, isInView } = useInView();
  const sectionRef = useRef<HTMLElement>(null);

  // ANIM 4 — Scroll Reveal no container
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(sectionRef.current, { opacity: 1, y: 0 });
        return;
      }
      gsap.from(sectionRef.current, {
        y: 80, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={(el) => {
        (sectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
        (inViewRef as React.MutableRefObject<HTMLElement | null>).current = el;
      }}
      className="bg-gradient-to-r from-gray-950 via-red-950/40 to-gray-950 py-20"
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <StatItem
              key={stat.key}
              value={stat.value}
              labelKey={stat.key}
              started={isInView}
              isLast={i === STATS.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
