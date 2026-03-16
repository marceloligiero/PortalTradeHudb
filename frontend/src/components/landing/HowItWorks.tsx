import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, ShieldCheck, BookOpen, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const STEP_DEFS = [
  { number: 1, icon: Edit,        titleKey: 'step1Title', descKey: 'step1Desc' },
  { number: 2, icon: ShieldCheck, titleKey: 'step2Title', descKey: 'step2Desc' },
  { number: 3, icon: BookOpen,    titleKey: 'step3Title', descKey: 'step3Desc' },
  { number: 4, icon: TrendingUp,  titleKey: 'step4Title', descKey: 'step4Desc' },
];

export default function HowItWorks() {
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

  const reveal: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease',
  };

  return (
    <section
      id="como-funciona"
      ref={sectionRef}
      className="bg-white dark:bg-[#09090B]"
      style={{ padding: '100px 24px' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16" style={reveal}>
          {/* Left — sticky header + CTAs */}
          <div className="lg:sticky lg:top-24 self-start">
            <span
              className="font-body text-xs font-bold uppercase tracking-widest"
              style={{ color: '#EC0000' }}
            >
              {t('landing.howItWorks.label')}
            </span>
            <h2
              className="font-headline font-bold text-[#111827] dark:text-white leading-[1.15] mt-3 mb-4"
              style={{ fontSize: 'clamp(1.875rem, 4vw, 2.75rem)' }}
            >
              {t('landing.howItWorks.title')}
            </h2>
            <p className="font-body text-[#6B7280] dark:text-gray-400 mb-8" style={{ fontSize: '1rem' }}>
              {t('landing.howItWorks.subtitle')}
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="font-body font-semibold text-sm px-5 py-2.5 rounded-lg text-white transition-colors duration-200"
                style={{ background: '#EC0000' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#B80000')}
                onMouseLeave={e => (e.currentTarget.style.background = '#EC0000')}
              >
                {t('landing.howItWorks.cta')}
              </Link>
              <a
                href="#funcionalidades"
                className="font-body font-semibold text-sm px-5 py-2.5 rounded-lg border border-gray-200 dark:border-white/20 text-[#111827] dark:text-white transition-colors duration-200 hover:text-[#EC0000] dark:hover:text-[#EC0000]"
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#EC0000')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
              >
                {t('landing.howItWorks.ctaSecondary')}
              </a>
            </div>
          </div>

          {/* Right — stepper */}
          <div>
            {STEP_DEFS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex gap-5">
                  {/* Connector */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-headline font-bold text-sm shrink-0"
                      style={{ background: '#EC0000' }}
                    >
                      {step.number}
                    </div>
                    {i < STEP_DEFS.length - 1 && (
                      <div className="w-px grow mt-2 mb-2 bg-gray-200 dark:bg-white/10" />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ paddingBottom: i < STEP_DEFS.length - 1 ? '32px' : 0 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 shrink-0" style={{ color: '#EC0000' }} />
                      <h3 className="font-headline font-bold text-[#111827] dark:text-white text-base">
                        {t(`landing.howItWorks.${step.titleKey}`)}
                      </h3>
                    </div>
                    <p className="font-body text-[#6B7280] dark:text-gray-400 text-sm leading-relaxed">
                      {t(`landing.howItWorks.${step.descKey}`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
