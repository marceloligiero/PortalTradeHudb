import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/auth';
import { useAuthStore } from '../stores/authStore';
import {
  LogIn, Mail, Lock, Moon, Sun, Eye, EyeOff,
  Globe, UserPlus, ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── shared navbar ─────────────────────────────────────────────────── */
function Navbar({ isDark, setIsDark }: { isDark: boolean; setIsDark: (v: boolean) => void }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    if (!langOpen) return;
    const h = () => setLangOpen(false);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [langOpen]);

  const LANGS = [
    { code: 'pt-PT', label: '🇵🇹 Português' },
    { code: 'es',    label: '🇪🇸 Español'   },
    { code: 'en',    label: '🇺🇸 English'    },
  ];

  return (
    <div className="fixed top-0 inset-x-0 z-50 px-4 pt-4 pointer-events-none">
      <motion.div initial={{ y:-24, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:.6 }}
        className="max-w-md mx-auto pointer-events-auto">
        <div className={`rounded-2xl p-px ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.08]'}`}>
          <div className={`rounded-[15px] backdrop-blur-2xl px-4 h-12 flex items-center justify-between ${isDark ? 'bg-[#030307]/80' : 'bg-white/80'}`}>
            <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:.97 }}
              className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/logo-sds.png" alt="SDS" className={`h-6 w-auto object-contain ${isDark?'':'brightness-0'}`} />
              <div className={`h-4 w-px ${isDark?'bg-white/15':'bg-gray-300'}`} />
              <span className={`text-xs font-black tracking-tight ${isDark?'text-white/90':'text-gray-800'}`}>
                Trade<span className="text-red-500">Data</span>Hub
              </span>
            </motion.div>
            <div className="flex items-center gap-1">
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setLangOpen(o => !o)} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${isDark?'border-white/[0.09] text-gray-400 hover:bg-white/[0.07]':'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                  <Globe className="w-3 h-3" />
                  <span className="hidden sm:inline">{i18n.language.startsWith('es')?'ES':i18n.language.startsWith('en')?'EN':'PT'}</span>
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div initial={{ opacity:0, scale:.92, y:-4 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.92, y:-4 }} transition={{ duration:.12 }}
                      className={`absolute right-0 top-full mt-1.5 rounded-xl border shadow-2xl overflow-hidden z-20 min-w-[120px] ${isDark?'bg-[#0c0c12] border-white/10':'bg-white border-gray-200'}`}>
                      {LANGS.map(l => (
                        <button key={l.code} onClick={() => { i18n.changeLanguage(l.code); localStorage.setItem('language', l.code); setLangOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${i18n.language.startsWith(l.code.slice(0,2))?'text-red-500 font-bold':isDark?'text-gray-400 hover:bg-white/5 hover:text-white':'text-gray-600 hover:bg-gray-50'}`}>
                          {l.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={() => setIsDark(!isDark)} className={`p-1.5 rounded-lg border transition-all ${isDark?'border-white/[0.09] text-gray-400 hover:bg-white/[0.07]':'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                <AnimatePresence mode="wait">
                  <motion.div key={isDark?'sun':'moon'} initial={{ rotate:-30, opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:30, opacity:0 }} transition={{ duration:.15 }}>
                    {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── underline input ───────────────────────────────────────────────── */
function LineInput({ type='text', placeholder, value, onChange, onFocus, onBlur, focused, icon, right }: {
  type?: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void; onBlur: () => void; focused: boolean;
  icon: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 border-b pb-3 transition-colors duration-200 ${focused ? 'border-red-500' : 'border-white/15 hover:border-white/25'}`}>
      <div className={`flex-shrink-0 transition-colors ${focused ? 'text-red-400' : 'text-gray-500'}`}>{icon}</div>
      <input
        type={type} value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm py-1"
      />
      {right}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(s => s.login);
  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/';
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => { localStorage.setItem('theme', isDark ? 'dark' : 'light'); }, [isDark]);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: any) => { login(data.user, data.access_token); window.location.href = redirectTo; },
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); loginMutation.mutate({ email, password }); };

  return (
    <div className={`min-h-screen relative flex flex-col items-center justify-center transition-colors duration-700 overflow-hidden ${isDark ? 'bg-[#030307]' : 'bg-slate-100'}`}>

      {/* aurora */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ x:[0,60,-40,0], y:[0,-50,30,0] }} transition={{ duration:25, repeat:Infinity, ease:'easeInOut' }}
          className={`absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full blur-[160px] ${isDark?'bg-red-600/[0.07]':'bg-red-500/[0.05]'}`} />
        <motion.div animate={{ x:[0,-50,30,0], y:[0,40,-20,0] }} transition={{ duration:30, repeat:Infinity, ease:'easeInOut', delay:5 }}
          className={`absolute -bottom-[10%] -right-[10%] w-[500px] h-[500px] rounded-full blur-[140px] ${isDark?'bg-blue-600/[0.05]':'bg-blue-500/[0.03]'}`} />
        <div className="absolute inset-0" style={{ backgroundImage:`radial-gradient(circle,${isDark?'rgba(255,255,255,0.025)':'rgba(0,0,0,0.025)'} 1px,transparent 1px)`, backgroundSize:'28px 28px' }} />
      </div>

      <Navbar isDark={isDark} setIsDark={setIsDark} />

      {/* ─── Card ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:28, scale:.97 }} animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:.7, ease:[0.22,1,0.36,1] }}
        className="relative z-10 w-full max-w-sm mx-4 mt-20 overflow-hidden rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
      >
        {/* ── TOP: header ─────────────────────────────────────── */}
        <div className={`px-8 pt-8 pb-7 ${isDark ? 'bg-[#1c1c2a]' : 'bg-white'}`}>
          <motion.button whileHover={{ x:-3 }} onClick={() => navigate('/')}
            className={`flex items-center gap-1 text-sm font-medium mb-6 transition-colors ${isDark?'text-gray-500 hover:text-white':'text-gray-400 hover:text-gray-800'}`}>
            <ChevronLeft className="w-4 h-4" />
            <span>Trade DataHub</span>
          </motion.button>
          <h1 className={`text-3xl font-black leading-tight tracking-tight ${isDark?'text-white':'text-gray-900'}`}>
            {t('common.welcome')}<br />
            <span className="text-red-500">de volta.</span>
          </h1>
          <p className={`mt-2 text-sm ${isDark?'text-gray-500':'text-gray-400'}`}>
            {t('auth.loginToContinue')}
          </p>
        </div>

        {/* ── BOTTOM: form (always dark) ───────────────────────── */}
        <div className="bg-[#111822] px-8 pt-7 pb-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <LineInput
              type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
              focused={focused === 'email'} icon={<Mail className="w-4 h-4" />}
            />
            <LineInput
              type={showPassword ? 'text' : 'password'} placeholder={t('auth.password')} value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
              focused={focused === 'password'} icon={<Lock className="w-4 h-4" />}
              right={
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex justify-end -mt-2">
              <Link to="/forgot-password" className="text-xs font-medium text-gray-600 hover:text-red-400 transition-colors">
                {t('auth.forgotPassword', 'Esqueceu a senha?')}
              </Link>
            </div>

            {/* error */}
            <AnimatePresence>
              {loginMutation.isError && (
                <motion.p initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  className="text-xs text-red-400 text-center">
                  {t('auth.loginError')}
                </motion.p>
              )}
            </AnimatePresence>

            {/* submit */}
            <motion.button type="submit" disabled={loginMutation.isPending}
              whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:.98 }}
              className="relative w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm overflow-hidden disabled:opacity-60 group"
              style={{ background:'linear-gradient(135deg,#dc2626 0%,#b91c1c 60%,#991b1b 100%)' }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <span className="absolute inset-0 rounded-2xl shadow-[0_8px_28px_rgba(220,38,38,0.35)] group-hover:shadow-[0_12px_36px_rgba(220,38,38,0.5)] transition-shadow pointer-events-none" />
              {loginMutation.isPending ? (
                <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  <LogIn className="w-4 h-4 relative" />
                  <span className="relative">{t('auth.login')}</span>
                </>
              )}
            </motion.button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-gray-700">ou</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <motion.button type="button" onClick={() => navigate('/register')}
            whileHover={{ scale:1.02 }} whileTap={{ scale:.98 }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/[0.08] text-sm font-semibold text-gray-400 hover:bg-white/[0.04] hover:border-white/[0.15] transition-all"
          >
            <UserPlus className="w-4 h-4" />
            {t('auth.noAccount')} <span className="text-red-500 font-bold ml-1">{t('auth.register')}</span>
          </motion.button>
        </div>
      </motion.div>

      <p className={`relative z-10 text-center text-xs mt-8 ${isDark?'text-gray-800':'text-gray-400'}`}>
        {t('common.appName')} © 2026 · Trade Data Hub
      </p>

      <style>{`
        @keyframes shimmer-lr { 0%{background-position:0% center} 100%{background-position:300% center} }
      `}</style>
    </div>
  );
}
