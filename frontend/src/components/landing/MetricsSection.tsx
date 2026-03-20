import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  TrendingDown, FileWarning, Rocket, Eye, Database, Clock, ArrowRight,
  AlertTriangle, FileSpreadsheet, Zap, TrendingUp, ShieldCheck, RotateCcw, Brain,
} from 'lucide-react';
import { SectionWrapper, SectionLabel, SectionTitle, TiltCard, AnimatedCounter, useScrollReveal, reveal, revealScale } from './primitives';

const METRIC_DEFS = [
  { valueKey: 'metrics.errorsValue',    labelKey: 'metrics.errorsLabel',    descKey: 'metrics.errorsDesc',    icon: TrendingDown, accent: 'emerald' as const },
  { valueKey: 'metrics.incidentsValue', labelKey: 'metrics.incidentsLabel', descKey: 'metrics.incidentsDesc', icon: FileWarning, accent: 'emerald' as const },
  { valueKey: 'metrics.fasterValue',    labelKey: 'metrics.fasterLabel',    descKey: 'metrics.fasterDesc',    icon: Rocket, accent: 'blue' as const },
  { valueKey: 'metrics.traceValue',     labelKey: 'metrics.traceLabel',     descKey: 'metrics.traceDesc',     icon: Eye, accent: 'blue' as const },
  { valueKey: 'metrics.dataValue',      labelKey: 'metrics.dataLabel',      descKey: 'metrics.dataDesc',      icon: Database, accent: 'violet' as const },
  { valueKey: 'metrics.ownerValue',     labelKey: 'metrics.ownerLabel',     descKey: 'metrics.ownerDesc',     icon: Clock, accent: 'violet' as const },
];

const ACCENT_MAP = {
  emerald: { iconBg: 'bg-emerald-50 dark:bg-emerald-900/15', iconColor: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
  blue:    { iconBg: 'bg-blue-50 dark:bg-blue-900/15', iconColor: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  violet:  { iconBg: 'bg-violet-50 dark:bg-violet-900/15', iconColor: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' },
};

const TICKER_ITEMS = [
  { key: 'productivity', icon: TrendingUp,      symbol: 'PROD', value: '+45%',  up: true },
  { key: 'compliance',   icon: ShieldCheck,      symbol: 'CMPL', value: '99.4%', up: true },
  { key: 'rework',       icon: RotateCcw,        symbol: 'RWRK', value: '-91%',  up: false },
  { key: 'retention',    icon: Brain,            symbol: 'KNOW', value: '+3x',   up: true },
  { key: 'onboarding',   icon: Clock,            symbol: 'ONBD', value: '-74%',  up: false },
  { key: 'errors',       icon: AlertTriangle,    symbol: 'ERRS', value: '-82%',  up: false },
  { key: 'reports',      icon: FileSpreadsheet,  symbol: 'RPTS', value: '-95%',  up: false },
  { key: 'resolution',   icon: Zap,              symbol: 'RSLV', value: '-68%',  up: false },
] as const;

export default function MetricsSection() {
  const { t } = useTranslation();
  const { ref, visible } = useScrollReveal(0.08);

  const tickerData = TICKER_ITEMS.map(item => ({
    ...item,
    label: t(`landing.ticker.${item.key}`),
  }));

  return (
    <SectionWrapper id="resultados">
      <div ref={ref as React.RefObject<HTMLDivElement>}>
        {/* Section header — centered */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <SectionLabel text={t('landing.metrics.label')} style={{ ...reveal(visible), justifyContent: 'center' }} />
          <SectionTitle bar={false} style={reveal(visible, 0.08)} maxWidth="600px">
            {t('landing.metrics.title')}
          </SectionTitle>
        </div>

        {/* Ticker marquee — stock-style scrolling KPI display */}
        <div
          className="rounded-2xl overflow-hidden mb-14"
          style={reveal(visible, 0.12)}
        >
          {/* Ticker header bar */}
          <div className="flex items-center gap-2 px-4 py-2" style={{ background: '#0C0C0F' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">KPIs</span>
            <div className="flex-1" />
            <span className="font-mono text-[9px] text-white/20">TradeDataHub</span>
          </div>
          {/* Marquee track */}
          <div className="relative overflow-hidden bg-[#0F0F12]">
            {/* Fade edges */}
            <div className="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #0F0F12, transparent)' }} />
            <div className="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #0F0F12, transparent)' }} />
            {/* Scrolling items */}
            <div className="flex animate-marquee whitespace-nowrap py-3" style={{ width: 'max-content' }}>
              {[...tickerData, ...tickerData, ...tickerData].map((item, i) => {
                const Icon = item.icon;
                return (
                  <span key={i} className="inline-flex items-center gap-2 shrink-0 px-5">
                    <Icon className="w-3 h-3 text-[#22C55E]" />
                    <span className="font-mono text-[10px] font-bold tracking-widest text-[#22C55E]">{item.symbol}</span>
                    <span className="font-body text-[11px] text-white/50">{item.label}</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="text-[8px] text-[#22C55E]">{item.up ? '\u25B2' : '\u25BC'}</span>
                      <span className="font-mono text-[12px] font-bold text-white">{item.value}</span>
                    </span>
                    <span className="ml-3 text-[10px] text-white/10 font-mono">|</span>
                  </span>
                );
              })}
            </div>
          </div>
          {/* Bottom line */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent)' }} />
        </div>

        {/* Metrics grid — 3 columns on desktop, 2 on tablet, 1 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {METRIC_DEFS.map((m, i) => {
            const Icon = m.icon;
            const a = ACCENT_MAP[m.accent];
            const value = t(`landing.${m.valueKey}`);

            return (
              <div key={m.labelKey} style={{ perspective: '800px', ...revealScale(visible, 0.2 + i * 0.18) }}>
                <TiltCard
                  className="group rounded-2xl p-6 bg-white dark:bg-[#131316] border border-gray-100 dark:border-white/[0.06] shadow-sm hover:shadow-xl dark:hover:shadow-black/30 transition-shadow duration-300 h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${a.iconBg} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`w-5 h-5 ${a.iconColor}`} />
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-mono text-xs font-bold ${a.badge}`}>
                      {value}
                    </span>
                  </div>
                  <h3 className="font-body font-semibold text-gray-900 dark:text-white text-sm mb-2 leading-snug">
                    {t(`landing.${m.labelKey}`)}
                  </h3>
                  <p className="font-body text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {t(`landing.${m.descKey}`)}
                  </p>
                </TiltCard>
              </div>
            );
          })}
        </div>

        {/* Closing CTA */}
        <div className="mt-14 text-center" style={reveal(visible, 0.7)}>
          <p className="font-body text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-lg mx-auto">
            {t('landing.metrics.closing')}
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-body font-bold text-sm text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-red-600/20"
            style={{ background: 'linear-gradient(135deg, #EC0000, #CC0000)' }}
          >
            {t('landing.finalCta.cta')}
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </SectionWrapper>
  );
}
