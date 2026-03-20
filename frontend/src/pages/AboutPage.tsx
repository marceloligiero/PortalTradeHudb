import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';
import { ShieldCheck, BarChart3, GraduationCap, Headphones } from 'lucide-react';

export default function AboutPage() {
  const { t } = useTranslation();

  const values = [
    { icon: GraduationCap, titleKey: 'valueTraining', descKey: 'valueTrainingDesc' },
    { icon: ShieldCheck, titleKey: 'valueQuality', descKey: 'valueQualityDesc' },
    { icon: BarChart3, titleKey: 'valueData', descKey: 'valueDataDesc' },
    { icon: Headphones, titleKey: 'valueSupport', descKey: 'valueSupportDesc' },
  ];

  return (
    <>
      <LandingNavbar />
      <main className="bg-white dark:bg-[#09090B] min-h-screen" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="max-w-4xl mx-auto px-6">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1
              className="font-headline font-bold text-[#111827] dark:text-white mb-6"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
            >
              {t('pages.about.title')}
            </h1>
            <p className="font-body text-lg text-[#6B7280] dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {t('pages.about.subtitle')}
            </p>
          </div>

          {/* Mission */}
          <section className="mb-16">
            <h2 className="font-headline font-bold text-[#111827] dark:text-white text-2xl mb-4">
              {t('pages.about.missionTitle')}
            </h2>
            <p className="font-body text-[#4B5563] dark:text-gray-300 leading-relaxed">
              {t('pages.about.missionContent')}
            </p>
          </section>

          {/* Values */}
          <section className="mb-16">
            <h2 className="font-headline font-bold text-[#111827] dark:text-white text-2xl mb-8">
              {t('pages.about.valuesTitle')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {values.map((v) => (
                <div
                  key={v.titleKey}
                  className="rounded-xl border border-gray-200 dark:border-white/10 p-6"
                >
                  <v.icon className="w-8 h-8 mb-4" style={{ color: '#EC0000' }} />
                  <h3 className="font-headline font-bold text-[#111827] dark:text-white mb-2">
                    {t(`pages.about.${v.titleKey}`)}
                  </h3>
                  <p className="font-body text-sm text-[#6B7280] dark:text-gray-400 leading-relaxed">
                    {t(`pages.about.${v.descKey}`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section id="contacto" className="mb-16">
            <h2 className="font-headline font-bold text-[#111827] dark:text-white text-2xl mb-4">
              {t('pages.about.contactTitle')}
            </h2>
            <p className="font-body text-[#4B5563] dark:text-gray-300 leading-relaxed mb-6">
              {t('pages.about.contactContent')}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 font-body font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-200"
              style={{ background: '#EC0000', color: '#fff', padding: '12px 28px' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#CC0000')}
              onMouseLeave={e => (e.currentTarget.style.background = '#EC0000')}
            >
              {t('pages.about.contactCta')}
            </Link>
          </section>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
