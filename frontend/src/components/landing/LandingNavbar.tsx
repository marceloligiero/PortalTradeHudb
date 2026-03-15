import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

const LANGUAGES = [
  { code: 'pt-PT', label: 'PT' },
  { code: 'en',    label: 'EN' },
  { code: 'es',    label: 'ES' },
];

const NAV_LINKS = [
  { label: 'Como Funciona',   href: '#como-funciona'   },
  { label: 'Funcionalidades', href: '#funcionalidades'  },
  { label: 'Para Quem',       href: '#para-quem'        },
];

export default function LandingNavbar() {
  const { i18n } = useTranslation();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [langOpen,  setLangOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
  };

  const currentLang = LANGUAGES.find(l => l.code === i18n.language)?.label ?? 'PT';

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-gray-100'
            : 'bg-transparent border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-santander-500 rounded-lg flex items-center justify-center shadow-sm">
              <Flame className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className={cn(
              'font-logo text-lg font-semibold tracking-tight transition-colors duration-300',
              scrolled ? 'text-gray-900' : 'text-white'
            )}>
              TradeDataHub
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'font-body text-sm transition-colors duration-200',
                  scrolled
                    ? 'text-gray-600 hover:text-santander-500'
                    : 'text-white/80 hover:text-white'
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop right: lang + CTA */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body transition-colors duration-300',
                  scrolled
                    ? 'text-gray-600 hover:bg-gray-100'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                <Globe className="w-4 h-4" />
                {currentLang}
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[72px] z-10">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={cn(
                        'block w-full text-left px-4 py-2 text-sm font-body hover:bg-gray-50 transition-colors',
                        i18n.language === lang.code ? 'text-santander-500 font-bold' : 'text-gray-700'
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/login"
              className={cn(
                'px-5 py-2 rounded-full text-sm font-body transition-colors duration-300',
                scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              )}
            >
              Iniciar Sessão
            </Link>

            <Link
              to="/login"
              className="bg-santander-500 hover:bg-santander-600 text-white px-5 py-2.5 rounded-full text-sm font-body font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02]"
            >
              Acessar Plataforma
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className={cn(
              'md:hidden p-2 rounded-lg transition-colors',
              scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
            )}
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-[60] bg-gradient-to-br from-santander-700 via-santander-800 to-[#1A0005] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-16">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Flame className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-logo text-lg font-semibold text-white">TradeDataHub</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-white/80 hover:text-white"
                aria-label="Fechar menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-white/80 text-2xl font-headline font-bold hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="w-12 h-px bg-white/20 my-4" />
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="bg-white text-santander-500 rounded-full px-8 py-4 text-lg font-body font-bold hover:bg-gray-100 transition-colors"
              >
                Acessar Plataforma
              </Link>
              <div className="flex gap-3 mt-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { changeLanguage(lang.code); setMenuOpen(false); }}
                    className={cn(
                      'text-sm font-body px-3 py-1.5 rounded-full transition-colors',
                      i18n.language === lang.code
                        ? 'bg-white/20 text-white font-bold'
                        : 'text-white/50 hover:text-white'
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
