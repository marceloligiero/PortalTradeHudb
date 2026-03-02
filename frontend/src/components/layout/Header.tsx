import { useState, useEffect } from 'react';
import { LogOut, User, Moon, Sun, Globe, Target, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

const LANGS = [
  { code: 'pt-PT', label: '🇵🇹 PT', full: '🇵🇹 Português' },
  { code: 'es',    label: '🇪🇸 ES', full: '🇪🇸 Español'   },
  { code: 'en',    label: '🇺🇸 EN', full: '🇺🇸 English'   },
] as const;

export default function Header() {
  const { user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const close = () => setLangOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [langOpen]);

  const isTutoria = location.pathname.startsWith('/tutoria');

  return (
    <div className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 pt-4 pointer-events-none print:hidden">
      <motion.div
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-6xl mx-auto pointer-events-auto"
      >
        <div
          className="rounded-2xl p-px transition-all duration-500"
          style={{
            background: scrolled
              ? (isDark
                ? 'linear-gradient(135deg,rgba(239,68,68,.35) 0%,rgba(30,30,50,.4) 50%,rgba(59,130,246,.2) 100%)'
                : 'linear-gradient(135deg,rgba(239,68,68,.25) 0%,rgba(200,200,220,.3) 50%,rgba(59,130,246,.15) 100%)')
              : (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.09)'),
          }}
        >
          <div
            className={`rounded-[15px] backdrop-blur-2xl transition-all duration-500 ${
              scrolled
                ? isDark
                  ? 'bg-[#030307]/92 shadow-2xl shadow-black/40'
                  : 'bg-white/97 shadow-xl shadow-black/10'
                : isDark
                  ? 'bg-[#030307]/55'
                  : 'bg-white/65'
            }`}
          >
            <div className="px-5 h-14 flex items-center justify-between gap-4">
              {/* ── Brand ── */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/')}
                className="flex items-center gap-3 flex-shrink-0 cursor-pointer"
              >
                <img
                  src="/logo-sds.png"
                  alt="SDS"
                  className={`h-8 w-auto object-contain transition-all duration-300 ${isDark ? '' : 'brightness-0'}`}
                />
                <div className={`h-5 w-px ${isDark ? 'bg-white/15' : 'bg-gray-300'}`} />
                <span className={`text-sm font-black tracking-tight whitespace-nowrap ${isDark ? 'text-white/90' : 'text-gray-800'}`}>
                  Trade<span className="text-red-500">Data</span>Hub
                </span>
              </motion.div>

              {/* ── Controls ── */}
              <div className="flex items-center gap-1.5">
                {/* Portal Tutoria shortcut */}
                <button
                  onClick={() => navigate(isTutoria ? '/' : '/tutoria')}
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isDark
                      ? 'border-white/[0.09] text-gray-400 hover:bg-white/[0.07] hover:text-white hover:border-white/15'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {isTutoria ? <Home className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
                  <span className="hidden lg:inline">{isTutoria ? 'Formações' : 'Tutoria'}</span>
                </button>

                {/* Language */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setLangOpen((o) => !o)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isDark
                        ? 'border-white/[0.09] text-gray-400 hover:bg-white/[0.07] hover:text-white hover:border-white/15'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{LANGS.find((l) => i18n.language.startsWith(l.code.slice(0, 2)))?.label ?? LANGS[0].label}</span>
                    <span className="sm:hidden">{(i18n.language || 'pt').slice(0, 2).toUpperCase()}</span>
                  </button>
                  <AnimatePresence>
                    {langOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                        transition={{ duration: 0.14 }}
                        className={`absolute right-0 top-full mt-2 rounded-xl border shadow-2xl overflow-hidden z-20 min-w-[120px] ${
                          isDark ? 'bg-[#0c0c12] border-white/10' : 'bg-white border-gray-200'
                        }`}
                      >
                        {LANGS.map((l) => (
                          <button
                            key={l.code}
                            onClick={() => {
                              i18n.changeLanguage(l.code);
                              localStorage.setItem('language', l.code);
                              setLangOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                              i18n.language.startsWith(l.code.slice(0, 2))
                                ? 'text-red-500 font-bold'
                                : isDark
                                  ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                                  : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {l.full}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className={`p-1.5 rounded-xl border transition-all ${
                    isDark
                      ? 'border-white/[0.09] text-gray-400 hover:bg-white/[0.07] hover:text-white'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isDark ? 'sun' : 'moon'}
                      initial={{ rotate: -30, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 30, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </motion.div>
                  </AnimatePresence>
                </button>

                <div className={`h-5 w-px mx-0.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

                {/* User info */}
                <div className="hidden sm:flex items-center gap-2.5">
                  <div className="text-right">
                    <p className={`text-xs font-bold leading-none mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user?.full_name}
                    </p>
                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-[.12em]">
                      {t(`roles.${user?.role}`)}
                    </p>
                  </div>
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                      isDark
                        ? 'bg-white/[0.05] border-white/[0.09] text-gray-400'
                        : 'bg-gray-100 border-gray-200 text-gray-500'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={logout}
                  className={`p-1.5 rounded-xl border transition-all hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/10 ${
                    isDark
                      ? 'border-white/[0.09] text-gray-400'
                      : 'border-gray-200 text-gray-500'
                  }`}
                  title={t('common.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
