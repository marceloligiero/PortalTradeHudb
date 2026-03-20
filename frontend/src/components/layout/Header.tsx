import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Sun, Moon, Menu, X, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, getEffectiveRole } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebarStore } from '../../stores/sidebarStore';

const LANGUAGES = [
  { code: 'pt-PT', label: 'PT' },
  { code: 'en',    label: 'EN' },
  { code: 'es',    label: 'ES' },
];

const PORTAL_LINKS = [
  { key: 'home',       to: '/',            labelKey: 'navigation.formacoes',   match: (p: string) => !p.startsWith('/tutoria') && !p.startsWith('/relatorios') && !p.startsWith('/master-data') && !p.startsWith('/chamados') },
  { key: 'tutoria',    to: '/tutoria',     labelKey: 'navigation.tutoria',     match: (p: string) => p.startsWith('/tutoria') },
  { key: 'relatorios', to: '/relatorios',  labelKey: 'navigation.reports',     match: (p: string) => p.startsWith('/relatorios') },
  { key: 'masterData', to: '/master-data', labelKey: 'navigation.masterData',  match: (p: string) => p.startsWith('/master-data'), roles: ['ADMIN', 'MANAGER', 'GESTOR'] },
  { key: 'chamados',   to: '/chamados',    labelKey: 'navigation.chamados',    match: (p: string) => p.startsWith('/chamados') },
];

export default function Header() {
  const { user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { openMobile } = useSidebarStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };
  const isLangActive = (code: string) => i18n.language === code || (code === 'pt-PT' && i18n.language.startsWith('pt'));
  const currentLang = LANGUAGES.find(l => isLangActive(l.code))?.label ?? 'PT';

  const visiblePortals = PORTAL_LINKS.filter(link =>
    !link.roles || (user?.role && link.roles.includes(user.role))
  );

  const initials = (user?.full_name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 print:hidden ${
          scrolled
            ? 'bg-white/80 dark:bg-[#09090B]/85 backdrop-blur-xl backdrop-saturate-[1.8] border-b border-black/[0.04] dark:border-white/[0.06]'
            : 'bg-white/60 dark:bg-[#09090B]/50 backdrop-blur-xl border-b border-transparent'
        }`}
        style={{ boxShadow: scrolled ? '0 1px 16px rgba(0,0,0,0.07)' : 'none' }}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center">

          {/* ── Logo ── */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 shrink-0 mr-10"
          >
            <img
              src="/logo-sds.png"
              alt="TradeDataHub"
              className="h-7 w-auto transition-all duration-300 hover:scale-[1.03]"
              style={{ filter: theme === 'dark' ? 'none' : 'brightness(0)' }}
            />
            <span className="hidden sm:inline font-logo font-bold text-[#111827] dark:text-white text-[15px] tracking-tight">
              TradeDataHub
            </span>
          </button>

          {/* ── Desktop nav links — clean text, no icons ── */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {visiblePortals.map(link => {
              const active = link.match(location.pathname);
              return (
                <button
                  key={link.key}
                  onClick={() => navigate(link.to)}
                  className={`relative font-body text-[13px] px-3.5 py-2 transition-colors duration-200
                    ${active
                      ? 'text-[#EC0000] font-semibold'
                      : 'text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-white'
                    }`}
                >
                  {t(link.labelKey)}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#EC0000] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ── Right: avatar dropdown (all controls inside) ── */}
          <div className="hidden md:flex items-center gap-3 ml-auto" ref={dropdownRef}>

            {/* Theme toggle — small, unobtrusive */}
            <button
              onClick={toggleTheme}
              className="relative w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
              style={{
                background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              }}
              aria-label={theme === 'light' ? 'Activar tema escuro' : 'Activar tema claro'}
            >
              <Sun
                className="w-[14px] h-[14px] absolute transition-all duration-500"
                style={{
                  color: theme === 'dark' ? 'rgba(253,224,71,0.85)' : 'transparent',
                  transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
                  opacity: theme === 'dark' ? 1 : 0,
                }}
              />
              <Moon
                className="w-[14px] h-[14px] absolute transition-all duration-500"
                style={{
                  color: theme === 'light' ? 'rgba(75,85,99,0.7)' : 'transparent',
                  transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
                  opacity: theme === 'light' ? 1 : 0,
                }}
              />
            </button>

            {/* Avatar + dropdown trigger */}
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-all duration-200 ${
                dropdownOpen
                  ? 'bg-gray-100 dark:bg-white/10'
                  : 'hover:bg-gray-100/60 dark:hover:bg-white/[0.06]'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#EC0000] flex items-center justify-center">
                <span className="text-[11px] font-bold text-white leading-none">{initials}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div
                className="absolute right-6 top-[calc(100%-4px)] mt-2 w-64 rounded-xl border shadow-xl overflow-hidden bg-white dark:bg-[#111113] border-gray-200 dark:border-white/10 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                {/* User info */}
                <div className="px-4 py-3.5 border-b border-gray-100 dark:border-white/[0.06]">
                  <p className="text-sm font-bold text-[#111827] dark:text-white truncate">{user?.full_name}</p>
                  <p className="text-[10px] font-bold text-[#EC0000] uppercase tracking-[.1em] mt-0.5">
                    {t(`roles.${getEffectiveRole(user)}`)}
                  </p>
                </div>

                {/* Language */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                    {t('common.language', 'Idioma')}
                  </p>
                  <div className="flex gap-1.5">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                          isLangActive(lang.code)
                            ? 'bg-[#EC0000] text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-800 dark:hover:text-white'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-[#EC0000] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout')}
                </button>
              </div>
            )}
          </div>

          {/* ── Mobile: lang badge + hamburger ── */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <span className="text-[10px] font-bold text-gray-400">{currentLang}</span>
            <button
              className="p-2 rounded-lg transition-colors text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
              onClick={() => user ? openMobile() : setMenuOpen(true)}
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-[#111113] flex flex-col print:hidden">
          {/* Header row */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-sds.png"
                alt="TradeDataHub"
                className="h-7 w-auto"
                style={{ filter: theme === 'dark' ? 'none' : 'brightness(0)' }}
              />
              <span className="font-logo font-bold text-[#111827] dark:text-white text-[15px]">TradeDataHub</span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-lg text-[#6B7280] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col items-start justify-center flex-1 gap-5 px-8">
            {visiblePortals.map(link => {
              const active = link.match(location.pathname);
              return (
                <button
                  key={link.key}
                  onClick={() => { navigate(link.to); setMenuOpen(false); }}
                  className={`font-headline font-bold text-2xl transition-colors ${
                    active ? 'text-[#EC0000]' : 'text-[#111827] dark:text-white hover:text-[#EC0000]'
                  }`}
                >
                  {t(link.labelKey)}
                </button>
              );
            })}

            {/* User + logout */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 w-full max-w-[280px]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#EC0000] flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{initials}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111827] dark:text-white">{user?.full_name}</p>
                  <p className="text-[10px] font-bold text-[#EC0000] uppercase tracking-[.12em]">
                    {t(`roles.${getEffectiveRole(user)}`)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="font-body font-medium w-full px-6 py-3 rounded-lg text-center text-sm border border-gray-300 dark:border-white/20 text-[#111827] dark:text-white hover:border-[#EC0000] hover:text-[#EC0000] transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t('common.logout')}
              </button>
            </div>
          </div>

          {/* Footer — lang + theme */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-white/10">
            <div className="flex gap-1.5">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isLangActive(lang.code)
                      ? 'bg-[#EC0000] text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <button
              onClick={toggleTheme}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 overflow-hidden"
              style={{
                background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              }}
              aria-label={theme === 'light' ? 'Activar tema escuro' : 'Activar tema claro'}
            >
              <Sun
                className="w-4 h-4 absolute transition-all duration-500"
                style={{
                  color: theme === 'dark' ? 'rgba(253,224,71,0.9)' : 'transparent',
                  transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
                  opacity: theme === 'dark' ? 1 : 0,
                }}
              />
              <Moon
                className="w-4 h-4 absolute transition-all duration-500"
                style={{
                  color: theme === 'light' ? 'rgba(75,85,99,0.9)' : 'transparent',
                  transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
                  opacity: theme === 'light' ? 1 : 0,
                }}
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
