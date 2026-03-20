import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

const LANGUAGES = [
  { code: 'pt-PT', label: 'PT' },
  { code: 'en',    label: 'EN' },
  { code: 'es',    label: 'ES' },
];

interface Props {
  minimal?: boolean; // hides nav links — used on auth pages
}

export default function LandingNavbar({ minimal = false }: Props) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const changeLanguage = (code: string) => i18n.changeLanguage(code);
  const isActive       = (code: string) => i18n.language === code || (code === 'pt-PT' && i18n.language.startsWith('pt'));

  const NAV_LINKS = [
    { label: t('landing.navbar.platform'),   href: '/#funcionalidades' },
    { label: t('landing.navbar.howItWorks'), href: '/#como-funciona'  },
    { label: t('landing.navbar.results'),    href: '/#resultados'     },
  ];

  // ── Shared controls ─────────────────────────────────────────────────────────

  const LangSwitcher = () => (
    <div
      className="flex items-center rounded-lg p-[3px] gap-[2px]"
      style={{
        background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      }}
    >
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className="relative px-2.5 py-[5px] rounded-md font-body font-semibold transition-all duration-200"
          style={{
            fontSize: '11px',
            color: isActive(lang.code)
              ? '#EC0000'
              : theme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
            background: isActive(lang.code)
              ? theme === 'dark' ? 'rgba(255,255,255,0.12)' : '#ffffff'
              : 'transparent',
            boxShadow: isActive(lang.code)
              ? theme === 'dark' ? 'none' : '0 1px 3px rgba(0,0,0,0.08)'
              : 'none',
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 overflow-hidden"
      style={{
        background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      }}
      aria-label={theme === 'light' ? 'Activar tema escuro' : 'Activar tema claro'}
    >
      <Sun
        className="w-[15px] h-[15px] absolute transition-all duration-500"
        style={{
          color: theme === 'dark' ? 'rgba(253,224,71,0.9)' : 'transparent',
          transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
          opacity: theme === 'dark' ? 1 : 0,
        }}
      />
      <Moon
        className="w-[15px] h-[15px] absolute transition-all duration-500"
        style={{
          color: theme === 'light' ? 'rgba(75,85,99,0.9)' : 'transparent',
          transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
          opacity: theme === 'light' ? 1 : 0,
        }}
      />
    </button>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-[#09090B]/85 backdrop-blur-xl backdrop-saturate-[1.8] border-b border-black/[0.04] dark:border-white/[0.06]'
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
              style={{ filter: theme === 'dark' ? 'none' : 'brightness(0)' }}
            />
            <span className="font-logo font-bold text-[#111827] dark:text-white text-base tracking-tight">
              TradeDataHub
            </span>
          </Link>

          {/* Desktop nav links (hidden in minimal mode) */}
          {!minimal && (
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
          )}

          {/* Right controls */}
          {minimal ? (
            /* Minimal mode (auth pages): only lang + theme, always visible */
            <div className="flex items-center gap-2">
              <LangSwitcher />
              <div className="w-px h-4 mx-1 bg-gray-200 dark:bg-white/10" />
              <ThemeToggle />
            </div>
          ) : (
            <>
              {/* Desktop right controls */}
              <div className="hidden md:flex items-center gap-2">
                <LangSwitcher />

                <div className="w-px h-4 mx-1 bg-gray-200 dark:bg-white/10" />

                <ThemeToggle />

                <div className="w-px h-4 mx-1 bg-gray-200 dark:bg-white/10" />

                {/* Login */}
                <Link
                  to="/login"
                  className="font-body font-medium text-sm px-4 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    color: theme === 'dark' ? 'rgba(255,255,255,0.75)' : '#374151',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#EC0000'; e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(236,0,0,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = theme === 'dark' ? 'rgba(255,255,255,0.75)' : '#374151'; e.currentTarget.style.background = 'transparent'; }}
                >
                  {t('landing.navbar.login')}
                </Link>

                {/* Register */}
                <Link
                  to="/register"
                  className="relative text-[13px] font-body font-bold text-white uppercase tracking-[0.05em]
                    px-5 py-2.5 rounded-lg overflow-hidden
                    transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,0,0,0.35)]
                    hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: '#EC0000' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#D00000')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#EC0000')}
                >
                  <span className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none" aria-hidden="true">
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shine_3s_ease-in-out_infinite]" />
                  </span>
                  <span className="relative">{t('landing.navbar.register')}</span>
                </Link>
              </div>

              {/* Mobile toggle */}
              <button
                className="md:hidden p-2 rounded-lg transition-colors text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                onClick={() => setMenuOpen(true)}
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-[#111113] flex flex-col">
          {/* Header row */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-sds.png"
                alt="TradeDataHub"
                className="h-8 w-auto"
                style={{ filter: theme === 'dark' ? 'none' : 'brightness(0)' }}
              />
              <span className="font-logo font-bold text-[#111827] dark:text-white text-base">TradeDataHub</span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-lg text-[#6B7280] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col items-start justify-center flex-1 gap-6 px-8">
            {!minimal && NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-headline font-bold text-2xl text-[#111827] dark:text-white hover:text-[#EC0000] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 mt-4 w-full max-w-[260px]">
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

          {/* Footer row — lang + theme */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-white/10">
            <LangSwitcher />
            <ThemeToggle />
          </div>
        </div>
      )}
    </>
  );
}
