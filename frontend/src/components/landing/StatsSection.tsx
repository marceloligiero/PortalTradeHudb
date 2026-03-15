import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useInView } from '../../hooks/useInView';
import { useCountUp } from '../../hooks/useCountUp';

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  {
    prefix: '−',
    value: 60,
    suffix: '%',
    label: 'Erros Repetidos',
    description: 'Planos de acção estruturados quebram ciclos de erro recorrentes',
  },
  {
    prefix: '−',
    value: 45,
    suffix: '%',
    label: 'Incidências',
    description: 'Menos erros chegam ao cliente com formação contínua da equipa',
  },
  {
    prefix: '',
    value: 100,
    suffix: '%',
    label: 'Rastreabilidade',
    description: 'Cada erro registado, cada acção documentada, cada resultado medido',
  },
];

function StatItem({ stat, started, isLast }: {
  stat: typeof STATS[0]; started: boolean; isLast: boolean;
}) {
  const count = useCountUp(stat.value, 2000, started);
  return (
    <div className="flex items-stretch">
      <div className="flex-1 px-4 text-center md:text-left">
        <div
          className="font-headline font-bold text-white leading-[1.0] mb-4"
          style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
        >
          {stat.prefix}{count}{stat.suffix}
        </div>
        <div className="font-body text-xs font-bold uppercase tracking-[0.15em] text-white/50 mb-2">
          {stat.label}
        </div>
        <div className="font-body text-xs text-[#444] leading-relaxed max-w-[220px]">
          {stat.description}
        </div>
      </div>
      {!isLast && (
        <div className="hidden md:block w-px bg-white/[0.06] shrink-0 self-stretch mx-6" />
      )}
    </div>
  );
}

export default function StatsSection() {
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
          Opiniões são subjectivas.
          <br />
          <span className="text-[#333]">Resultados não.</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-0">
          {STATS.map((stat, i) => (
            <StatItem
              key={stat.label}
              stat={stat}
              started={isInView}
              isLast={i === STATS.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
