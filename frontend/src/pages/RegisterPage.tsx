import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import {
  UserPlus, Mail, Lock, User, Eye, EyeOff, CheckCircle, LogIn,
  Sparkles, Crown, BookOpen, Shield, KeyRound,
  ArrowRight, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingNavbar from '../components/landing/LandingNavbar';

/* ═══════════════════════════════════════════════════════════════════
   Mesh Gradient Background (matching LoginPage)
   ═══════════════════════════════════════════════════════════════════ */
function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const blobs = [
      { x: 0.2, y: 0.3, r: 350, color: [220, 38, 38], speed: 0.0003 },
      { x: 0.8, y: 0.7, r: 300, color: [124, 58, 237], speed: 0.0004 },
      { x: 0.5, y: 0.2, r: 250, color: [8, 145, 178], speed: 0.0005 },
      { x: 0.3, y: 0.8, r: 200, color: [220, 38, 38], speed: 0.0002 },
    ];

    const draw = () => {
      timeRef.current += 1;
      const t = timeRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const b of blobs) {
        const bx = (b.x + Math.sin(t * b.speed) * 0.15 + (mouseRef.current.x - 0.5) * 0.05) * canvas.width;
        const by = (b.y + Math.cos(t * b.speed * 1.3) * 0.12 + (mouseRef.current.y - 0.5) * 0.05) * canvas.height;
        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
        grd.addColorStop(0, `rgba(${b.color.join(',')}, 0.08)`);
        grd.addColorStop(1, `rgba(${b.color.join(',')}, 0)`);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener('mousemove', onMove);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
}

/* ═══════════════════════════════════════════════════════════════════
   Noise Texture Overlay
   ═══════════════════════════════════════════════════════════════════ */
function NoiseOverlay() {
  return (
    <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }}
    />
  );
}



/* ═══════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════ */
function pwStrength(pw: string, t: (key: string) => string) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: t('auth.pwStrength.veryWeak'), color: '#ef4444' },
    { label: t('auth.pwStrength.weak'), color: '#f97316' },
    { label: t('auth.pwStrength.fair'), color: '#eab308' },
    { label: t('auth.pwStrength.strong'), color: '#22c55e' },
    { label: t('auth.pwStrength.veryStrong'), color: '#10b981' },
  ];
  return { score: s, ...map[Math.min(s, 4)] };
}

const CAPABILITIES = [
  { key: 'is_trainer' as const, Icon: BookOpen, labelKey: 'auth.roles.trainer', descKey: 'auth.roles.trainerDesc', gradient: 'from-blue-500 to-indigo-600', glow: 'rgba(59,130,246,0.3)' },
  { key: 'is_tutor' as const, Icon: Shield, labelKey: 'auth.roles.tutor', descKey: 'auth.roles.tutorDesc', gradient: 'from-red-500 to-rose-600', glow: 'rgba(239,68,68,0.3)' },
  { key: 'is_liberador' as const, Icon: KeyRound, labelKey: 'auth.roles.releaser', descKey: 'auth.roles.releaserDesc', gradient: 'from-cyan-500 to-teal-600', glow: 'rgba(6,182,212,0.3)' },
  { key: 'is_manager' as const, Icon: Crown, labelKey: 'auth.roles.teamLead', descKey: 'auth.roles.teamLeadDesc', gradient: 'from-purple-500 to-violet-600', glow: 'rgba(139,92,246,0.3)' },
];

const slideV = {
  enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0, scale: 0.95 }),
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/* ═══════════════════════════════════════════════════════════════════
   Input Component (matching LoginPage)
   ═══════════════════════════════════════════════════════════════════ */
function FloatInput({ type = 'text', placeholder, value, onChange, icon, right, autoFocus, label }: {
  type?: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode; right?: React.ReactNode; autoFocus?: boolean; label?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <label className="text-[10px] font-bold text-white/25 uppercase tracking-[0.12em] mb-2 block">{label}</label>}
      <div className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300 ${
        focused
          ? 'border-red-500/50 bg-white/[0.06] shadow-[0_0_0_4px_rgba(220,38,38,0.08)]'
          : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.15] hover:bg-white/[0.04]'
      }`}>
        <div className={`flex-shrink-0 transition-colors duration-200 ${focused ? 'text-red-400' : 'text-white/25'}`}>
          {icon}
        </div>
        <input
          type={type} value={value} onChange={onChange} autoFocus={autoFocus}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-white/20 outline-none text-[15px] font-medium"
        />
        {right}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Brand Panel — Left side
   ═══════════════════════════════════════════════════════════════════ */
function BrandPanel({ step, t }: { step: number; t: (key: string) => string }) {
  const STEP_TITLES = [
    { title: t('auth.steps.identity'), sub: t('auth.steps.identitySub') },
    { title: t('auth.steps.credentials'), sub: t('auth.steps.credentialsSub') },
    { title: t('auth.steps.confirmation'), sub: t('auth.steps.confirmationSub') },
  ];
  return (
    <div className="hidden lg:flex flex-col justify-between p-14 relative">
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="absolute -right-20 top-1/2 -translate-y-1/2 text-[28rem] font-black text-white/[0.015] leading-none select-none pointer-events-none">
        +
      </div>

      <div className="relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-8">
            <Zap className="w-3 h-3 text-red-400" />
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">{t('auth.brandPanel.registerBadge')}</span>
          </div>

          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] tracking-tight">
            {t('auth.brandPanel.registerTitle1')}<br />
            <span className="bg-gradient-to-r from-red-500 via-red-400 to-orange-400 bg-clip-text text-transparent">{t('auth.brandPanel.registerHighlight')}</span> {t('auth.brandPanel.registerTitle2')}
          </h1>

          <p className="mt-6 text-white/30 text-base leading-relaxed max-w-md">
            {t('auth.brandPanel.registerDesc')}
          </p>
        </motion.div>
      </div>

      {/* Step indicator */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mt-auto pt-8">
        <div className="flex items-center gap-4 mb-6">
          {[0, 1, 2].map(i => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    scale: i === step ? 1.1 : 1,
                    background: i < step ? '#22c55e' : i === step ? '#dc2626' : 'rgba(255,255,255,0.08)',
                    boxShadow: i === step ? '0 0 20px rgba(220,38,38,0.4)' : 'none',
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white">
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </motion.div>
                <div className="hidden xl:block">
                  <p className={`text-xs font-bold ${i <= step ? 'text-white/70' : 'text-white/20'}`}>{STEP_TITLES[i].title}</p>
                  <p className="text-[10px] text-white/15">{STEP_TITLES[i].sub.split('.')[0]}</p>
                </div>
              </div>
              {i < 2 && (
                <motion.div
                  animate={{ background: i < step ? '#22c55e' : 'rgba(255,255,255,0.06)' }}
                  className="flex-1 h-px rounded-full hidden xl:block"
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="h-px bg-gradient-to-r from-red-500/30 via-white/10 to-transparent" />
        <p className="mt-4 text-[11px] text-white/15 font-medium">
          {t('auth.copyrightFull')}
        </p>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Celebration (canvas confetti)
   ═══════════════════════════════════════════════════════════════════ */
function Celebration() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = canvas.parentElement?.clientHeight || 600;

    const colors = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
    const pieces: { x: number; y: number; vx: number; vy: number; r: number; c: string; rot: number; vr: number; life: number }[] = [];

    for (let i = 0; i < 60; i++) {
      pieces.push({
        x: canvas.width / 2, y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10 - 3,
        r: Math.random() * 5 + 2, c: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360, vr: (Math.random() - 0.5) * 10, life: 1,
      });
    }

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.rot += p.vr; p.life -= 0.008;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />;
}

/* ═══════════════════════════════════════════════════════════════════
   REGISTER PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);

  const STEP_TITLES = [
    { title: t('auth.steps.identity'), sub: t('auth.steps.identitySub') },
    { title: t('auth.steps.credentials'), sub: t('auth.steps.credentialsSub') },
    { title: t('auth.steps.confirmation'), sub: t('auth.steps.confirmationSub') },
  ];

  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirmPassword: '', is_trainer: false, is_tutor: false, is_liberador: false, is_manager: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setError('');
  };

  const strength = pwStrength(form.password, t);
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
      const role = form.is_manager ? 'MANAGER' : 'TRAINEE';
      const res = await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role,
        is_trainer: form.is_trainer,
        is_tutor: form.is_tutor,
        is_liberador: form.is_liberador,
      });
      if (res.data) {
        const isPending = form.is_manager || form.is_trainer || form.is_tutor || form.is_liberador;
        setSuccess(isPending ? t('auth.registerTrainerSuccess') : t('auth.registerStudentSuccess'));
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.registrationError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] relative overflow-hidden">
      <MeshBackground />
      <NoiseOverlay />
      <LandingNavbar minimal />

      <div className="relative z-10 min-h-screen flex items-stretch">
        {/* LEFT: Brand Panel */}
        <div className="hidden lg:flex lg:w-[50%]">
          <BrandPanel step={step} t={t} />
        </div>

        {/* Vertical divider */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

        {/* RIGHT: Registration Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[440px]">

            {/* Mobile brand */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:hidden flex items-center gap-2.5 mb-8">
              <img src="/logo-sds.png" alt="SDS" className="h-8 w-auto" />
              <span className="text-base font-black text-white/80">
                Trade<span className="text-red-500">Data</span>Hub
              </span>
            </motion.div>

            {/* Header with step dots + back */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}>
              <div className="flex items-center justify-between mb-4">
                <motion.button whileHover={{ x: -3 }} onClick={step === 0 ? () => navigate('/login') : back}
                  className="flex items-center gap-1 text-sm font-medium text-white/25 hover:text-white/60 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>{step === 0 ? t('auth.login') : t('auth.back')}</span>
                </motion.button>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      animate={{
                        width: i === step ? 24 : 8,
                        background: i < step ? '#22c55e' : i === step ? '#dc2626' : 'rgba(255,255,255,0.08)',
                      }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="h-2 rounded-full"
                    />
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                  transition={{ duration: 0.3 }}>
                  <p className="text-white/30 text-sm font-medium mb-1">{STEP_TITLES[step].sub}</p>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                    {STEP_TITLES[step].title}<span className="text-red-500">.</span>
                  </h2>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Form body */}
            <div className="mt-8 relative" style={{ minHeight: 360 }}>
              {success && <Celebration />}

              <AnimatePresence custom={dir} mode="wait">

                {/* ── STEP 0: Profile + Capabilities ────────────── */}
                {step === 0 && (
                  <motion.div key="s0" custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">

                      {/* Name with live initials */}
                      <motion.div variants={fadeUp}>
                        <div className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300 border-white/[0.08] bg-white/[0.025] hover:border-white/[0.15] hover:bg-white/[0.04] focus-within:border-red-500/50 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_4px_rgba(220,38,38,0.08)]`}>
                          <AnimatePresence mode="wait">
                            {initials ? (
                              <motion.div key="init" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-red-600/25 flex-shrink-0">
                                {initials}
                              </motion.div>
                            ) : (
                              <motion.div key="ico" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                className="flex-shrink-0 text-white/25">
                                <User className="w-[18px] h-[18px]" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <input type="text" value={form.full_name} onChange={set('full_name')} autoFocus
                            placeholder={t('common.fullName')}
                            className="flex-1 bg-transparent text-white placeholder-white/20 outline-none text-[15px] font-medium" />
                        </div>
                      </motion.div>

                      {/* Default role */}
                      <motion.div variants={fadeUp}>
                        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <p className="text-[11px] text-emerald-400/70 font-medium">{t('auth.baseRole')} <span className="text-emerald-300 font-bold">{t('auth.roles.recorder')}</span> — {t('auth.automatic')}</p>
                        </div>
                      </motion.div>

                      {/* Capabilities */}
                      <motion.div variants={fadeUp}>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.12em] mb-1.5">{t('auth.additionalSkills')}</p>
                        <p className="text-[10px] text-white/15 mb-3">{t('auth.additionalSkillsSub')}</p>
                        <div className="space-y-2">
                          {CAPABILITIES.map(({ key, Icon, labelKey, descKey, gradient, glow }, idx) => {
                            const active = form[key];
                            return (
                              <motion.button key={key} type="button"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ scale: 1.015, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                                className={`relative w-full flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                                  active
                                    ? 'border-red-500/40 bg-red-600/[0.06]'
                                    : 'border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.03]'
                                }`}
                                style={active ? { boxShadow: `0 0 30px ${glow}` } : {}}
                              >
                                <div className={`p-2.5 rounded-xl flex-shrink-0 transition-all duration-300 ${active ? `bg-gradient-to-br ${gradient} shadow-lg` : 'bg-white/[0.04]'}`}>
                                  <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-white/30'}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-bold leading-tight transition-colors ${active ? 'text-white' : 'text-white/40'}`}>{t(labelKey)}</p>
                                  <p className={`text-[10px] mt-0.5 leading-snug transition-colors ${active ? 'text-white/40' : 'text-white/15'}`}>{t(descKey)}</p>
                                </div>
                                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                                  active ? 'border-red-500 bg-red-500 scale-110' : 'border-white/15 bg-transparent'
                                }`}>
                                  <AnimatePresence>
                                    {active && (
                                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400 }}>
                                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>

                      <AnimatePresence>
                        {(form.is_trainer || form.is_tutor || form.is_manager) && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            <div className="flex gap-2 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                              <p className="text-[11px] text-amber-300/70">{t('auth.specialSkillsWarning')}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400">{error}</motion.p>}

                      <motion.div variants={fadeUp}>
                        <motion.button type="button" onClick={next}
                          whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.985 }}
                          className="relative w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-[15px] overflow-hidden group cursor-pointer"
                          style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ boxShadow: '0 12px 40px rgba(220,38,38,0.4)' }} />
                          <span className="relative">{t('auth.continue')}</span>
                          <ArrowRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}

                {/* ── STEP 1: Credentials ──────────────────────── */}
                {step === 1 && (
                  <motion.div key="s1" custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">

                      <motion.div variants={fadeUp}>
                        <FloatInput
                          type="email" placeholder={t('auth.emailPlaceholder')} value={form.email}
                          onChange={set('email')} label={t('auth.email')} autoFocus
                          icon={<Mail className="w-[18px] h-[18px]" />}
                        />
                      </motion.div>

                      <motion.div variants={fadeUp}>
                        <FloatInput
                          type={showPw ? 'text' : 'password'} placeholder={t('auth.password')} value={form.password}
                          onChange={set('password')} label={t('auth.password')}
                          icon={<Lock className="w-[18px] h-[18px]" />}
                          right={
                            <button type="button" onClick={() => setShowPw(v => !v)}
                              className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0 p-0.5">
                              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          }
                        />
                        {form.password && (
                          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2.5 space-y-1.5">
                            <div className="flex gap-1">
                              {[0, 1, 2, 3, 4].map(i => (
                                <motion.div key={i}
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1, background: i < strength.score ? strength.color : 'rgba(255,255,255,0.06)' }}
                                  transition={{ duration: 0.3, delay: i * 0.05 }}
                                  className="flex-1 h-1 rounded-full origin-left" />
                              ))}
                            </div>
                            {strength.label && <p className="text-[10px] font-semibold" style={{ color: strength.color }}>{strength.label}</p>}
                          </motion.div>
                        )}
                      </motion.div>

                      <motion.div variants={fadeUp}>
                        <FloatInput
                          type={showCPw ? 'text' : 'password'} placeholder={t('auth.confirmPassword')} value={form.confirmPassword}
                          onChange={set('confirmPassword')} label={t('auth.confirmPassword')}
                          icon={<Lock className="w-[18px] h-[18px]" />}
                          right={
                            <button type="button" onClick={() => setShowCPw(v => !v)}
                              className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0 p-0.5">
                              {showCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          }
                        />
                        {form.confirmPassword && form.password === form.confirmPassword && (
                          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5 mt-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 font-medium">{t('auth.passwordsMatch')}</span>
                          </motion.div>
                        )}
                      </motion.div>

                      {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400">{error}</motion.p>}

                      <motion.div variants={fadeUp}>
                        <motion.button type="button" onClick={next}
                          whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.985 }}
                          className="relative w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-[15px] overflow-hidden group cursor-pointer"
                          style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ boxShadow: '0 12px 40px rgba(220,38,38,0.4)' }} />
                          <span className="relative">{t('auth.continue')}</span>
                          <ArrowRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}

                {/* ── STEP 2: Confirmation ─────────────────────── */}
                {step === 2 && (
                  <motion.div key="s2" custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">

                      {/* Profile card */}
                      <motion.div variants={fadeUp}
                        className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-600/30 flex-shrink-0 relative">
                          {initials || <UserPlus className="w-6 h-6" />}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#050508] flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        </motion.div>
                        <div className="min-w-0">
                          <p className="text-white font-bold text-base truncate">{form.full_name}</p>
                          <p className="text-white/25 text-xs truncate mt-0.5">{form.email}</p>
                        </div>
                      </motion.div>

                      {/* Role badges */}
                      <motion.div variants={fadeUp} className="flex flex-wrap gap-1.5">
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                          {t('auth.roles.recorder')}
                        </span>
                        {form.is_trainer && <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/15">{t('auth.roles.trainer')}</span>}
                        {form.is_tutor && <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/15">{t('auth.roles.tutor')}</span>}
                        {form.is_liberador && <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">{t('auth.roles.releaser')}</span>}
                        {form.is_manager && <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/15">{t('auth.roles.teamLead')}</span>}
                      </motion.div>

                      {/* Summary rows */}
                      {[
                        { l: t('auth.email'), v: form.email },
                        { l: t('auth.password'), v: '••••••••' },
                        { l: t('auth.baseRoleLabel'), v: t('auth.roles.recorder') },
                      ].map(({ l, v }) => (
                        <motion.div key={l} variants={fadeUp}
                          className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                          <span className="text-white/20 text-xs">{l}</span>
                          <span className="text-white/50 text-xs font-medium">{v}</span>
                        </motion.div>
                      ))}

                      <AnimatePresence>
                        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-red-400">{error}</motion.p>}
                        {success && (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/15">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <p className="text-xs text-emerald-300 font-medium">{success}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.div variants={fadeUp}>
                        <motion.button type="button" onClick={submit} disabled={loading}
                          whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.985 }}
                          className="relative w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-[15px] overflow-hidden disabled:opacity-50 group cursor-pointer"
                          style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ boxShadow: '0 12px 40px rgba(220,38,38,0.4)' }} />
                          {loading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                          ) : (
                            <span className="relative flex items-center gap-2.5">
                              <UserPlus className="w-[18px] h-[18px]" />
                              <span>{t('auth.register')}</span>
                            </span>
                          )}
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Login link */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-white/15 font-medium uppercase tracking-wider">{t('auth.alreadyHaveAccount')}</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </motion.div>

            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              type="button" onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-white/[0.06] text-sm font-semibold text-white/30 hover:text-white/60 hover:bg-white/[0.03] hover:border-white/[0.12] transition-all duration-300 group cursor-pointer">
              <LogIn className="w-4 h-4" />
              <span>{t('auth.login')}</span>
              <span className="text-red-500 font-bold">→</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </motion.button>

            <p className="lg:hidden text-center text-[11px] text-white/10 mt-10">
              {t('auth.copyright')}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
