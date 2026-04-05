/**
 * PremiumNavbar — Unified floating navbar used across Landing, Login, Register, Forgot/Reset Password.
 *
 * Inspired by Mirage-style dark glassmorphism navbars:
 *   · Frosted glass pill with animated border glow
 *   · Magnetic hover effects on interactive elements
 *   · Animated language dropdown with flag emojis
 *   · Smooth theme toggle with rotation transition
 *   · Context-aware CTA buttons (show Sign In / Register on landing, hide on auth pages)
 *   · Scroll-aware: background opacity increases on scroll
 *   · Framer Motion entrance + micro-interactions
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Globe, Sun, Moon, LogIn, UserPlus, ChevronDown, ArrowLeft,
} from 'lucide-react';
import { STORAGE_KEYS } from '../constants/storageKeys';

/* ─── Language definitions ──────────────────────────────────────────── */
const LANGS = [
  { code: 'pt-PT', label: 'Português', flag: '🇵🇹', short: 'PT' },
  { code: 'es',    label: 'Español',   flag: '🇪🇸', short: 'ES' },
  { code: 'en',    label: 'English',   flag: '🇺🇸', short: 'EN' },
] as const;

function getLangShort(langCode: string) {
  if (langCode.startsWith('es')) return 'ES';
  if (langCode.startsWith('en')) return 'EN';
  return 'PT';
}
function getLangFlag(langCode: string) {
  if (langCode.startsWith('es')) return '🇪🇸';
  if (langCode.startsWith('en')) return '🇺🇸';
  return '🇵🇹';
}

/* ─── Props ─────────────────────────────────────────────────────────── */
interface PremiumNavbarProps {
  /** Show theme toggle (moon/sun). Default true */
  showThemeToggle?: boolean;
  /** Current dark mode state */
  isDark?: boolean;
  /** Toggle dark mode callback */
  onToggleTheme?: () => void;
  /** Show auth CTA buttons (login + register). Defaults to true on landing, false on auth pages */
  showAuthButtons?: boolean;
  /** Show a "back" link (e.g. on forgot-password → back to login) */
  backTo?: { path: string; label?: string };
  /** Additional right-side content (slot) */
  rightSlot?: React.ReactNode;
  /**
   * Language change handler for pages with custom i18n.
   * If provided, bypasses react-i18next and calls this instead.
   */
  onLangChange?: (code: string) => void;
  /** Current language code override (for custom i18n pages) */
  currentLang?: string;
}

/* ─── Component ─────────────────────────────────────────────────────── */
export default function PremiumNavbar({
  showThemeToggle = true,
  isDark = true,
  onToggleTheme,
  showAuthButtons,
  backTo,
  rightSlot,
  onLangChange,
  currentLang,
}: PremiumNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine if we're on landing
  const isLanding = location.pathname === '/';

  // Default: show auth buttons only on landing
  const showAuth = showAuthButtons ?? isLanding;

  // Scroll listener for glassmorphism intensity
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 20));

  // Language state
  const activeLang = currentLang
    ? getLangShort(currentLang)
    : getLangShort(i18n.language);
  const activeFlag = currentLang
    ? getLangFlag(currentLang)
    : getLangFlag(i18n.language);

  // Close dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [langOpen]);

  const handleLangChange = useCallback((code: string) => {
    if (onLangChange) {
      onLangChange(code);
    } else {
      i18n.changeLanguage(code);
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, code);
    }
    setLangOpen(false);
  }, [i18n, onLangChange]);

  const isActiveLang = useCallback((code: string) => {
    if (currentLang) {
      return currentLang.startsWith(code.slice(0, 2));
    }
    return i18n.language.startsWith(code.slice(0, 2));
  }, [currentLang, i18n.language]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 pt-4 pointer-events-none"
    >
      <div className="max-w-6xl mx-auto pointer-events-auto">
        {/* Outer glow border */}
        <div className={`rounded-2xl p-px transition-all duration-500 ${
          scrolled
            ? 'bg-gradient-to-r from-red-500/20 via-white/[0.08] to-red-500/20'
            : 'bg-white/[0.06]'
        }`}>
          {/* Inner glass pill */}
          <div className={`rounded-[15px] backdrop-blur-2xl px-4 sm:px-5 h-14 flex items-center justify-between transition-all duration-500 ${
            scrolled ? 'bg-[#050508]/90' : 'bg-[#050508]/70'
          }`}>

            {/* ── LEFT: Brand ── */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => navigate('/')}
            >
              <img src="/logo-sds.png" alt="SDS" className="h-7 w-auto" />
              <div className="h-5 w-px bg-white/10" />
              <span className="text-sm font-black tracking-tight text-white/90">
                Trade<span className="text-red-500">Data</span>Hub
              </span>
            </motion.div>

            {/* ── RIGHT: Controls ── */}
            <div className="flex items-center gap-1.5">

              {/* Language Switcher */}
              <div ref={dropdownRef} className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLangOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    langOpen
                      ? 'bg-white/[0.08] text-white/70'
                      : 'text-white/35 hover:text-white/65 hover:bg-white/[0.05]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">{activeFlag} {activeLang}</span>
                  <span className="sm:hidden text-[11px]">{activeLang}</span>
                  <motion.div animate={{ rotate: langOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -6 }}
                      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-full mt-2 rounded-xl border border-white/10
                        bg-[#0c0c14]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                        overflow-hidden min-w-[160px] z-20"
                    >
                      {LANGS.map((l, idx) => (
                        <motion.button
                          key={l.code}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          onClick={() => handleLangChange(l.code)}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-200
                            flex items-center gap-3 ${
                            isActiveLang(l.code)
                              ? 'text-red-400 font-bold bg-red-500/[0.06]'
                              : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          <span className="text-base">{l.flag}</span>
                          <span>{l.label}</span>
                          {isActiveLang(l.code) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500"
                            />
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme Toggle */}
              {showThemeToggle && onToggleTheme && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggleTheme}
                  className="p-2 rounded-xl text-white/30 hover:text-white/60
                    hover:bg-white/[0.05] transition-all duration-200"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isDark ? 'sun' : 'moon'}
                      initial={{ rotate: -60, opacity: 0, scale: 0.5 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 60, opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>
              )}

              {/* Separator before auth/back buttons */}
              {(showAuth || backTo || rightSlot) && (
                <div className="h-5 w-px mx-0.5 bg-white/[0.08]" />
              )}

              {/* Back link (for forgot/reset password) */}
              {backTo && (
                <motion.button
                  whileHover={{ scale: 1.03, x: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(backTo.path)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px]
                    font-medium text-white/35 hover:text-white/70 hover:bg-white/[0.05] transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{backTo.label || 'Voltar'}</span>
                </motion.button>
              )}

              {/* Right slot for custom content */}
              {rightSlot}

              {/* Auth Buttons (landing page) */}
              {showAuth && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px]
                      font-medium text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {getLangShort(i18n.language) === 'ES' ? 'Entrar' : getLangShort(i18n.language) === 'EN' ? 'Sign In' : 'Entrar'}
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(220,38,38,0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/register')}
                    className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px]
                      font-bold text-white overflow-hidden
                      bg-gradient-to-r from-red-600 to-red-500
                      shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition-all duration-300"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>
                      {getLangShort(i18n.language) === 'ES' ? 'Registrarse' : getLangShort(i18n.language) === 'EN' ? 'Register' : 'Registar'}
                    </span>
                    {/* Animated shimmer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
                    />
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
