import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useScrollReveal, reveal } from './primitives';

const COLUMNS = [
  {
    titleKey: 'platform',
    items: [
      { key: 'training',   href: '/#funcionalidades' },
      { key: 'tutoring',   to: '/portal-tutoria' },
      { key: 'reports',    href: '/#funcionalidades' },
      { key: 'tickets',    href: '/#funcionalidades' },
      { key: 'masterData', href: '/#funcionalidades' },
    ],
  },
  {
    titleKey: 'about',
    items: [
      { key: 'aboutUs', to: '/about' },
      { key: 'contact', href: '/about#contacto' },
    ],
  },
  {
    titleKey: 'resources',
    items: [
      { key: 'blog',    to: '/about' },
      { key: 'apiDocs', to: '/about' },
      { key: 'news',    to: '/about' },
    ],
  },
  {
    titleKey: 'support',
    items: [
      { key: 'helpCenter',   to: '/faq' },
      { key: 'faq',          to: '/faq' },
      { key: 'systemStatus', to: '/faq' },
    ],
  },
];

export default function LandingFooter() {
  const { t } = useTranslation();
  const { ref, visible } = useScrollReveal(0.05);

  return (
    <footer
      ref={ref as React.RefObject<HTMLElement>}
      className="bg-[#0F172A] dark:bg-[#050505]"
      style={{ padding: '60px 24px 40px', ...reveal(visible) }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo-sds.png" alt="TradeDataHub" className="h-7 w-auto mb-3" />
            </div>
            <p className="font-body text-xs leading-relaxed text-white/40" style={{ maxWidth: '200px' }}>
              {t('landing.footer.tagline')}
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.titleKey}>
              <h4 className="font-body text-xs font-bold uppercase mb-4 text-white/90" style={{ letterSpacing: '0.12em' }}>
                {t(`landing.footer.${col.titleKey}`)}
              </h4>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.key}>
                    {'href' in item ? (
                      <a href={item.href} className="font-body text-sm text-white/55 transition-colors duration-200 hover:text-white/90">
                        {t(`landing.footer.${item.key}`)}
                      </a>
                    ) : (
                      <Link to={item.to!} className="font-body text-sm text-white/55 transition-colors duration-200 hover:text-white/90">
                        {t(`landing.footer.${item.key}`)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="font-body text-xs text-white/35">
            {t('landing.footer.copyright')}
          </p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="font-body text-xs text-white/35 transition-colors duration-200 hover:text-white/75">
              {t('landing.footer.terms')}
            </Link>
            <Link to="/privacy" className="font-body text-xs text-white/35 transition-colors duration-200 hover:text-white/75">
              {t('landing.footer.privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
