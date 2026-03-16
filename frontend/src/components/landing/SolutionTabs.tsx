import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, ShieldAlert, BarChart3, Headphones } from 'lucide-react';
import { getLandingImage } from '../../utils/landingImages';
import ImagePlaceholder from '../ImagePlaceholder';

const TAB_DEFS = [
  {
    key: 'formacoes',
    tabKey: 'tabTraining',
    titleKey: 'trainingTitle',
    descKey: 'trainingDesc',
    altKey: 'trainingAlt',
    icon: GraduationCap,
    imageFile: 'tab-formacoes.jpg',
  },
  {
    key: 'tutoria',
    tabKey: 'tabTutoring',
    titleKey: 'tutoringTitle',
    descKey: 'tutoringDesc',
    altKey: 'tutoringAlt',
    icon: ShieldAlert,
    imageFile: 'tab-tutoria.jpg',
  },
  {
    key: 'relatorios',
    tabKey: 'tabReports',
    titleKey: 'reportsTitle',
    descKey: 'reportsDesc',
    altKey: 'reportsAlt',
    icon: BarChart3,
    imageFile: 'tab-relatorios.jpg',
  },
  {
    key: 'chamados',
    tabKey: 'tabTickets',
    titleKey: 'ticketsTitle',
    descKey: 'ticketsDesc',
    altKey: 'ticketsAlt',
    icon: Headphones,
    imageFile: 'tab-chamados.jpg',
  },
];

export default function SolutionTabs() {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
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

  const tabDef = TAB_DEFS[active];
  const tabImageSrc = getLandingImage(tabDef.imageFile);

  const reveal: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease',
  };

  return (
    <section
      id="funcionalidades"
      ref={sectionRef}
      className="bg-[#F8F9FB]"
      style={{ padding: '100px 24px' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div style={reveal}>
          <span className="font-body text-xs font-bold uppercase tracking-widest" style={{ color: '#EC0000' }}>
            {t('landing.solution.label')}
          </span>
          <h2
            className="font-headline font-bold text-[#111827] leading-[1.15] mt-3 mb-3"
            style={{ fontSize: 'clamp(1.875rem, 4vw, 2.75rem)', maxWidth: '700px' }}
          >
            {t('landing.solution.title')}
          </h2>
          <p
            className="font-body text-[#6B7280] mb-10"
            style={{ fontSize: '1rem', maxWidth: '580px' }}
          >
            {t('landing.solution.subtitle')}
          </p>
        </div>

        {/* Tab bar */}
        <div
          className="flex items-center overflow-x-auto mb-10"
          style={{
            ...reveal,
            transition: 'opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          {TAB_DEFS.map((td, i) => {
            const Icon = td.icon;
            const isActive = active === i;
            return (
              <button
                key={td.key}
                onClick={() => setActive(i)}
                className="flex items-center gap-2 px-5 py-3 font-body text-sm font-medium whitespace-nowrap transition-colors duration-200"
                style={{
                  color: isActive ? '#EC0000' : '#6B7280',
                  borderBottom: isActive ? '2px solid #EC0000' : '2px solid transparent',
                  marginBottom: '-1px',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {t(`landing.solution.${td.tabKey}`)}
              </button>
            );
          })}
        </div>

        {/* Tab content — key forces remount → CSS animation fires */}
        <div
          key={active}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          style={{ animation: 'fadeIn 0.3s ease' }}
        >
          {/* Text */}
          <div>
            <h3
              className="font-headline font-bold text-[#111827] mb-4"
              style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.875rem)' }}
            >
              {t(`landing.solution.${tabDef.titleKey}`)}
            </h3>
            <p className="font-body text-[#6B7280] leading-relaxed mb-6" style={{ fontSize: '1rem' }}>
              {t(`landing.solution.${tabDef.descKey}`)}
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-1 font-body text-sm font-semibold transition-colors duration-200"
              style={{ color: '#EC0000' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              {t('landing.solution.explore')} {t(`landing.solution.${tabDef.tabKey}`)} →
            </a>
          </div>

          {/* Image */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB' }}
          >
            {tabImageSrc ? (
              <img
                src={tabImageSrc}
                alt={t(`landing.solution.${tabDef.altKey}`)}
                loading="lazy"
                className="w-full object-cover"
                style={{ aspectRatio: '4/3', borderRadius: '12px' }}
              />
            ) : (
              <ImagePlaceholder
                alt={t(`landing.solution.${tabDef.altKey}`)}
                aspectRatio="4/3"
                className="rounded-xl"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
