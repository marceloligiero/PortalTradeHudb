import { useTranslation } from 'react-i18next';
import { Inbox, UserX, SearchX, AlertOctagon } from 'lucide-react';
import { SectionWrapper, SectionLabel, SectionTitle, TiltCard, useScrollReveal, reveal, revealSlide, revealScale } from './primitives';

const FLOW_ICONS = [Inbox, UserX, SearchX, AlertOctagon];
const FLOW_KEYS = ['agency', 'recorder', 'verifier', 'client'] as const;

const STEP_ACCENTS = [
  { ring: 'ring-gray-200 dark:ring-white/10', iconBg: 'bg-gray-100 dark:bg-white/5',  iconColor: 'text-gray-500 dark:text-gray-400' },
  { ring: 'ring-amber-200 dark:ring-amber-800/30', iconBg: 'bg-amber-50 dark:bg-amber-900/10', iconColor: 'text-amber-600 dark:text-amber-400' },
  { ring: 'ring-red-200 dark:ring-red-800/30', iconBg: 'bg-red-50 dark:bg-red-900/15', iconColor: 'text-red-500 dark:text-red-400' },
  { ring: 'ring-red-400 dark:ring-red-700/50', iconBg: 'bg-red-100 dark:bg-red-900/25', iconColor: 'text-red-600 dark:text-red-400' },
];

export default function ProblemSection() {
  const { t } = useTranslation();
  const { ref, visible } = useScrollReveal(0.08);

  return (
    <SectionWrapper ref={ref as React.RefObject<HTMLElement>}>
      {/* ── Abstract depth background ──────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] rounded-full opacity-[0.04] dark:opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #EC0000 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[150px] -left-[150px] w-[400px] h-[400px] rounded-full opacity-[0.03] dark:opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #EC0000 0%, transparent 70%)' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        {/* ── LEFT: Text ──────────────────────────────────────── */}
        <div>
          <SectionLabel text={t('landing.problem.label')} style={revealSlide(visible, 'left')} />
          <SectionTitle style={revealSlide(visible, 'left', 0.08)}>{t('landing.problem.title')}</SectionTitle>
          <p className="font-body text-gray-600 dark:text-gray-400 leading-relaxed mb-5 text-[15px] max-w-lg" style={revealSlide(visible, 'left', 0.16)}>
            {t('landing.problem.p1')}
          </p>
          <p className="font-body text-gray-600 dark:text-gray-400 leading-relaxed text-[15px] max-w-lg" style={revealSlide(visible, 'left', 0.22)}>
            {t('landing.problem.p2')}
          </p>
        </div>

        {/* ── RIGHT: 3D Flow Diagram ─────────────────────────── */}
        <div style={revealScale(visible, 0.15)}>
          <TiltCard
            className="rounded-2xl p-6 sm:p-8 bg-[#F8F9FB] dark:bg-[#161618] border border-gray-200/80 dark:border-white/[0.06] shadow-xl shadow-black/[0.03] dark:shadow-black/20"
          >
            {/* Card header */}
            <div className="flex items-center gap-2 mb-7">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500 animate-pulse" />
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {t('landing.problem.flowLabel')}
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-0">
              {FLOW_KEYS.map((key, i, arr) => {
                const Icon = FLOW_ICONS[i];
                const s = STEP_ACCENTS[i];
                const isLast = i === arr.length - 1;
                const num = String(i + 1).padStart(2, '0');

                return (
                  <div key={key}>
                    <div
                      className={`group flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#0E0E10] ring-1 ${s.ring} transition-all duration-300 hover:ring-2 hover:shadow-md dark:hover:shadow-black/30`}
                      style={{
                        ...reveal(visible, 0.25 + i * 0.08),
                        ...(isLast ? { boxShadow: '0 0 30px rgba(236,0,0,0.08), inset 0 0 0 1px rgba(236,0,0,0.08)' } : {}),
                      }}
                    >
                      <span className="font-mono text-[11px] font-bold text-gray-300 dark:text-gray-600 shrink-0 w-5 hidden sm:block">{num}</span>
                      <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${isLast ? 'animate-pulse' : ''}`}>
                        <Icon className={`w-5 h-5 ${s.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`font-body font-semibold text-sm ${isLast ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                          {t(`landing.problem.${key}`)}
                        </div>
                        <div className="font-body text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {t(`landing.problem.${key}Subtitle`)}
                        </div>
                      </div>
                      {isLast && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 shrink-0">
                          <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-red-600 dark:text-red-400 text-[10px] font-mono font-bold uppercase">Fail</span>
                        </span>
                      )}
                    </div>

                    {i < arr.length - 1 && (
                      <div className="flex items-center pl-5 sm:pl-10 py-0.5">
                        <div className="w-px h-5" style={{ background: `linear-gradient(to bottom, rgba(236,0,0,${0.1 + i * 0.08}), rgba(236,0,0,${0.15 + i * 0.1}))` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TiltCard>
        </div>
      </div>
    </SectionWrapper>
  );
}
