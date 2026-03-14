import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle, Lock, Eye, EyeOff, KeyRound, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import PremiumNavbar from '../components/PremiumNavbar';



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
      <input type={type} value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm py-1" />
      {right}
    </div>
  );
}

const stepMetaIcons = {
  email:    Mail,
  password: KeyRound,
  success:  CheckCircle,
};

const slideV = {
  enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

/* ═══════════════════════════════════════════════════════════════════════ */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');
  useEffect(() => { localStorage.setItem('theme', isDark ? 'dark' : 'light'); }, [isDark]);

  const stepMeta = {
    email:    { title: t('auth.forgot.title'), sub: t('auth.forgot.sub') },
    password: { title: t('auth.forgot.newPasswordTitle'), sub: '' },
    success:  { title: t('auth.forgot.successTitle'), sub: t('auth.forgot.successSub') },
  };

  const [step, setStep] = useState<'email' | 'password' | 'success'>('email');
  const [dir, setDir] = useState(1);
  const [focused, setFocused] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/verify-email', { email });
      setDir(1);
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.emailNotFound'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError(t('auth.passwordMinLength')); return; }
    if (newPassword !== confirmPassword) { setError(t('auth.passwordsDoNotMatch')); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/direct-reset-password', { email, new_password: newPassword });
      setDir(1);
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.resetError'));
    } finally {
      setLoading(false);
    }
  };

  const { title, sub } = stepMeta[step];
  const IconComp = stepMetaIcons[step];

  const stepDotIdx = step === 'email' ? 0 : step === 'password' ? 1 : 2;

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

      <PremiumNavbar isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} backTo={{ path: '/login', label: t('auth.backToLogin') }} />

      {/* ─── Card ───────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:28, scale:.97 }} animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:.7, ease:[0.22,1,0.36,1] }}
        className="relative z-10 w-full max-w-sm mx-4 mt-20 overflow-hidden rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
      >
        {/* TOP */}
        <div className={`px-8 pt-8 pb-7 ${isDark ? 'bg-[#1c1c2a]' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-6">
            <motion.button whileHover={{ x:-3 }}
              onClick={() => { setError(''); if (step === 'email') navigate('/login'); else { setDir(-1); setStep('email'); } }}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${isDark?'text-gray-500 hover:text-white':'text-gray-400 hover:text-gray-800'}`}>
              <ChevronLeft className="w-4 h-4" />
              <span>{step === 'email' ? t('auth.login') : t('auth.back')}</span>
            </motion.button>
            {step !== 'success' && (
              <div className="flex gap-1.5">
                {[0,1].map(i => (
                  <motion.div key={i}
                    animate={{ width: i === stepDotIdx ? 20 : 6, background: i < stepDotIdx ? '#22c55e' : i === stepDotIdx ? '#dc2626' : isDark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.15)' }}
                    transition={{ duration:.3 }} className="h-1.5 rounded-full" />
                ))}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:.25 }}>
              {step === 'success' ? (
                <div className="flex flex-col items-start gap-3">
                  <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:200 }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/25">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </motion.div>
                  <h1 className={`text-3xl font-black leading-tight tracking-tight whitespace-pre-line ${isDark?'text-white':'text-gray-900'}`}>{title}</h1>
                  <p className={`text-sm ${isDark?'text-gray-500':'text-gray-400'}`}>{sub}</p>
                </div>
              ) : (
                <>
                  <h1 className={`text-3xl font-black leading-tight tracking-tight whitespace-pre-line ${isDark?'text-white':'text-gray-900'}`}>{title}</h1>
                  {step === 'password' && (
                    <p className={`mt-2 text-sm ${isDark?'text-gray-500':'text-gray-400'}`}>
                      {t('auth.forgot.forEmail')} <span className="text-red-400 font-semibold">{email}</span>
                    </p>
                  )}
                  {step === 'email' && (
                    <p className={`mt-2 text-sm ${isDark?'text-gray-500':'text-gray-400'}`}>{sub}</p>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* BOTTOM: always dark */}
        <div className="bg-[#111822] px-8 pt-7 pb-8">
          <AnimatePresence custom={dir} mode="wait">

            {step === 'email' && (
              <motion.div key="email" custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
                transition={{ duration:.3, ease:[0.22,1,0.36,1] }}>
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <LineInput type="email" placeholder={t('auth.email')} value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} focused={focused==='email'}
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <AnimatePresence>
                    {error && <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="text-xs text-red-400">{error}</motion.p>}
                  </AnimatePresence>
                  <SubmitBtn loading={loading} label={t('auth.continue')} />
                </form>
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-600">
                    {t('auth.rememberPassword')}{' '}
                    <Link to="/login" className="text-red-400 hover:text-red-300 font-bold transition-colors">{t('auth.doLogin')}</Link>
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'password' && (
              <motion.div key="password" custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
                transition={{ duration:.3, ease:[0.22,1,0.36,1] }}>
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <LineInput type={showPw?'text':'password'} placeholder={t('auth.newPassword')} value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setError(''); }}
                    onFocus={() => setFocused('pw')} onBlur={() => setFocused(null)} focused={focused==='pw'}
                    icon={<Lock className="w-4 h-4" />}
                    right={
                      <button type="button" onClick={() => setShowPw(v=>!v)} className="text-gray-600 hover:text-gray-400 flex-shrink-0">
                        {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    }
                  />
                  <LineInput type={showCPw?'text':'password'} placeholder={t('auth.confirmNewPassword')} value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    onFocus={() => setFocused('cpw')} onBlur={() => setFocused(null)} focused={focused==='cpw'}
                    icon={<Lock className="w-4 h-4" />}
                    right={
                      <button type="button" onClick={() => setShowCPw(v=>!v)} className="text-gray-600 hover:text-gray-400 flex-shrink-0">
                        {showCPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    }
                  />
                  <AnimatePresence>
                    {error && <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="text-xs text-red-400">{error}</motion.p>}
                  </AnimatePresence>
                  <SubmitBtn loading={loading} label={t('auth.resetPassword')} />
                </form>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
                transition={{ duration:.3, ease:[0.22,1,0.36,1] }} className="text-center space-y-6">
                <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:200, delay:.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-600/25 mx-auto">
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <p className="text-sm text-gray-500">{t('auth.passwordResetSuccessMsg')}</p>
                <motion.button onClick={() => navigate('/login')}
                  whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:.98 }}
                  className="relative w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm overflow-hidden group"
                  style={{ background:'linear-gradient(135deg,#dc2626 0%,#b91c1c 60%,#991b1b 100%)' }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  <span className="absolute inset-0 rounded-2xl shadow-[0_8px_28px_rgba(220,38,38,0.35)] group-hover:shadow-[0_12px_36px_rgba(220,38,38,0.5)] transition-shadow pointer-events-none" />
                  <span className="relative">{t('auth.goToLogin')}</span>
                  <ArrowRight className="w-4 h-4 relative" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <p className={`relative z-10 text-center text-xs mt-8 ${isDark?'text-gray-800':'text-gray-400'}`}>
        {t('auth.copyright')}
      </p>
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <motion.button type="submit" disabled={loading}
      whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:.98 }}
      className="relative w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm overflow-hidden disabled:opacity-60 group"
      style={{ background:'linear-gradient(135deg,#dc2626 0%,#b91c1c 60%,#991b1b 100%)' }}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
      <span className="absolute inset-0 rounded-2xl shadow-[0_8px_28px_rgba(220,38,38,0.35)] group-hover:shadow-[0_12px_36px_rgba(220,38,38,0.5)] transition-shadow pointer-events-none" />
      {loading ? (
        <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
      ) : (
        <>
          <span className="relative">{label}</span>
          <ArrowRight className="w-4 h-4 relative" />
        </>
      )}
    </motion.button>
  );
}
