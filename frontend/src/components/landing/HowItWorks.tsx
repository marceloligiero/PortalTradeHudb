import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Edit, ShieldCheck, BookOpen, TrendingUp, ArrowRight } from 'lucide-react';
import { SectionWrapper, SectionLabel, SectionTitle, TiltCard, useScrollReveal, reveal, revealSlide } from './primitives';

const STEP_DEFS = [
  { number: 1, icon: Edit,        titleKey: 'step1Title', descKey: 'step1Desc' },
  { number: 2, icon: ShieldCheck, titleKey: 'step2Title', descKey: 'step2Desc' },
  { number: 3, icon: BookOpen,    titleKey: 'step3Title', descKey: 'step3Desc' },
  { number: 4, icon: TrendingUp,  titleKey: 'step4Title', descKey: 'step4Desc' },
];

export default function HowItWorks() {
  const { t } = useTranslation();
  const { ref, visible } = useScrollReveal(0.08);

  return (
    <SectionWrapper id="como-funciona" bg="alt">
      <div ref={ref as React.RefObject<HTMLDivElement>} className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20">

        {/* ── Left — sticky header + CTAs ──────────────────── */}
        <div className="lg:sticky lg:top-24 self-start" style={revealSlide(visible, 'left')}>
          <SectionLabel text={t('landing.howItWorks.label')} />
          <SectionTitle>{t('landing.howItWorks.title')}</SectionTitle>
          <p className="font-body text-gray-500 dark:text-gray-400 mb-8 text-[15px] max-w-md">
            {t('landing.howItWorks.subtitle')}
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 font-body font-semibold text-sm px-6 py-3 rounded-xl text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-red-600/20"
              style={{ background: 'linear-gradient(135deg, #EC0000, #CC0000)' }}
            >
              {t('landing.navbar.register')}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="font-body font-semibold text-sm px-6 py-3 rounded-xl border border-gray-200 dark:border-white/15 text-gray-900 dark:text-white transition-all duration-300 hover:border-[#EC0000]/40 hover:text-[#EC0000] dark:hover:text-[#EC0000]"
            >
              {t('landing.navbar.login')}
            </Link>
          </div>
        </div>

        {/* ── Right — 3D stepper cards ────────────────────── */}
        <div className="flex flex-col gap-0">
          {STEP_DEFS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STEP_DEFS.length - 1;
            const num = String(step.number).padStart(2, '0');

            return (
              <div key={step.number} className="flex gap-5" style={revealSlide(visible, 'right', 0.15 + i * 0.2)}>
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-mono font-bold text-sm shrink-0 shadow-lg shadow-red-600/20"
                    style={{ background: 'linear-gradient(135deg, #EC0000, #CC0000)' }}
                  >
                    {num}
                  </div>
                  {!isLast && (
                    <div className="w-px grow" style={{ background: 'linear-gradient(to bottom, rgba(236,0,0,0.25), rgba(236,0,0,0.05))' }} />
                  )}
                </div>
                <div style={{ perspective: '800px', flex: 1 }}>
                  <TiltCard
                    className="rounded-xl p-5 mb-4 bg-white dark:bg-[#131316] border border-gray-100 dark:border-white/[0.06] transition-all duration-300 hover:shadow-lg dark:hover:shadow-black/30"
                    style={{ marginBottom: isLast ? 0 : '12px' }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/15 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#EC0000]" />
                      </div>
                      <h3 className="font-headline font-bold text-gray-900 dark:text-white text-base">
                        {t(`landing.howItWorks.${step.titleKey}`)}
                      </h3>
                    </div>
                    <p className="font-body text-gray-500 dark:text-gray-400 text-sm leading-relaxed pl-11">
                      {t(`landing.howItWorks.${step.descKey}`)}
                    </p>
                  </TiltCard>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
