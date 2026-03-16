import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function LandingFooter() {
  const { t } = useTranslation();

  const COLUMNS = [
    {
      titleKey: 'platform',
      items: [
        { key: 'training' },
        { key: 'tutoring' },
        { key: 'reports' },
        { key: 'tickets' },
        { key: 'masterData' },
      ],
    },
    {
      titleKey: 'about',
      items: [
        { key: 'aboutUs' },
        { key: 'contact' },
        { key: 'careers' },
      ],
    },
    {
      titleKey: 'resources',
      items: [
        { key: 'blog' },
        { key: 'apiDocs' },
        { key: 'news' },
      ],
    },
    {
      titleKey: 'support',
      items: [
        { key: 'helpCenter' },
        { key: 'faq' },
        { key: 'systemStatus' },
      ],
    },
  ];

  return (
    <footer className="bg-[#0F172A] dark:bg-[#050505]" style={{ padding: '60px 24px 40px' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand — spans 1 col on md */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo-sds.png" alt="TradeDataHub" className="h-7 w-auto mb-3" />
            </div>
            <p
              className="font-body text-xs leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '200px' }}
            >
              {t('landing.footer.tagline')}
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.titleKey}>
              <h4
                className="font-body text-xs font-bold uppercase mb-4"
                style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.12em' }}
              >
                {t(`landing.footer.${col.titleKey}`)}
              </h4>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.key}>
                    <Link
                      to="/login"
                      className="font-body text-sm transition-colors duration-200"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                    >
                      {t(`landing.footer.${item.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {t('landing.footer.copyright')}
          </p>
          <div className="flex items-center gap-6">
            {(['terms', 'privacy'] as const).map((key) => (
              <Link
                key={key}
                to="/login"
                className="font-body text-xs transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                {t(`landing.footer.${key}`)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
