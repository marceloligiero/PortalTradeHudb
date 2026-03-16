import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Globe, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

const LANGUAGES = [
  { code: 'pt-PT', label: 'PT' },
  { code: 'en',    label: 'EN' },
  { code: 'es',    label: 'ES' },
];

export default function LandingNavbar() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-xl backdrop-saturate-[1.8] border-b border-black/[0.04] dark:border-white/[0.06]'
            : 'bg-transparent border-b border-transparent'
        }`}
        style={{ boxShadow: scrolled ? '0 1px 16px rgba(0,0,0,0.07)' : 'none' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/logo-sds.png"
              alt="TradeDataHub"
              className="h-8 w-auto transition-all duration-300 hover:drop-shadow-[0_0_12px_rgba(236,0,0,0.25)] hover:scale-[1.03]"
            />
            <span className="font-logo font-bold text-[#111827] dark:text-white text-base tracking-tight">
              TradeDataHub
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="relative font-body text-sm text-[#6B7280] dark:text-gray-300 hover:text-[#111827] dark:hover:text-white transition-colors duration-200
                  after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-[#EC0000] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left pb-0.5"
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
                className="flex items-center gap-1.5 font-body text-xs text-[#9CA3AF] dark:text-gray-500 hover:text-[#6B7280] dark:hover:text-gray-300 transition-colors duration-200"
              >
                <Globe className="w-3.5 h-3.5" />
                {currentLabel}
              </button>
              {langOpen && (
                <div
                  className="absolute right-0 mt-2 py-1 rounded-lg min-w-[72px] z-10 bg-white dark:bg-[#161618] border border-gray-200 dark:border-white/10"
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                >
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className="block w-full text-left px-4 py-2 font-body text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      style={{ color: isActive(lang.code) ? '#EC0000' : undefined, fontWeight: isActive(lang.code) ? 700 : 400 }}
                    >
                      <span className={isActive(lang.code) ? '' : 'text-[#6B7280] dark:text-gray-400'}>
                        {lang.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
              aria-label={theme === 'light' ? 'Activar tema escuro' : 'Activar tema claro'}
            >
              <Sun className={`w-5 h-5 absolute transition-all duration-500 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
              <Moon className={`w-5 h-5 absolute transition-all duration-500 ${theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
            </button>

            {/* Login button */}
            <Link
              to="/login"
              className="text-gray-700 dark:text-gray-300 hover:text-[#EC0000] font-body font-medium text-sm px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              {t('landing.navbar.login')}
            </Link>

            {/* Cadastrar-se button with shine + glow */}
            <Link
              to="/register"
              className="relative text-[13px] font-body font-bold text-white uppercase tracking-[0.05em]
                bg-[#EC0000] hover:bg-[#D00000] px-5 py-2.5 rounded-lg overflow-hidden
                transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,0,0,0.35)]
                hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="absolute inset-0 overflow-hidden rounded-lg" aria-hidden="true">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shine_3s_ease-in-out_infinite]" />
              </span>
              <span className="relative">{t('landing.navbar.register')}</span>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-white transition-colors"
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile menu — slide-down panel */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-[#111113] flex flex-col">
          <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-sds.png"
                alt="TradeDataHub"
                className="h-8 w-auto"
              />
              <span className="font-logo font-bold text-[#111827] dark:text-white text-base">TradeDataHub</span>
            </div>
            <button onClick={() => setMenuOpen(false)} className="p-2 text-[#6B7280] dark:text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-start justify-center flex-1 gap-6 px-8">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-headline font-bold text-2xl text-[#111827] dark:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 mt-4 w-full max-w-[240px]">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="font-body font-medium px-6 py-3 rounded-lg text-center text-sm border border-gray-300 dark:border-white/20 text-[#111827] dark:text-white hover:border-[#EC0000] hover:text-[#EC0000] transition-colors"
              >
                {t('landing.navbar.login')}
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="font-body font-bold px-6 py-3 rounded-lg text-center text-white text-sm bg-[#EC0000] hover:bg-[#D00000] transition-colors"
              >
                {t('landing.navbar.register')}
              </Link>
            </div>
          </div>
          {/* Mobile theme toggle + lang */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-white/10">
            <span className="text-sm font-body text-gray-600 dark:text-gray-400">{t('landing.navbar.theme') ?? 'Tema'}</span>
            <div className="flex items-center gap-3">
              {/* Mobile language buttons */}
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className="font-body text-xs px-2 py-1 rounded transition-colors"
                  style={{
                    color: isActive(lang.code) ? '#EC0000' : '#9CA3AF',
                    fontWeight: isActive(lang.code) ? 700 : 400,
                  }}
                >
                  {lang.label}
                </button>
              ))}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                aria-label={theme === 'light' ? 'Activar tema escuro' : 'Activar tema claro'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
