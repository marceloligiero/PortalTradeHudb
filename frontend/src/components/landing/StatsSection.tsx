import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useInView } from '../../hooks/useInView';
import { useCountUp } from '../../hooks/useCountUp';

gsap.registerPlugin(ScrollTrigger);

const STAT_DEFS = [
  { prefix: '−', value: 60, suffix: '%', labelKey: 'errorsLabel', descKey: 'errorsDesc' },
  { prefix: '−', value: 45, suffix: '%', labelKey: 'incidentsLabel', descKey: 'incidentsDesc' },
  { prefix: '',  value: 100, suffix: '%', labelKey: 'traceLabel', descKey: 'traceDesc' },
];

function StatItem({ statDef, started, isLast }: {
  statDef: typeof STAT_DEFS[0]; started: boolean; isLast: boolean;
}) {
  const { t } = useTranslation();
  const count = useCountUp(statDef.value, 2000, started);
  return (
    <div className="flex items-stretch">
      <div className="flex-1 px-4 text-center md:text-left">
        <div
          className="font-headline font-bold text-white leading-[1.0] mb-4"
          style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
        >
          {statDef.prefix}{count}{statDef.suffix}
        </div>
        <div className="font-body text-xs font-bold uppercase tracking-[0.15em] text-white/50 mb-2">
          {t(`landing.stats.${statDef.labelKey}`)}
        </div>
        <div className="font-body text-xs text-[#444] leading-relaxed max-w-[220px]">
          {t(`landing.stats.${statDef.descKey}`)}
        </div>
      </div>
      {!isLast && (
        <div className="hidden md:block w-px bg-white/[0.06] shrink-0 self-stretch mx-6" />
      )}
    </div>
  );
}

export default function StatsSection() {
  const { t } = useTranslation();
  const { ref: inViewRef, isInView } = useInView();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(sectionRef.current, { opacity: 1, y: 0 });
        return;
      }
      gsap.from(sectionRef.current, {
        y: 60, opacity: 0, duration: 1, ease: 'power3.out',
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
      className="bg-black px-6"
      style={{ paddingTop: '160px', paddingBottom: '160px' }}
    >
      <div className="max-w-6xl mx-auto">
        <h2
          className="font-headline font-bold text-white text-center leading-[1.0] mb-24"
          style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)' }}
        >
          {t('landing.stats.titleLine1')}
          <br />
          <span className="text-[#333]">{t('landing.stats.titleLine2')}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-0">
          {STAT_DEFS.map((statDef, i) => (
            <StatItem
              key={statDef.labelKey}
              statDef={statDef}
              started={isInView}
              isLast={i === STAT_DEFS.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
