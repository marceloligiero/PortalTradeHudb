import { useState, useEffect, useRef } from 'react';
import { useInView } from '../../hooks/useInView';
import { useCountUp } from '../../hooks/useCountUp';

const METRICS = [
  {
    prefix: '↓',
    value: 60,
    suffix: '%',
    label: 'Erros Repetidos',
    description: 'Planos de acção estruturados quebram ciclos de erro recorrentes',
  },
  {
    prefix: '',
    value: 100,
    suffix: '%',
    label: 'Rastreável',
    description: 'Cada erro registado, cada acção documentada, cada resultado medido',
  },
  {
    prefix: '',
    value: 4,
    suffix: '×',
    label: 'Mais Rápido',
    description: 'Onboarding com plano de treino formal em vez de aprender fazendo',
  },
  {
    prefix: '',
    value: 5,
    suffix: '',
    label: 'Portais Integrados',
    description: 'Formação, tutoria, relatórios, chamados e gestão num só lugar',
  },
];

function MetricCard({ metric, started }: { metric: typeof METRICS[0]; started: boolean }) {
  const count = useCountUp(metric.value, 1500, started);
  return (
    <div
      className="bg-white rounded-xl p-8"
      style={{ border: '1px solid #E5E7EB' }}
    >
      <div
        className="font-headline font-bold leading-none mb-3"
        style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: '#EC0000' }}
      >
        {metric.prefix}{count}{metric.suffix}
      </div>
      <div className="font-body text-xs font-bold uppercase tracking-widest text-[#111827] mb-2">
        {metric.label}
      </div>
      <div className="font-body text-xs text-[#6B7280] leading-relaxed">
        {metric.description}
      </div>
    </div>
  );
}

export default function MetricsSection() {
  const { ref: inViewRef, isInView } = useInView();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="resultados"
      ref={(el) => {
        (sectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
        (inViewRef as React.MutableRefObject<HTMLElement | null>).current = el;
      }}
      className="bg-[#F8F9FB]"
      style={{ padding: '100px 24px' }}
    >
      <div className="max-w-6xl mx-auto">
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <span
            className="font-body text-xs font-bold uppercase tracking-widest"
            style={{ color: '#EC0000' }}
          >
            Resultados
          </span>
          <h2
            className="font-headline font-bold text-[#111827] leading-[1.15] mt-3 mb-12"
            style={{ fontSize: 'clamp(1.875rem, 4vw, 2.75rem)', maxWidth: '700px' }}
          >
            Por que equipas de processamento escolhem o TradeDataHub
          </h2>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.6s ease 0.2s',
          }}
        >
          {METRICS.map((metric) => (
            <MetricCard key={metric.label} metric={metric} started={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}
