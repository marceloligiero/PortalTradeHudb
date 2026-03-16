import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Menu, X, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'pt-PT', label: 'PT' },
  { code: 'en',    label: 'EN' },
  { code: 'es',    label: 'ES' },
];

export default function LandingNavbar() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [langOpen, setLangOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const changeLanguage = (code: string) => { i18n.changeLanguage(code); setLangOpen(false); };
  const currentLabel   = LANGUAGES.find(l => l.code === i18n.language)?.label ?? 'PT';
  const isActive       = (code: string) => i18n.language === code || (code === 'pt-PT' && i18n.language.startsWith('pt'));

  const NAV_LINKS = [
    { label: t('landing.navbar.platform'),   href: '#funcionalidades' },
    { label: t('landing.navbar.howItWorks'), href: '#como-funciona' },
    { label: t('landing.navbar.results'),    href: '#resultados' },
  ];

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300"
        style={{
          borderBottom: '1px solid #E5E7EB',
          boxShadow: scrolled ? '0 1px 16px rgba(0,0,0,0.07)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Flame className="w-5 h-5 text-[#EC0000]" />
            <span className="font-logo font-bold text-[#111827] text-base tracking-tight">
              TradeDataHub
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="font-body text-sm text-[#6B7280] hover:text-[#111827] transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 font-body text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors duration-200"
              >
                <Globe className="w-3.5 h-3.5" />
                {currentLabel}
              </button>
              {langOpen && (
                <div
                  className="absolute right-0 mt-2 py-1 rounded-lg min-w-[72px] z-10"
                  style={{ background: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                >
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className="block w-full text-left px-4 py-2 font-body text-xs hover:bg-gray-50 transition-colors"
                      style={{ color: isActive(lang.code) ? '#EC0000' : '#6B7280', fontWeight: isActive(lang.code) ? 700 : 400 }}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/login"
              className="font-body text-sm px-4 py-2 rounded-lg border transition-colors duration-200 text-[#111827] hover:border-[#EC0000] hover:text-[#EC0000]"
              style={{ borderColor: '#E5E7EB' }}
            >
              {t('landing.navbar.scheduleDemo')}
            </Link>
            <Link
              to="/login"
              className="font-body text-sm px-4 py-2 rounded-lg text-white transition-colors duration-200"
              style={{ background: '#EC0000' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#B80000')}
              onMouseLeave={e => (e.currentTarget.style.background = '#EC0000')}
            >
              {t('landing.navbar.productTour')}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-[#6B7280] hover:text-[#111827] transition-colors"
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col">
          <div className="flex items-center justify-between px-6 h-16" style={{ borderBottom: '1px solid #E5E7EB' }}>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#EC0000]" />
              <span className="font-logo font-bold text-[#111827] text-base">TradeDataHub</span>
            </div>
            <button onClick={() => setMenuOpen(false)} className="p-2 text-[#6B7280]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-start justify-center flex-1 gap-6 px-8">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-headline font-bold text-2xl text-[#111827]"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-4 font-body font-semibold px-6 py-3 rounded-lg text-white text-sm"
              style={{ background: '#EC0000' }}
            >
              {t('landing.navbar.enterPlatform')}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
