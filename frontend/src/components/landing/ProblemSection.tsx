import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function ProblemSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          sectionRef.current?.querySelectorAll<HTMLElement>('.fade-up').forEach((el, i) => {
            setTimeout(() => {
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
            }, i * 120);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const fadeStyle: React.CSSProperties = {
    opacity: 0,
    transform: 'translateY(20px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease',
  };

  const flowRows = [
    { emoji: '🏦', title: t('landing.problem.agency'),   sub: t('landing.problem.agencySubtitle'),   borderColor: '#E5E7EB', titleColor: '#111827', darkTitleColor: 'text-[#111827] dark:text-white' },
    { emoji: '❌', title: t('landing.problem.recorder'),  sub: t('landing.problem.recorderSubtitle'), borderColor: '#FECACA', titleColor: '#DC2626', darkTitleColor: 'text-[#DC2626]' },
    { emoji: '❌', title: t('landing.problem.verifier'),  sub: t('landing.problem.verifierSubtitle'), borderColor: '#FECACA', titleColor: '#DC2626', darkTitleColor: 'text-[#DC2626]' },
    { emoji: '💥', title: t('landing.problem.client'),    sub: t('landing.problem.clientSubtitle'),   borderColor: '#DC2626', titleColor: '#DC2626', darkTitleColor: 'text-[#DC2626]' },
  ];

  return (
    <section ref={sectionRef} className="bg-white dark:bg-[#09090B]" style={{ padding: '100px 24px' }}>
      <div className="max-w-6xl mx-auto">
        <span className="fade-up font-body text-xs font-bold uppercase tracking-widest inline-block mb-4" style={{ ...fadeStyle, color: '#EC0000' }}>
          {t('landing.problem.label')}
        </span>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <h2
              className="fade-up font-headline font-bold text-[#111827] dark:text-white leading-[1.15] mb-6"
              style={{ ...fadeStyle, fontSize: 'clamp(1.875rem, 4vw, 2.75rem)' }}
            >
              {t('landing.problem.title')}
            </h2>
            <p
              className="fade-up font-body text-[#6B7280] dark:text-gray-400 leading-relaxed mb-5"
              style={{ ...fadeStyle, fontSize: '1rem' }}
            >
              {t('landing.problem.p1')}
            </p>
            <p
              className="fade-up font-body text-[#6B7280] dark:text-gray-400 leading-relaxed"
              style={{ ...fadeStyle, fontSize: '1rem' }}
            >
              {t('landing.problem.p2')}
            </p>
          </div>

          {/* Flow diagram */}
          <div
            className="fade-up rounded-2xl p-8 bg-[#F8F9FB] dark:bg-[#161618] border border-gray-200 dark:border-white/10"
            style={fadeStyle}
          >
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#9CA3AF] dark:text-gray-500 mb-6">
              {t('landing.problem.flowLabel')}
            </p>
            <div className="space-y-0">
              {flowRows.map((row, i, arr) => (
                <div key={row.title}>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-[#0A0A0A]"
                    style={{ border: `1px solid ${row.borderColor}` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#F3F4F6] dark:bg-[#1F1F21] flex items-center justify-center text-sm shrink-0">
                      {row.emoji}
                    </div>
                    <div>
                      <div className={`font-body font-semibold text-sm ${row.darkTitleColor}`}>
                        {row.title}
                      </div>
                      <div className="font-body text-xs text-[#9CA3AF] dark:text-gray-500">{row.sub}</div>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-px h-5 bg-[#E5E7EB] dark:bg-white/10 ml-7" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
