import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '../../lib/cn';

gsap.registerPlugin(ScrollTrigger);

const LANGUAGES = [
  { code: 'pt-PT', label: 'PT' },
  { code: 'en',    label: 'EN' },
  { code: 'es',    label: 'ES' },
];

export default function LandingNavbar() {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [langOpen, setLangOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // ANIM 3 — Navbar Morphing via GSAP ScrollTrigger
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nav = navRef.current;
    if (!nav) return;

    if (prefersReduced) {
      // Static glass always
      nav.style.backgroundColor = 'rgba(255,255,255,0.8)';
      nav.style.backdropFilter   = 'blur(20px)';
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 'top -80',
        onEnter: () => {
          setScrolled(true);
          gsap.to(nav, {
            backgroundColor: 'rgba(255,255,255,0.8)',
            backdropFilter:  'blur(20px)',
            borderBottomColor: 'rgba(229,229,229,0.5)',
            duration: 0.4,
            ease: 'power2.out',
          });
        },
        onLeaveBack: () => {
          setScrolled(false);
          gsap.to(nav, {
            backgroundColor: 'transparent',
            backdropFilter:  'blur(0px)',
            borderBottomColor: 'transparent',
            duration: 0.4,
            ease: 'power2.out',
          });
        },
      });
    });

    return () => ctx.revert();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
  };

  const currentLang = LANGUAGES.find(l => l.code === i18n.language)?.label || 'PT';

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 border-b border-transparent"
        style={{ backgroundColor: 'transparent', backdropFilter: 'blur(0px)' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo-sds.png"
              alt="TradeHub"
              className={cn('h-8 transition-all duration-300', scrolled ? '' : 'brightness-0 invert')}
            />
            <span className={cn(
              'font-headline text-lg font-bold transition-colors duration-300',
              scrolled ? 'text-gray-900 dark:text-white' : 'text-white'
            )}>
              TradeHub
            </span>
          </Link>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-text font-medium transition-colors duration-300',
                  scrolled
                    ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                <Globe className="w-4 h-4" />
                {currentLang}
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[80px]">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={cn(
                        'block w-full text-left px-4 py-2 text-sm font-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                        i18n.language === lang.code
                          ? 'text-santander-500 font-bold'
                          : 'text-gray-700 dark:text-gray-300'
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
                'px-5 py-2 rounded-full text-sm font-text font-medium transition-colors duration-300',
                scrolled
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'text-white hover:bg-white/10'
              )}
            >
              {t('landing.navbar.login')}
            </Link>

            <Link
              to="/register"
              className="bg-santander-500 hover:bg-santander-600 text-white rounded-full px-5 py-2.5 text-sm font-text font-bold transition-colors duration-300"
            >
              {t('landing.navbar.start')} →
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className={cn(
              'md:hidden p-2 rounded-lg transition-colors',
              scrolled ? 'text-gray-900 dark:text-white' : 'text-white'
            )}
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile fullscreen menu — animated with Motion */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-[60] bg-gradient-to-br from-santander-600 via-santander-700 to-santander-900 flex flex-col"
          >
            <div className="flex justify-end p-6">
              <button onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
                <X className="w-8 h-8 text-white" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 gap-8">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-white text-3xl font-headline font-bold hover:text-white/80 transition-colors"
              >
                {t('landing.navbar.login')}
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="bg-white text-santander-500 rounded-full px-8 py-4 text-xl font-text font-bold hover:bg-gray-100 transition-colors"
              >
                {t('landing.navbar.start')} →
              </Link>
              <div className="flex gap-4 mt-8">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { changeLanguage(lang.code); setMenuOpen(false); }}
                    className={cn(
                      'text-lg font-text px-4 py-2 rounded-full transition-colors',
                      i18n.language === lang.code
                        ? 'bg-white/20 text-white font-bold'
                        : 'text-white/60 hover:text-white'
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
