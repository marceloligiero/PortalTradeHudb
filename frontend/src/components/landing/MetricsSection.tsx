import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const METRIC_DEFS = [
  { valueKey: 'metrics.errorsValue',    labelKey: 'metrics.errorsLabel',    descKey: 'metrics.errorsDesc' },
  { valueKey: 'metrics.incidentsValue', labelKey: 'metrics.incidentsLabel', descKey: 'metrics.incidentsDesc' },
  { valueKey: 'metrics.fasterValue',    labelKey: 'metrics.fasterLabel',    descKey: 'metrics.fasterDesc' },
  { valueKey: 'metrics.traceValue',     labelKey: 'metrics.traceLabel',     descKey: 'metrics.traceDesc' },
  { valueKey: 'metrics.dataValue',      labelKey: 'metrics.dataLabel',      descKey: 'metrics.dataDesc' },
  { valueKey: 'metrics.ownerValue',     labelKey: 'metrics.ownerLabel',     descKey: 'metrics.ownerDesc' },
];

function MetricCard({
  metricDef,
  visible,
  delay,
}: {
  metricDef: typeof METRIC_DEFS[0];
  visible: boolean;
  delay: number;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="bg-white dark:bg-[#161618] border border-gray-200 dark:border-white/10 rounded-2xl p-8
        hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, box-shadow 0.3s ease, translate 0.3s ease`,
      }}
    >
      <div
        className="font-headline font-bold leading-none mb-3"
        style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#EC0000' }}
      >
        {t(`landing.${metricDef.valueKey}`)}
      </div>
      <div className="font-body text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
        {t(`landing.${metricDef.labelKey}`)}
      </div>
      <p className="font-body text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {t(`landing.${metricDef.descKey}`)}
      </p>
    </div>
  );
}

export default function MetricsSection() {
  const { t } = useTranslation();
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
      ref={sectionRef}
      className="bg-gray-50 dark:bg-[#111113]"
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
            {t('landing.metrics.label')}
          </span>
          <h2
            className="font-headline font-bold text-[#111827] dark:text-white leading-[1.15] mt-3 mb-12"
            style={{ fontSize: 'clamp(1.875rem, 4vw, 2.75rem)', maxWidth: '700px' }}
          >
            {t('landing.metrics.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {METRIC_DEFS.map((metricDef, i) => (
            <MetricCard
              key={metricDef.labelKey}
              metricDef={metricDef}
              visible={visible}
              delay={i * 80}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
