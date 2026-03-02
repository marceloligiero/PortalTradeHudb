import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import {
  UserPlus, Mail, Lock, User, GraduationCap, Users,
  Moon, Sun, Eye, EyeOff, CheckCircle, LogIn, ChevronLeft, Globe, Sparkles,
} from 'lucide-react';
import { Alert } from '../components';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'framer-motion';

/* ─── shared helpers (same as LoginPage) ─────────────────────────── */
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
  const LANGS = [{ code:'pt-PT', label:'🇵🇹 Português' }, { code:'es', label:'🇪🇸 Español' }, { code:'en', label:'🇺🇸 English' }];
  return (
    <div className="fixed top-0 inset-x-0 z-50 px-4 pt-4 pointer-events-none">
      <motion.div initial={{ y:-24, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:.6 }}
        className="max-w-md mx-auto pointer-events-auto">
        <div className={`rounded-2xl p-px ${isDark?'bg-white/[0.06]':'bg-black/[0.08]'}`}>
          <div className={`rounded-[15px] backdrop-blur-2xl px-4 h-12 flex items-center justify-between ${isDark?'bg-[#030307]/80':'bg-white/80'}`}>
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

function pwStrength(pw: string) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label:'Muito fraca', color:'#ef4444' },
    { label:'Fraca', color:'#f97316' },
    { label:'Razoável', color:'#eab308' },
    { label:'Forte', color:'#22c55e' },
    { label:'Muito forte', color:'#10b981' },
  ];
  return { score: s, ...map[Math.min(s, 4)] };
}

const STEP_TITLES = [
  { title: 'Crie a sua\nconta.', sub: 'Escolha o seu perfil na plataforma.' },
  { title: 'Dados de\nacesso.', sub: 'O seu acesso é 100% encriptado.' },
  { title: 'Tudo\ncerto!' , sub: 'Confirme e crie a sua conta.' },
];

const slideV = {
  enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

/* ═══════════════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');
  useEffect(() => { localStorage.setItem('theme', isDark ? 'dark' : 'light'); }, [isDark]);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [focused, setFocused] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);

  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirmPassword: '', role: 'TRAINEE' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setError('');
  };

  const strength = pwStrength(form.password);
  const initials = form.full_name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

  const next = () => {
    setError('');
    if (step === 0 && !form.full_name.trim()) { setError(t('auth.fillAllFields')); return; }
    if (step === 1) {
      if (!form.email || !form.password || !form.confirmPassword) { setError(t('auth.fillAllFields')); return; }
      if (!form.email.includes('@')) { setError(t('auth.invalidEmail')); return; }
      if (form.password.length < 6) { setError(t('auth.passwordMinLength')); return; }
      if (form.password !== form.confirmPassword) { setError(t('auth.passwordsDoNotMatch')); return; }
    }
    setDir(1);
    setStep(s => Math.min(s + 1, 2));
  };

  const back = () => { setError(''); setDir(-1); setStep(s => Math.max(s - 1, 0)); };

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email: form.email, password: form.password, full_name: form.full_name, role: form.role });
      if (res.data) {
        setSuccess(form.role === 'TRAINER' ? t('auth.registerTrainerSuccess') : t('auth.registerStudentSuccess'));
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.registrationError'));
    } finally {
      setLoading(false);
    }
  };

  const { title, sub } = STEP_TITLES[step];

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
        {/* TOP: header */}
        <div className={`px-8 pt-8 pb-7 ${isDark ? 'bg-[#1c1c2a]' : 'bg-white'}`}>
          {/* back / step dots */}
          <div className="flex items-center justify-between mb-6">
            <motion.button whileHover={{ x:-3 }} onClick={step === 0 ? () => navigate('/login') : back}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${isDark?'text-gray-500 hover:text-white':'text-gray-400 hover:text-gray-800'}`}>
              <ChevronLeft className="w-4 h-4" />
              <span>{step === 0 ? 'Login' : 'Voltar'}</span>
            </motion.button>
            {/* step dots */}
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <motion.div key={i}
                  animate={{ width: i === step ? 20 : 6, background: i < step ? '#22c55e' : i === step ? '#dc2626' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }}
                  transition={{ duration:.3 }}
                  className="h-1.5 rounded-full"
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              transition={{ duration:.25 }}>
              <h1 className={`text-3xl font-black leading-tight tracking-tight whitespace-pre-line ${isDark?'text-white':'text-gray-900'}`}>
                {title}
              </h1>
              <p className={`mt-2 text-sm ${isDark?'text-gray-500':'text-gray-400'}`}>{sub}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* BOTTOM: form (always dark) */}
        <div className="bg-[#111822] px-8 pt-7 pb-8">
          <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
            <AnimatePresence custom={dir} mode="wait">

              {/* STEP 0: Profile */}
              {step === 0 && (
                <motion.div key="s0" custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
                  transition={{ duration:.3, ease:[0.22,1,0.36,1] }} className="space-y-6">

                  {/* name with live initials */}
                  <div className={`flex items-center gap-3 border-b pb-3 transition-colors duration-200 ${focused==='name'?'border-red-500':'border-white/15 hover:border-white/25'}`}>
                    <div className={`flex-shrink-0 transition-colors ${focused==='name'?'text-red-400':'text-gray-500'}`}>
                      <AnimatePresence mode="wait">
                        {initials ? (
                          <motion.div key="init" initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }} transition={{ type:'spring', stiffness:300 }}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-[10px] font-bold">
                            {initials}
                          </motion.div>
                        ) : (
                          <motion.div key="ico" initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}>
                            <User className="w-4 h-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <input type="text" value={form.full_name} onChange={set('full_name')}
                      onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                      placeholder={t('common.fullName')}
                      className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm py-1" />
                  </div>

                  {/* role */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { role:'TRAINEE', Icon:GraduationCap, label:t('common.student') },
                      { role:'TRAINER', Icon:Users,         label:t('common.trainer') },
                    ].map(({ role, Icon, label }) => (
                      <motion.button key={role} type="button"
                        whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }}
                        onClick={() => setForm(p => ({ ...p, role }))}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          form.role === role
                            ? 'border-red-500 bg-red-600/10 shadow-[0_0_20px_rgba(220,38,38,0.15)]'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                        }`}
                      >
                        <AnimatePresence>
                          {form.role === role && (
                            <motion.div layoutId="rc" initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
                              className="absolute top-2 right-2">
                              <CheckCircle className="w-3.5 h-3.5 text-red-500" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className={`p-2.5 rounded-xl ${form.role===role?'bg-gradient-to-br from-red-500 to-red-700':'bg-white/[0.06]'}`}>
                          <Icon className={`w-5 h-5 ${form.role===role?'text-white':'text-gray-500'}`} />
                        </div>
                        <span className={`text-xs font-bold ${form.role===role?'text-white':'text-gray-500'}`}>{label}</span>
                      </motion.button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {form.role === 'TRAINER' && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                        <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-300/80">{t('auth.trainerValidationInfo')}</p>
                        </div>
                      </motion.div>
                    )}
                    {error && (
                      <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="text-xs text-red-400">{error}</motion.p>
                    )}
                  </AnimatePresence>

                  <ContinueBtn onClick={next} />
                </motion.div>
              )}

              {/* STEP 1: Access */}
              {step === 1 && (
                <motion.div key="s1" custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
                  transition={{ duration:.3, ease:[0.22,1,0.36,1] }} className="space-y-5">

                  <LineInput type="email" placeholder="Email" value={form.email} onChange={set('email')}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} focused={focused==='email'}
                    icon={<Mail className="w-4 h-4" />} />

                  <div className="space-y-2">
                    <LineInput type={showPw?'text':'password'} placeholder={t('auth.password')} value={form.password} onChange={set('password')}
                      onFocus={() => setFocused('pw')} onBlur={() => setFocused(null)} focused={focused==='pw'}
                      icon={<Lock className="w-4 h-4" />}
                      right={
                        <button type="button" onClick={() => setShowPw(v=>!v)} className="text-gray-600 hover:text-gray-400 flex-shrink-0">
                          {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      }
                    />
                    {form.password && (
                      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-1">
                        <div className="flex gap-1">
                          {[0,1,2,3,4].map(i => (
                            <motion.div key={i} animate={{ background: i < strength.score ? strength.color : '#1f2937' }}
                              transition={{ duration:.3 }} className="flex-1 h-1 rounded-full" />
                          ))}
                        </div>
                        {strength.label && <p className="text-[10px] font-medium" style={{ color: strength.color }}>{strength.label}</p>}
                      </motion.div>
                    )}
                  </div>

                  <LineInput type={showCPw?'text':'password'} placeholder={t('auth.confirmPassword')} value={form.confirmPassword} onChange={set('confirmPassword')}
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

                  <ContinueBtn onClick={next} />
                </motion.div>
              )}

              {/* STEP 2: Confirm */}
              {step === 2 && (
                <motion.div key="s2" custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
                  transition={{ duration:.3, ease:[0.22,1,0.36,1] }} className="space-y-5">

                  {/* summary */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                    <motion.div initial={{ scale:0, rotate:-20 }} animate={{ scale:1, rotate:0 }}
                      transition={{ type:'spring', stiffness:200 }}
                      className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-red-600/25 flex-shrink-0">
                      {initials || <UserPlus className="w-5 h-5" />}
                    </motion.div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{form.full_name}</p>
                      <p className="text-gray-500 text-xs truncate">{form.email}</p>
                    </div>
                    <span className={`ml-auto flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      form.role === 'TRAINER' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {form.role === 'TRAINER' ? t('common.trainer') : t('common.student')}
                    </span>
                  </div>

                  {[
                    { l:'Email', v: form.email },
                    { l:'Password', v: '••••••••' },
                  ].map(({ l, v }) => (
                    <div key={l} className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <span className="text-gray-500 text-xs">{l}</span>
                      <span className="text-gray-300 text-xs font-medium">{v}</span>
                    </div>
                  ))}

                  <AnimatePresence>
                    {error && <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="text-xs text-red-400">{error}</motion.p>}
                    {success && <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="text-xs text-emerald-400">{success}</motion.p>}
                  </AnimatePresence>

                  <motion.button type="button" onClick={submit} disabled={loading}
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
                        <UserPlus className="w-4 h-4 relative" />
                        <span className="relative">{t('auth.register')}</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-gray-700">{t('auth.alreadyHaveAccount')}</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <motion.button type="button" onClick={() => navigate('/login')}
            whileHover={{ scale:1.02 }} whileTap={{ scale:.98 }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/[0.08] text-sm font-semibold text-gray-400 hover:bg-white/[0.04] hover:border-white/[0.15] transition-all"
          >
            <LogIn className="w-4 h-4" />
            {t('auth.login')} <span className="text-red-500 font-bold ml-1">→</span>
          </motion.button>
        </div>
      </motion.div>

      <p className={`relative z-10 text-center text-xs mt-8 ${isDark?'text-gray-800':'text-gray-400'}`}>
        {t('common.appName')} © 2026 · Trade Data Hub
      </p>
    </div>
  );
}

function ContinueBtn({ onClick }: { onClick: () => void }) {
  return (
    <motion.button type="button" onClick={onClick}
      whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:.98 }}
      className="relative w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm overflow-hidden group"
      style={{ background:'linear-gradient(135deg,#dc2626 0%,#b91c1c 60%,#991b1b 100%)' }}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
      <span className="absolute inset-0 rounded-2xl shadow-[0_8px_28px_rgba(220,38,38,0.35)] group-hover:shadow-[0_12px_36px_rgba(220,38,38,0.5)] transition-shadow pointer-events-none" />
      <span className="relative">Continuar</span>
      <svg className="w-4 h-4 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}
