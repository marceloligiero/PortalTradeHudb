import { useTranslation } from 'react-i18next';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';

export default function TermsPage() {
  const { t } = useTranslation();

  const sections = [
    { titleKey: 'acceptance', contentKey: 'acceptanceContent' },
    { titleKey: 'services', contentKey: 'servicesContent' },
    { titleKey: 'accounts', contentKey: 'accountsContent' },
    { titleKey: 'intellectualProperty', contentKey: 'intellectualPropertyContent' },
    { titleKey: 'liability', contentKey: 'liabilityContent' },
    { titleKey: 'modifications', contentKey: 'modificationsContent' },
    { titleKey: 'governing', contentKey: 'governingContent' },
  ];

  return (
    <>
      <LandingNavbar />
      <main className="bg-white dark:bg-[#09090B] min-h-screen" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="max-w-3xl mx-auto px-6">
          <h1
            className="font-headline font-bold text-[#111827] dark:text-white mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            {t('pages.terms.title')}
          </h1>
          <p className="font-body text-sm text-[#6B7280] dark:text-gray-400 mb-12">
            {t('pages.terms.lastUpdated')}
          </p>

          <div className="space-y-10">
            {sections.map((s, i) => (
              <section key={s.titleKey}>
                <h2 className="font-headline font-bold text-[#111827] dark:text-white text-xl mb-3">
                  {i + 1}. {t(`pages.terms.${s.titleKey}`)}
                </h2>
                <p className="font-body text-[#4B5563] dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {t(`pages.terms.${s.contentKey}`)}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
