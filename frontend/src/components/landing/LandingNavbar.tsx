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
  { label: 'Como Funciona', href: '#como-funciona'   },
  { label: 'Módulos',       href: '#funcionalidades' },
  { label: 'Para Quem',     href: '#para-quem'       },
];

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="relative overflow-hidden group inline-flex flex-col font-body text-sm text-[#999] hover:text-white transition-colors duration-300"
      style={{ height: '1.2em', lineHeight: '1.2em' }}
    >
      <span className="transition-transform duration-300 ease-out group-hover:-translate-y-full whitespace-nowrap">
        {label}
      </span>
      <span className="absolute top-0 left-0 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 whitespace-nowrap">
        {label}
      </span>
    </a>
  );
}

export default function LandingNavbar() {
  const { i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

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
            ? 'bg-black/90 backdrop-blur-xl border-white/[0.06]'
            : 'bg-transparent border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-santander-500 rounded-lg flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-logo text-base font-semibold text-white tracking-tight">
              TradeDataHub
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-sm font-body text-[#555] hover:text-white transition-colors duration-300"
              >
                <Globe className="w-3.5 h-3.5" />
                {currentLang}
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 bg-[#111] border border-white/[0.06] rounded-lg py-1 min-w-[72px] z-10">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={cn(
                        'block w-full text-left px-4 py-2 text-xs font-body transition-colors hover:bg-white/5',
                        i18n.language === lang.code ? 'text-white font-bold' : 'text-[#555]'
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
              className="bg-santander-500 hover:bg-santander-400 text-white px-5 py-2.5 rounded-full text-sm font-body font-bold transition-all duration-200 shadow-[0_0_20px_rgba(236,0,0,0.2)] hover:shadow-[0_0_30px_rgba(236,0,0,0.4)]"
            >
              Acessar Plataforma
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-[#999] hover:text-white p-2 transition-colors"
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-santander-500 rounded-lg flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-logo text-base font-semibold text-white">TradeDataHub</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="text-[#555] hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col items-start justify-center flex-1 gap-6 px-8">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-headline font-bold text-3xl text-white/60 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="bg-santander-500 text-white px-8 py-3 rounded-full font-body font-bold text-sm"
                >
                  Acessar Plataforma
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
