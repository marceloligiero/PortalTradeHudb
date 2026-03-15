import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useInView } from '../../hooks/useInView';
import { useCountUp } from '../../hooks/useCountUp';
import { TrendingDown, ShieldAlert, Zap, CheckCircle2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  {
    icon: TrendingDown,
    value: 60,
    suffix: '%',
    prefix: '−',
    label: 'Menos Erros Recorrentes',
    description: 'Redução de erros repetidos através de planos de acção estruturados',
  },
  {
    icon: ShieldAlert,
    value: 45,
    suffix: '%',
    prefix: '−',
    label: 'Menos Incidências',
    description: 'Menos erros chegam ao cliente quando a equipa é formada continuamente',
  },
  {
    icon: Zap,
    value: 2,
    suffix: '×',
    prefix: '',
    label: 'Onboarding Mais Rápido',
    description: 'Novos colaboradores produtivos mais depressa com planos de treino personalizados',
  },
  {
    icon: CheckCircle2,
    value: 100,
    suffix: '%',
    prefix: '',
    label: 'Rastreabilidade Total',
    description: 'Cada erro registado, cada acção documentada, cada resultado medido',
  },
];

function StatItem({
  stat,
  started,
  isLast,
}: {
  stat: typeof STATS[0];
  started: boolean;
  isLast: boolean;
}) {
  const count = useCountUp(stat.value, 1800, started);
  const Icon  = stat.icon;

  return (
    <div className="flex items-stretch">
      <div className="text-center flex-1 px-4">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-santander-300" />
          </div>
        </div>
        <div className="font-headline text-5xl md:text-6xl font-bold text-white mb-2">
          {stat.prefix}{count}{stat.suffix}
        </div>
        <div className="font-body text-sm font-bold uppercase tracking-widest text-white/80 mb-2">
          {stat.label}
        </div>
        <div className="font-body text-xs text-white/45 leading-relaxed max-w-[180px] mx-auto">
          {stat.description}
        </div>
      </div>
      {!isLast && (
        <div className="hidden md:block w-px bg-white/10 self-stretch mx-2 shrink-0" />
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
      className="bg-gradient-to-r from-gray-950 via-red-950/40 to-gray-950 py-24 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block font-body text-xs font-bold uppercase tracking-widest text-santander-400 mb-4">
            Impacto
          </span>
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-white mb-4">
            Números que importam.
          </h2>
          <p className="font-body text-lg text-white/50 max-w-xl mx-auto">
            Resultados medidos em operações reais de processamento de documentos.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
