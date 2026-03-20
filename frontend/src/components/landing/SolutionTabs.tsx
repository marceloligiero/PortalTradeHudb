import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldAlert, BarChart3, Headphones, ArrowRight } from 'lucide-react';
import { getLandingImage } from '../../utils/landingImages';
import ImagePlaceholder from '../ImagePlaceholder';
import { SectionWrapper, SectionLabel, SectionTitle, TiltCard, useScrollReveal, reveal, revealSlide, revealScale } from './primitives';

const TAB_DEFS = [
  { key: 'formacoes', tabKey: 'tabTraining', titleKey: 'trainingTitle', descKey: 'trainingDesc', altKey: 'trainingAlt', icon: GraduationCap, imageFile: 'tab-formacoes.jpg' },
  { key: 'tutoria',   tabKey: 'tabTutoring', titleKey: 'tutoringTitle', descKey: 'tutoringDesc', altKey: 'tutoringAlt', icon: ShieldAlert, imageFile: 'tab-tutoria.jpg' },
  { key: 'relatorios', tabKey: 'tabReports', titleKey: 'reportsTitle', descKey: 'reportsDesc', altKey: 'reportsAlt', icon: BarChart3, imageFile: 'tab-relatorios.jpg' },
  { key: 'chamados',  tabKey: 'tabTickets', titleKey: 'ticketsTitle', descKey: 'ticketsDesc', altKey: 'ticketsAlt', icon: Headphones, imageFile: 'tab-chamados.jpg' },
];

export default function SolutionTabs() {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const { ref, visible } = useScrollReveal(0.06);
  const textRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const switchTab = useCallback((idx: number) => {
    if (idx === active || animating) return;
    setAnimating(true);
    if (textRef.current) { textRef.current.style.opacity = '0'; textRef.current.style.transform = 'translateX(-20px)'; }
    if (imgRef.current) { imgRef.current.style.opacity = '0'; imgRef.current.style.transform = 'scale(0.96)'; }
    setTimeout(() => {
      setActive(idx);
      requestAnimationFrame(() => {
        if (textRef.current) { textRef.current.style.transform = 'translateX(20px)'; textRef.current.style.opacity = '0'; requestAnimationFrame(() => { if (textRef.current) { textRef.current.style.opacity = '1'; textRef.current.style.transform = 'translateX(0)'; } }); }
        if (imgRef.current) { imgRef.current.style.transform = 'scale(0.96)'; imgRef.current.style.opacity = '0'; requestAnimationFrame(() => { if (imgRef.current) { imgRef.current.style.opacity = '1'; imgRef.current.style.transform = 'scale(1)'; } }); }
        setTimeout(() => setAnimating(false), 450);
      });
    }, 250);
  }, [active, animating]);

  const tabDef = TAB_DEFS[active];
  const tabImageSrc = getLandingImage(tabDef.imageFile);
  const contentTransition = 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)';

  return (
    <SectionWrapper id="funcionalidades" bg="alt">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-[0.035] dark:opacity-[0.05]" style={{ background: 'radial-gradient(circle, #EC0000, transparent 70%)' }} />
      </div>

      <div ref={ref as React.RefObject<HTMLDivElement>}>
        <SectionLabel text={t('landing.solution.label')} style={revealSlide(visible, 'left')} />
        <SectionTitle style={revealSlide(visible, 'left', 0.08)}>{t('landing.solution.title')}</SectionTitle>
        <p className="font-body text-gray-500 dark:text-gray-400 mb-12 text-[15px] max-w-xl" style={revealSlide(visible, 'left', 0.16)}>
          {t('landing.solution.subtitle')}
        </p>

        {/* Tab pills */}
        <div className="flex flex-wrap gap-2 mb-12" style={reveal(visible, 0.22)}>
          {TAB_DEFS.map((td, i) => {
            const Icon = td.icon;
            const isActive = active === i;
            return (
              <button
                key={td.key}
                onClick={() => switchTab(i)}
                className={`group flex items-center gap-2 px-5 py-3 rounded-xl font-body text-sm font-medium cursor-pointer border transition-all duration-300 ${
                  isActive
                    ? 'text-white border-transparent shadow-lg shadow-red-600/20'
                    : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md'
                }`}
                style={isActive ? { background: 'linear-gradient(135deg, #EC0000, #CC0000)' } : {}}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                {t(`landing.solution.${td.tabKey}`)}
              </button>
            );
          })}
        </div>

        {/* Tab content — asymmetric grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16 items-center" style={revealScale(visible, 0.3)}>
          {/* Text side */}
          <div ref={textRef} className="order-2 lg:order-1" style={{ transition: contentTransition }}>
            <span className="font-mono text-[11px] font-bold text-gray-300 dark:text-gray-600 tracking-widest mb-3 block">
              {String(active + 1).padStart(2, '0')} / {String(TAB_DEFS.length).padStart(2, '0')}
            </span>
            <h3 className="font-headline font-bold text-gray-900 dark:text-white mb-5 leading-snug" style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.875rem)' }}>
              {t(`landing.solution.${tabDef.titleKey}`)}
            </h3>
            <p className="font-body text-gray-500 dark:text-gray-400 leading-relaxed mb-8 text-[15px]">
              {t(`landing.solution.${tabDef.descKey}`)}
            </p>
            <Link to="/login" className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-semibold text-[#EC0000] bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 transition-all duration-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800/30">
              {t('landing.solution.explore')} {t(`landing.solution.${tabDef.tabKey}`)}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Image side with 3D tilt */}
          <div style={{ perspective: '1200px' }}>
            <TiltCard className="order-1 lg:order-2 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.06] shadow-2xl shadow-black/[0.06] dark:shadow-black/40">
              <div ref={imgRef} className="relative group" style={{ transition: contentTransition }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" style={{ boxShadow: 'inset 0 0 80px rgba(236,0,0,0.08)' }} />
                {tabImageSrc ? (
                  <img src={tabImageSrc} alt={t(`landing.solution.${tabDef.altKey}`)} loading="lazy" className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" style={{ aspectRatio: '4/3' }} />
                ) : (
                  <ImagePlaceholder alt={t(`landing.solution.${tabDef.altKey}`)} aspectRatio="4/3" className="rounded-2xl" />
                )}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EC0000] animate-pulse" />
                  <span className="font-mono text-[10px] text-white/80 font-bold uppercase tracking-wider">{t(`landing.solution.${tabDef.tabKey}`)}</span>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
