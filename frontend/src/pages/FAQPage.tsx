import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';
import { ChevronDown } from 'lucide-react';

export default function FAQPage() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqKeys = [
    'whatIs', 'howToStart', 'roles', 'tutoring', 'reports',
    'security', 'support', 'mobile',
  ];

  return (
    <>
      <LandingNavbar />
      <main className="bg-white dark:bg-[#09090B] min-h-screen" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="max-w-3xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h1
              className="font-headline font-bold text-[#111827] dark:text-white mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
            >
              {t('pages.faq.title')}
            </h1>
            <p className="font-body text-lg text-[#6B7280] dark:text-gray-400">
              {t('pages.faq.subtitle')}
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-3 mb-16">
            {faqKeys.map((key, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={key}
                  className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left font-body font-semibold text-[#111827] dark:text-white transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    {t(`pages.faq.${key}Q`)}
                    <ChevronDown
                      className="w-5 h-5 text-[#6B7280] transition-transform duration-200 flex-shrink-0"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5">
                      <p className="font-body text-[#4B5563] dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {t(`pages.faq.${key}A`)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="font-body text-[#6B7280] dark:text-gray-400 mb-4">
              {t('pages.faq.stillQuestions')}
            </p>
            <Link
              to="/about#contacto"
              className="inline-flex items-center gap-2 font-body font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-200"
              style={{ background: '#EC0000', color: '#fff', padding: '12px 28px' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#CC0000')}
              onMouseLeave={e => (e.currentTarget.style.background = '#EC0000')}
            >
              {t('pages.faq.contactUs')}
            </Link>
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
