import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  motion, useScroll, AnimatePresence,
  useMotionValue, useMotionTemplate, useInView as useMotionInView,
} from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';
import {
  ArrowRight, Users, BookOpen, Target, TrendingUp, Globe,
  CheckCircle, Zap, Shield, Award, BarChart3, Sparkles,
  Star, Briefcase, GraduationCap, Trophy, Rocket,
  Menu, X, LogIn, UserPlus, Moon, Sun,
  ChevronDown, Layers, FileText, type LucideIcon,
} from 'lucide-react';

const fetchKPIs = async () => {
  const { data } = await axios.get('/api/stats/kpis');
  return data;
};

/* ─── Animated Counter ────────────────────────────────────────── */
const AnimatedCounter = ({ end, duration = 2.5, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });
  useEffect(() => {
    if (!inView) return;
    let start: number; let raf: number;
    const ease = (t: number) => 1 - Math.pow(1 - t, 4);
    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      setCount(Math.floor(end * ease(p)));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
};

/* ─── Text Reveal ─────────────────────────────────────────────── */
const TextReveal = ({ children, className = '', delay = 0 }: { children: string; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useMotionInView(ref, { once: true, margin: '-10%' });
  return (
    <span ref={ref} className={className}>
      {children.split(' ').map((word, wi) => (
        <span key={wi} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: '120%', rotateX: 90 }}
            animate={isInView ? { y: 0, rotateX: 0 } : {}}
            transition={{ duration: 0.7, delay: delay + wi * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >{word}</motion.span>
        </span>
      ))}
    </span>
  );
};

/* ─── Gradient Button ─────────────────────────────────────────── */
const GradientButton = ({
  children, onClick, className = '', variant = 'primary', isDark = true,
}: { children: React.ReactNode; onClick?: () => void; className?: string; variant?: 'primary' | 'secondary' | 'ghost'; isDark?: boolean }) => {
  if (variant === 'secondary') {
    return (
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onClick}
        className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
          isDark
            ? 'bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-md border border-white/15 hover:border-white/30 text-white'
            : 'bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 text-gray-700 shadow-sm'
        } ${className}`}
      >{children}</motion.button>
    );
  }
  return (
    <motion.button
      whileHover={{ scale: 1.04, filter: 'brightness(1.12)' }} whileTap={{ scale: 0.96 }} onClick={onClick}
      className={`relative px-6 py-3 rounded-2xl font-bold text-white overflow-hidden
        bg-gradient-to-r from-orange-500 via-red-500 to-purple-600
        shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow duration-300 ${className}`}
    >{children}</motion.button>
  );
};

/* ─── Spotlight Card ──────────────────────────────────────────── */
const SpotlightCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - r.left);
    mouseY.set(e.clientY - r.top);
  }, [mouseX, mouseY]);
  const spotlight = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, rgba(249,115,22,0.09), transparent 80%)`;
  return (
    <motion.div ref={ref} onMouseMove={handleMouseMove} className={`relative group ${className}`}>
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: spotlight }}
      />
      {children}
    </motion.div>
  );
};

/* ─── Marquee ─────────────────────────────────────────────────── */
const Marquee = ({ children, speed = 30 }: { children: React.ReactNode; speed?: number }) => (
  <div className="relative overflow-hidden">
    <motion.div
      className="flex gap-8 w-max"
      animate={{ x: ['-50%', '0%'] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
    >{children}{children}</motion.div>
  </div>
);

/* ─── Blob Background ─────────────────────────────────────────── */
const BlobBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      animate={{ x: [0, 50, 0], y: [0, -35, 0] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute -top-[25%] -left-[15%] w-[750px] h-[750px] rounded-full bg-orange-500/[0.055] blur-[140px]"
    />
    <motion.div
      animate={{ x: [0, -60, 0], y: [0, 45, 0] }}
      transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      className="absolute top-[8%] right-[-18%] w-[700px] h-[700px] rounded-full bg-purple-600/[0.065] blur-[150px]"
    />
    <motion.div
      animate={{ x: [0, 35, 0], y: [0, -25, 0] }}
      transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut', delay: 10 }}
      className="absolute bottom-[-12%] left-[18%] w-[600px] h-[600px] rounded-full bg-red-600/[0.045] blur-[130px]"
    />
    <motion.div
      animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
      transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 15 }}
      className="absolute bottom-[18%] right-[8%] w-[500px] h-[500px] rounded-full bg-teal-500/[0.04] blur-[120px]"
    />
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function PremiumLandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === null || saved === 'dark';
  });
  const { scrollYProgress } = useScroll();

  const { data: kpis } = useQuery({
    queryKey: ['kpis'],
    queryFn: fetchKPIs,
    staleTime: 5 * 60 * 1000,
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const toggleLanguage = async () => {
    const langs = ['pt-PT', 'en', 'es'];
    const idx = langs.indexOf(i18n.language);
    const next = langs[(idx + 1) % langs.length];
    await i18n.changeLanguage(next);
    localStorage.setItem('language', next);
    setCurrentLang(next);
  };

  useEffect(() => {
    const fn = (lng: string) => setCurrentLang(lng);
    i18n.on('languageChanged', fn);
    return () => { i18n.off('languageChanged', fn); };
  }, [i18n]);

  const langLabel: Record<string, string> = { 'pt-PT': 'PT', en: 'EN', es: 'ES' };

  /* ── Feature cards ─────────────────────────────────────────── */
  const features: { icon: LucideIcon; titleKey: string; descKey: string; gradient: string; glow: string }[] = [
    { icon: Rocket,    titleKey: 'featureCreditosImportacao',  descKey: 'featureCreditosImportacaoDesc',  gradient: 'from-orange-500 to-red-500',    glow: 'rgba(249,115,22,0.15)' },
    { icon: Globe,     titleKey: 'featureRemessasImportacao',  descKey: 'featureRemessasImportacaoDesc',  gradient: 'from-blue-500 to-cyan-400',     glow: 'rgba(59,130,246,0.15)' },
    { icon: TrendingUp,titleKey: 'featureRemessasExportacao',  descKey: 'featureRemessasExportacaoDesc',  gradient: 'from-purple-500 to-pink-500',   glow: 'rgba(168,85,247,0.15)' },
    { icon: Shield,    titleKey: 'featureGarantiasEmitidas',   descKey: 'featureGarantiasEmitidasDesc',   gradient: 'from-teal-400 to-cyan-500',     glow: 'rgba(20,184,166,0.15)' },
    { icon: Award,     titleKey: 'featureGarantiasRecebidas',  descKey: 'featureGarantiasRecebidasDesc',  gradient: 'from-emerald-400 to-green-500', glow: 'rgba(52,211,153,0.15)' },
    { icon: Briefcase, titleKey: 'featureOrdensPagamento',     descKey: 'featureOrdensPagamentoDesc',     gradient: 'from-amber-400 to-orange-500',  glow: 'rgba(251,191,36,0.15)' },
    { icon: BarChart3, titleKey: 'featureEurocobros',          descKey: 'featureEurocobrosDesc',          gradient: 'from-indigo-500 to-violet-500', glow: 'rgba(99,102,241,0.15)' },
  ];

  /* ── Stats ─────────────────────────────────────────────────── */
  const stats: { icon: LucideIcon; label: string; value: number; suffix?: string; gradient: string }[] = [
    { icon: Users,     label: t('landing.statsUsers'),      value: kpis?.users?.total || 0,                                       gradient: 'from-orange-500 to-red-500' },
    { icon: BookOpen,  label: t('landing.statsCourses'),    value: kpis?.content?.courses || 0,                                   gradient: 'from-purple-500 to-violet-600' },
    { icon: Target,    label: t('landing.statsPlans'),      value: kpis?.content?.training_plans || 0,                            gradient: 'from-teal-400 to-cyan-500' },
    { icon: TrendingUp,label: t('landing.statsCompletion'), value: Math.round(kpis?.engagement?.completion_rate || 0), suffix: '%', gradient: 'from-emerald-400 to-green-500' },
  ];

  /* ── Journey ───────────────────────────────────────────────── */
  const journeySteps = [
    { icon: UserPlus,  titleKey: 'journeyStep1', descKey: 'journeyStep1Desc', num: '01', color: 'from-orange-500 to-red-500' },
    { icon: BookOpen,  titleKey: 'journeyStep2', descKey: 'journeyStep2Desc', num: '02', color: 'from-purple-500 to-violet-500' },
    { icon: Target,    titleKey: 'journeyStep3', descKey: 'journeyStep3Desc', num: '03', color: 'from-teal-400 to-cyan-500' },
    { icon: Trophy,    titleKey: 'journeyStep4', descKey: 'journeyStep4Desc', num: '04', color: 'from-emerald-400 to-green-500' },
  ];

  /* ── Trust marquee ─────────────────────────────────────────── */
  const trustItems = [
    { icon: CheckCircle, text: t('landing.trustCertification') },
    { icon: Shield,      text: t('landing.trustSecure') },
    { icon: Star,        text: t('landing.trustRating') },
    { icon: Globe,       text: 'Trade Finance' },
    { icon: Zap,         text: 'Santander' },
    { icon: Award,       text: t('landing.feature2Title') },
  ];

  /* ── Dashboard preview mini-stats ─────────────────────────── */
  const previewStats: { icon: LucideIcon; label: string; value: number; suffix?: string; color: string }[] = [
    { icon: Users,     label: t('landing.miniStatsProfessionals'), value: kpis?.users?.total || 0,                                       color: 'from-orange-500 to-red-500' },
    { icon: BookOpen,  label: t('landing.miniStatsCourses'),       value: kpis?.content?.courses || 0,                                   color: 'from-purple-500 to-violet-600' },
    { icon: Trophy,    label: t('landing.miniStatsCertificates'),  value: kpis?.engagement?.completed || 0,                              color: 'from-teal-400 to-cyan-500' },
    { icon: TrendingUp,label: t('landing.statsCompletion'),        value: Math.round(kpis?.engagement?.completion_rate || 0), suffix: '%', color: 'from-emerald-400 to-green-500' },
  ];

  return (
    <div className={`relative min-h-screen overflow-x-hidden transition-colors duration-700 ${
      isDark ? 'bg-[#000000] text-white' : 'bg-slate-50 text-gray-900'
    }`}>

      {/* Background blobs */}
      {isDark ? <BlobBackground /> : (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-orange-200/50 blur-[120px]" />
          <div className="absolute top-[15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-200/40 blur-[110px]" />
          <div className="absolute bottom-[-5%] left-[20%] w-[500px] h-[500px] rounded-full bg-teal-200/30 blur-[100px]" />
        </div>
      )}

      {/* Fine grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ opacity: isDark ? 0.04 : 0.025 }}>
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke={isDark ? '#fff' : '#000'} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ═══ NAVBAR ═══ */}
      <motion.nav
        initial={{ y: -100 }} animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isDark
            ? 'bg-black/75 backdrop-blur-2xl border-b border-white/[0.06]'
            : 'bg-white/80 backdrop-blur-2xl border-b border-gray-200/80 shadow-sm'
        }`}
      >
        {/* Progress bar */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[2px] origin-left"
          style={{
            scaleX: scrollYProgress,
            background: 'linear-gradient(90deg, #f97316, #ef4444, #a855f7)',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="cursor-pointer group" onClick={() => navigate('/')}>
              <img
                src="/logo-sds.png" alt="Santander"
                className={`h-9 w-auto transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(249,115,22,0.7)] ${isDark ? 'brightness-0 invert' : ''}`}
              />
            </motion.div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={toggleLanguage}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider transition-all border ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/70 hover:text-white'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600'
                }`}
              >{langLabel[currentLang] || 'PT'}</motion.button>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isDark
                    ? <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><Sun className="w-4 h-4 text-yellow-400" /></motion.div>
                    : <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><Moon className="w-4 h-4 text-blue-500" /></motion.div>
                  }
                </AnimatePresence>
              </motion.button>

              <div className={`w-px h-6 mx-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/login')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isDark ? 'text-white/70 hover:text-white hover:bg-white/[0.06]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <LogIn className="w-4 h-4" />{t('auth.login')}
              </motion.button>

              <GradientButton onClick={() => navigate('/register')} className="flex items-center gap-2 text-sm py-2.5">
                <UserPlus className="w-4 h-4" />
                {t('auth.register')}
                <ArrowRight className="w-3.5 h-3.5" />
              </GradientButton>
            </div>

            {/* Mobile menu toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
              }`}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen
                  ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-5 h-5" /></motion.div>
                  : <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Menu className="w-5 h-5" /></motion.div>
                }
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile panel */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className={`md:hidden border-t ${isDark ? 'border-white/5 bg-black/98' : 'border-gray-200 bg-white/98'} backdrop-blur-2xl`}
            >
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <motion.button onClick={toggleLanguage} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200'}`}>
                    {langLabel[currentLang] || 'PT'}
                  </motion.button>
                  <motion.button onClick={toggleTheme} className={`w-11 h-11 rounded-xl flex items-center justify-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                    {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-500" />}
                  </motion.button>
                </div>
                <button onClick={() => { navigate('/login'); setIsMenuOpen(false); }} className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-medium ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-900'}`}>
                  <LogIn className="w-5 h-5" />{t('auth.login')}
                </button>
                <button
                  onClick={() => { navigate('/register'); setIsMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 shadow-lg shadow-orange-500/20"
                >
                  <UserPlus className="w-5 h-5" />{t('auth.register')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ═══════════════════════════════════════════════════════════════
           HERO
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto w-full relative z-10 text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-md border ${
              isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-600'
            }`}>
              <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                <Sparkles className="w-4 h-4" />
              </motion.span>
              {t('landing.heroBadge')}
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.0] tracking-tight mb-8">
            <TextReveal
              className="bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent"
              delay={0.3}
            >
              {t('landing.heroTitle')}
            </TextReveal>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className={`text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10 ${isDark ? 'text-white/55' : 'text-gray-500'}`}
          >
            {t('landing.heroSubtitle')}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <GradientButton onClick={() => navigate('/register')} className="px-10 py-4 text-base flex items-center gap-2 shadow-2xl shadow-orange-500/20">
              {t('landing.getStarted')}<ArrowRight className="w-5 h-5" />
            </GradientButton>
            <GradientButton variant="secondary" isDark={isDark} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-10 py-4 text-base flex items-center gap-2">
              {t('landing.learnMore')}<ChevronDown className="w-4 h-4" />
            </GradientButton>
          </motion.div>

          {/* Trust badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-20">
            {[
              { icon: CheckCircle, text: t('landing.trustCertification'), color: 'text-emerald-400' },
              { icon: Shield,      text: t('landing.trustSecure'),        color: 'text-blue-400' },
              { icon: Star,        text: t('landing.trustRating'),        color: 'text-amber-400' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 + i * 0.15 }} className="flex items-center gap-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Product preview — browser mockup */}
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Glow halo behind card */}
            <div className="absolute inset-x-[5%] top-[10%] bottom-0 bg-gradient-to-r from-orange-500/15 via-purple-500/15 to-teal-500/15 blur-[80px] pointer-events-none rounded-full" />

            <div className={`relative rounded-2xl border overflow-hidden ${
              isDark
                ? 'bg-white/[0.025] border-white/[0.08] backdrop-blur-xl shadow-2xl'
                : 'bg-white border-gray-200 shadow-2xl'
            }`}>
              {/* Browser chrome bar */}
              <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className={`ml-2 flex-1 rounded-lg px-3 py-1 text-xs font-mono ${isDark ? 'bg-white/[0.04] text-white/25' : 'bg-white text-gray-400 border border-gray-200'}`}>
                  portal.tradedatahub.com/dashboard
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">Live</span>
                </div>
              </div>

              {/* Dashboard stats grid */}
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {previewStats.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className={`p-4 rounded-xl border transition-all cursor-default ${isDark ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]' : 'bg-gray-50 border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <AnimatedCounter end={s.value} suffix={s.suffix} />
                    </div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Mini bar chart */}
              <div className={`px-6 pb-6 flex items-end gap-1 h-20 ${isDark ? 'opacity-50' : 'opacity-35'}`}>
                {[35, 55, 42, 75, 50, 88, 62, 92, 70, 96, 82, 89, 74, 93].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ delay: 1.3 + i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 rounded-t-sm"
                    style={{ background: `hsl(${20 + i * 12}, 88%, 58%)` }}
                  />
                ))}
              </div>

              {/* Floating overlay badges */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute top-16 right-6 px-3 py-2 rounded-xl flex items-center gap-2 shadow-xl ${
                  isDark ? 'bg-[#0a0a0a]/90 border border-white/10 backdrop-blur-xl' : 'bg-white border border-gray-200 shadow-md'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>+12</div>
                  <div className={`text-[10px] ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('landing.miniStatsCertificates')}</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                className={`absolute bottom-10 left-6 px-3 py-2 rounded-xl flex items-center gap-2 shadow-xl ${
                  isDark ? 'bg-[#0a0a0a]/90 border border-white/10 backdrop-blur-xl' : 'bg-white border border-gray-200 shadow-md'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>▲ 24%</div>
                  <div className={`text-[10px] ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('landing.statsCompletion')}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
            className={`w-6 h-10 rounded-full border-2 flex items-start justify-center pt-2 ${isDark ? 'border-white/20' : 'border-gray-300'}`}>
            <motion.div animate={{ opacity: [1, 0], y: [0, 12] }} transition={{ duration: 2, repeat: Infinity }}
              className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/60' : 'bg-gray-400'}`} />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ TRUST MARQUEE ═══ */}
      <section className={`py-6 border-y ${isDark ? 'border-white/[0.04]' : 'border-gray-100'} overflow-hidden`}>
        <Marquee speed={40}>
          {trustItems.map((item, i) => (
            <div key={i} className={`flex items-center gap-2 px-6 ${isDark ? 'text-white/25' : 'text-gray-300'}`}>
              <item.icon className="w-4 h-4" />
              <span className="text-sm font-medium whitespace-nowrap">{item.text}</span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, idx) => (
              <SpotlightCard key={idx} className="h-full">
                <motion.div
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4 }}
                  className={`relative h-full text-center p-6 md:p-8 rounded-3xl border backdrop-blur-sm transition-all duration-300 ${
                    isDark
                      ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.14]'
                      : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-lg`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className={`text-4xl md:text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className={`text-sm font-medium mt-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{stat.label}</div>
                </motion.div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="relative py-28 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border backdrop-blur-md ${
                isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-600'
              }`}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-bold tracking-wide">{t('landing.servicesTag')}</span>
            </motion.div>

            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight">
              <TextReveal className="bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent">
                {t('landing.servicesTitle')}
              </TextReveal>
            </h2>

            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
              className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-white/45' : 'text-gray-500'}`}
            >
              {t('landing.servicesDesc').split('<1>')[0]}
              <span className="text-orange-500 font-semibold">Trade Finance</span>
              {t('landing.servicesDesc').includes('</1>') ? t('landing.servicesDesc').split('</1>')[1] : ''}
            </motion.p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {features.map((feat, idx) => {
              const isWide = idx === 0 || idx === features.length - 1;
              return (
                <SpotlightCard key={idx} className={isWide ? 'md:col-span-2 lg:col-span-2' : ''}>
                  <motion.div
                    initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ delay: idx * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -6 }}
                    className={`group relative h-full rounded-3xl border backdrop-blur-sm overflow-hidden transition-all duration-500 ${
                      isWide ? 'p-8 md:p-10' : 'p-7'
                    } ${
                      isDark
                        ? 'bg-white/[0.025] border-white/[0.06] hover:border-white/[0.15]'
                        : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-lg'
                    }`}
                  >
                    {/* Colored glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"
                      style={{ background: `radial-gradient(ellipse at top left, ${feat.glow}, transparent 70%)` }}
                    />
                    {/* Shine sweep */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden">
                      <motion.div
                        className="absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>

                    <div className="relative z-10 space-y-5">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: [-5, 5, 0] }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="relative inline-block"
                      >
                        <div className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${feat.gradient} shadow-lg ${isWide ? 'w-16 h-16' : 'w-14 h-14'}`}>
                          <feat.icon className={`text-white ${isWide ? 'w-8 h-8' : 'w-7 h-7'}`} />
                        </div>
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feat.gradient} blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
                      </motion.div>

                      <div>
                        <h3 className={`font-black mb-2 ${isWide ? 'text-2xl md:text-3xl' : 'text-xl'} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {t(`landing.${feat.titleKey}`)}
                        </h3>
                        <p className={`leading-relaxed ${isWide ? 'text-base' : 'text-sm'} ${isDark ? 'text-white/50 group-hover:text-white/70' : 'text-gray-500 group-hover:text-gray-700'} transition-colors duration-300`}>
                          {t(`landing.${feat.descKey}`)}
                        </p>
                      </div>

                      <div className={`flex items-center gap-2 text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-white/30 group-hover:text-orange-400' : 'text-gray-300 group-hover:text-orange-500'}`}>
                        <span>{t('landing.featureLearnMore')}</span>
                        <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ JOURNEY ═══ */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ type: 'spring', stiffness: 200 }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border backdrop-blur-md ${
                isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-600'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="text-sm font-bold tracking-wide">{t('landing.journeyTitle')}</span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
              <TextReveal className={`bg-gradient-to-r bg-clip-text text-transparent ${isDark ? 'from-white to-white/60' : 'from-gray-900 to-gray-600'}`}>
                {t('landing.journeyTitle')}
              </TextReveal>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {journeySteps.map((step, idx) => (
              <SpotlightCard key={idx}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: idx * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6 }}
                  className={`relative h-full p-7 rounded-3xl border backdrop-blur-sm transition-all duration-300 ${
                    isDark
                      ? 'bg-white/[0.025] border-white/[0.06] hover:border-white/[0.12]'
                      : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className={`text-6xl font-black mb-4 bg-gradient-to-br bg-clip-text text-transparent ${
                    isDark ? 'from-white/10 to-white/[0.03]' : 'from-gray-200 to-gray-100'
                  }`}>{step.num}</div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-lg`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t(`landing.${step.titleKey}`)}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-white/45' : 'text-gray-500'}`}>
                    {t(`landing.${step.descKey}`)}
                  </p>
                  {idx < journeySteps.length - 1 && (
                    <div className={`hidden lg:block absolute top-1/2 -right-3 w-6 h-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                  )}
                </motion.div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ type: 'spring', stiffness: 200 }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border backdrop-blur-md ${
                isDark ? 'bg-teal-500/10 border-teal-500/20 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-bold tracking-wide">FAQ</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black">
              <TextReveal className={`bg-gradient-to-r bg-clip-text text-transparent ${isDark ? 'from-white to-white/60' : 'from-gray-900 to-gray-600'}`}>
                {t('landing.faqTitle')}
              </TextReveal>
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { q: t('landing.faq1Q'), a: t('landing.faq1A') },
              { q: t('landing.faq2Q'), a: t('landing.faq2A') },
              { q: t('landing.faq3Q'), a: t('landing.faq3A') },
            ].map((faq, idx) => (
              <FAQItem key={idx} question={faq.q} answer={faq.a} isDark={isDark} delay={idx * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`relative p-10 md:p-16 rounded-[2rem] border overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-orange-600/[0.06] via-purple-600/[0.04] to-teal-600/[0.03] border-orange-500/[0.12]'
                : 'bg-gradient-to-br from-orange-50 via-red-50 to-purple-50 border-orange-200 shadow-2xl'
            }`}
          >
            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: `${Math.random() * 100}%`, y: `${Math.random() * 100}%`, scale: 0 }}
                  animate={{ y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`], scale: [0, 1, 0], opacity: [0, 0.4, 0] }}
                  transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{ background: ['#f97316', '#a855f7', '#14b8a6', '#ef4444', '#f59e0b'][i % 5] }}
                />
              ))}
            </div>

            <div className="relative z-10 text-center space-y-8">
              <motion.div
                initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl shadow-orange-500/30"
                style={{ background: 'linear-gradient(135deg, #f97316, #ef4444, #a855f7)' }}
              >
                <GraduationCap className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className={`text-3xl md:text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('landing.ctaTitle')}
              </h2>
              <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-white/55' : 'text-gray-500'}`}>
                {t('landing.ctaSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <GradientButton onClick={() => navigate('/register')} className="px-10 py-4 text-lg shadow-2xl shadow-orange-500/25">
                  {t('landing.ctaButton')}
                </GradientButton>
                <GradientButton variant="secondary" isDark={isDark} onClick={() => navigate('/login')} className="px-10 py-4 text-lg">
                  {t('auth.login')}
                </GradientButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className={`relative py-10 px-6 border-t ${isDark ? 'border-white/[0.05]' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo-sds.png" alt="Santander" className={`h-7 w-auto ${isDark ? 'brightness-0 invert opacity-40' : 'opacity-40'}`} />
            <span className={`text-sm ${isDark ? 'text-white/25' : 'text-gray-400'}`}>{t('landing.copyright')}</span>
          </div>
          <div className="flex items-center gap-6">
            {['pt-PT', 'en', 'es'].map((lang) => (
              <button
                key={lang}
                onClick={async () => { await i18n.changeLanguage(lang); localStorage.setItem('language', lang); setCurrentLang(lang); }}
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  currentLang === lang
                    ? isDark ? 'text-orange-400' : 'text-orange-500'
                    : isDark ? 'text-white/25 hover:text-white/50' : 'text-gray-300 hover:text-gray-500'
                }`}
              >{lang === 'pt-PT' ? 'PT' : lang.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── FAQ Item ────────────────────────────────────────────────── */
function FAQItem({ question, answer, isDark, delay = 0 }: { question: string; answer: string; isDark: boolean; delay?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
        isDark
          ? `bg-white/[0.02] ${open ? 'border-orange-500/20' : 'border-white/[0.06]'} hover:border-white/[0.1]`
          : `bg-white ${open ? 'border-orange-300' : 'border-gray-200'} hover:border-gray-300 shadow-sm`
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-5 md:p-6 text-left transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}
      >
        <span className={`font-bold pr-4 ${isDark ? 'text-white/90' : 'text-gray-900'}`}>{question}</span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.3 }}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
            open
              ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
              : isDark ? 'bg-white/[0.06] text-white/60' : 'bg-gray-100 text-gray-400'
          }`}
        >
          <span className="text-lg font-light leading-none">+</span>
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={`px-5 md:px-6 pb-5 md:pb-6 text-sm leading-relaxed ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
