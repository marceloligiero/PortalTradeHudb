import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';
import {
  ArrowRight,
  Users,
  BookOpen,
  Target,
  TrendingUp,
  Globe,
  CheckCircle,
  Zap,
  Shield,
  Award,
  BarChart3,
  Sparkles,
  ChevronRight,
  Star,
  Briefcase,
  GraduationCap,
  Trophy,
  Rocket,
  Menu,
  X,
  LogIn,
  UserPlus,
  Moon,
  Sun
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const fetchKPIs = async () => {
  const { data } = await axios.get(`${API_URL}/api/stats/kpis`);
  return data;
};

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  useEffect(() => {
    if (!inView) return;
    
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / (duration * 1000);

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [inView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// Magnetic Button Component
const MagneticButton = ({ children, onClick, className = '', variant = 'primary' }: any) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const variants = {
    primary: 'bg-gradient-to-r from-red-600 to-red-700 hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] text-white',
    secondary: 'bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 text-white',
    ghost: 'bg-transparent hover:bg-white/10 text-white/80 hover:text-white'
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default function PremiumLandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === null || saved === 'dark';
  });
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn: fetchKPIs,
    staleTime: 5 * 60 * 1000,
  });

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const toggleLanguage = async () => {
    const langs = ['pt-PT', 'en', 'es'];
    const currentIdx = langs.indexOf(i18n.language);
    const nextLang = langs[(currentIdx + 1) % langs.length];
    await i18n.changeLanguage(nextLang);
    localStorage.setItem('language', nextLang);
    setCurrentLang(nextLang);
  };

  useEffect(() => {
    const handleLanguageChange = (lng: string) => setCurrentLang(lng);
    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, [i18n]);

  // Animations Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${
      isDark 
        ? 'bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] text-white' 
        : 'bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900'
    }`}>
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(${isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)'} 1px, transparent 1px),
                           linear-gradient(90deg, ${isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)'} 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] ${
            isDark ? 'bg-red-600/10' : 'bg-red-600/5'
          }`}
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] ${
            isDark ? 'bg-blue-600/10' : 'bg-blue-600/5'
          }`}
        />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 backdrop-blur-2xl border-b shadow-2xl transition-all duration-500 ${
          isDark 
            ? 'bg-[#0a0a0a]/95 border-white/10 shadow-red-600/5' 
            : 'bg-white/95 border-gray-200 shadow-gray-200/50'
        }`}
      >
        {/* Scroll Progress Bar */}
        <motion.div
          style={{ scaleX: scrollYProgress }}
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 origin-left"
        />

        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer relative group"
              onClick={() => navigate('/')}
            >
              <img 
                src="/logo-sds.png"
                alt="Santander"
                className={`h-10 w-auto transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] ${
                  isDark ? 'filter brightness-0 invert' : ''
                }`}
              />
            </motion.div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`hidden md:flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 relative group ${
                  isDark 
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-yellow-400/50' 
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200 hover:border-blue-400/50'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isDark ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="w-5 h-5 text-yellow-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="w-5 h-5 text-blue-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div
                  className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity ${
                    isDark ? 'bg-yellow-400/20' : 'bg-blue-400/20'
                  }`}
                />
              </motion.button>

              {/* Login Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-medium text-white/80 hover:text-white hover:bg-white/10 border-white/10 hover:border-white/20"
              >
                <LogIn className="w-4 h-4" />
                <span className="text-sm">{t('auth.login')}</span>
              </motion.button>

              {/* Register Button - Magnetic */}
              <MagneticButton onClick={() => navigate('/register')} className="hidden md:flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span className="text-sm">{t('auth.register')}</span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.span>
              </MagneticButton>

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`lg:hidden border-t backdrop-blur-2xl ${
                isDark ? 'border-white/10 bg-[#0a0a0a]/98' : 'border-gray-200 bg-white/98'
              }`}
            >
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={{
                  open: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
                  closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
                }}
                className="px-6 py-6 space-y-3"
              >
                <motion.div
                  variants={{
                    open: { opacity: 1, x: 0 },
                    closed: { opacity: 0, x: -20 }
                  }}
                  className="space-y-3"
                >
                  <button
                    onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all font-medium ${
                      isDark 
                        ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-900'
                    }`}
                  >
                    <LogIn className="w-5 h-5" />
                    {t('auth.login')}
                  </button>
                  <button
                    onClick={() => { navigate('/register'); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-600/30 transition-all font-bold text-white"
                  >
                    <UserPlus className="w-5 h-5" />
                    {t('auth.register')}
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80&auto=format&fit=crop"
            alt="Trade Finance Background"
            className={`w-full h-full object-cover ${
              isDark ? 'opacity-10' : 'opacity-5'
            }`}
          />
          <div className={`absolute inset-0 ${
            isDark ? 'bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]' : 'bg-gradient-to-b from-gray-50 via-gray-50/95 to-gray-50'
          }`} />
        </div>
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              className="space-y-8"
            >
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-6"
              >
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-600/20">
                  <Sparkles className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-300">
                    Plataforma Nº1 em Trade Finance
                  </span>
                </motion.div>

                <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black leading-tight">
                  <span className={`bg-gradient-to-r bg-clip-text text-transparent ${
                    isDark ? 'from-white via-white to-white/60' : 'from-gray-900 via-gray-800 to-gray-700'
                  }`}>
                    {t('landing.heroTitle')}
                  </span>
                </motion.h1>

                <motion.p variants={fadeInUp} className={`text-xl leading-relaxed max-w-xl ${
                  isDark ? 'text-white/60' : 'text-gray-600'
                }`}>
                  {t('landing.heroSubtitle')}
                </motion.p>

                <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(220, 38, 38, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/register')}
                    className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 font-bold text-lg shadow-xl shadow-red-600/20"
                  >
                    {t('landing.getStarted')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 font-bold text-lg hover:bg-white/10 transition-colors"
                  >
                    {t('landing.learnMore')}
                  </motion.button>
                </motion.div>

                {/* Trust Badges */}
                <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-6 pt-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Certificação Oficial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>100% Seguro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>4.9/5 Avaliação</span>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Visual - 3D Card Effect */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative hidden lg:block z-10"
            >
              <div className="relative perspective-1000">
                <motion.div
                  whileHover={{ rotateY: 5, rotateX: 5 }}
                  className={`relative rounded-3xl backdrop-blur-xl overflow-hidden ${
                    isDark 
                      ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-2xl'
                      : 'bg-white border-2 border-gray-200 shadow-xl'
                  }`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Hero Image */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="relative h-64 overflow-hidden"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=800&q=80&auto=format&fit=crop"
                      alt="Professional Trade Training"
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 ${
                      isDark ? 'bg-gradient-to-b from-transparent to-[#0a0a0a]' : 'bg-gradient-to-b from-transparent to-white'
                    }`} />
                  </motion.div>

                  {/* Mini Stats Cards */}
                  <div className="p-8 space-y-6">
                    {[
                      { icon: Users, label: 'Profissionais', value: kpis?.users?.total || 0, color: 'from-blue-600 to-blue-700' },
                      { icon: BookOpen, label: 'Cursos', value: kpis?.content?.courses || 0, color: 'from-purple-600 to-purple-700' },
                      { icon: Trophy, label: 'Certificados', value: kpis?.engagement?.completed || 0, color: 'from-yellow-600 to-yellow-700' },
                    ].map((stat, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 * idx }}
                        whileHover={{ scale: 1.05, x: 10 }}
                        className={`flex items-center gap-4 p-4 rounded-xl ${
                          isDark
                            ? 'bg-white/5 border border-white/10'
                            : 'bg-gray-50 border-2 border-gray-200 shadow-md'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                          <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{stat.label}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute -top-6 -right-6 w-24 h-24 rounded-2xl backdrop-blur-xl flex items-center justify-center ${
                    isDark
                      ? 'bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-600/30'
                      : 'bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300 shadow-lg'
                  }`}
                >
                  <Zap className={`w-12 h-12 ${
                    isDark ? 'text-red-400' : 'text-red-500'
                  }`} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section with Animated Counters */}
      <section id="section-2" className={`relative py-20 px-6 border-y overflow-hidden ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80&auto=format&fit=crop"
            alt="Business Analytics Background"
            className={`w-full h-full object-cover ${
              isDark ? 'opacity-5' : 'opacity-[0.03]'
            }`}
          />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, label: t('landing.statsUsers'), value: kpis?.users?.total || 0 },
              { icon: BookOpen, label: t('landing.statsCourses'), value: kpis?.content?.courses || 0 },
              { icon: Target, label: 'Planos', value: kpis?.content?.training_plans || 0 },
              { icon: TrendingUp, label: 'Taxa Conclusão', value: Math.round(kpis?.engagement?.completion_rate || 0), suffix: '%' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className={`text-center space-y-3 p-6 rounded-2xl border transition-all ${
                  isDark 
                    ? 'bg-white/5 border-white/10 hover:border-white/20' 
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-red-600/20 to-red-700/10">
                  <stat.icon className="w-8 h-8 text-red-400" />
                </div>
                <div className={`text-4xl font-black bg-gradient-to-r bg-clip-text text-transparent ${
                  isDark ? 'from-white to-white/70' : 'from-gray-900 to-gray-700'
                }`}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="relative py-32 px-6 overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/4 w-96 h-96 bg-gradient-to-r from-red-600/10 to-purple-600/10 rounded-full blur-[120px] -z-10"
        />

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-20 space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                isDark 
                  ? 'bg-gradient-to-r from-red-600/20 to-purple-600/20 border-red-600/30'
                  : 'bg-gradient-to-r from-red-50 to-purple-50 border-red-200'
              }`}
            >
              <Sparkles className={`w-4 h-4 animate-pulse ${
                isDark ? 'text-red-400' : 'text-red-500'
              }`} />
              <span className={`text-sm font-semibold ${
                isDark ? 'text-red-300' : 'text-red-600'
              }`}>Áreas de Formação</span>
            </motion.div>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className={`block bg-gradient-to-r bg-clip-text text-transparent ${
                  isDark ? 'from-white via-red-200 to-white' : 'from-gray-900 via-red-600 to-gray-900'
                }`}
              >
                Nossos Serviços
              </motion.span>
            </h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className={`text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed ${
                isDark ? 'text-white/60' : 'text-gray-600'
              }`}
            >
              Formação especializada em <span className="text-red-400 font-semibold">Trade Finance</span> para sua evolução profissional
            </motion.p>
          </motion.div>

          {/* Bento Grid Layout - Asymmetric Design */}
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-fr">
            {[
              {
                icon: Rocket,
                title: 'Créditos Importación',
                desc: 'Gestão completa de operações de crédito para importação com controlo de prazos e liquidação.',
                color: 'from-red-600 to-red-700',
                span: 'md:col-span-6 lg:col-span-7 lg:row-span-2',
                particles: 16,
                size: 'large',
                image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&auto=format&fit=crop'
              },
              {
                icon: Globe,
                title: 'Remessas Importación',
                desc: 'Processamento de remessas internacionais para operações de importação.',
                color: 'from-blue-600 to-blue-700',
                span: 'md:col-span-3 lg:col-span-5',
                particles: 10,
                size: 'medium'
              },
              {
                icon: TrendingUp,
                title: 'Remessas Exportación',
                desc: 'Gestão de remessas para operações de exportação e comércio exterior.',
                color: 'from-purple-600 to-purple-700',
                span: 'md:col-span-3 lg:col-span-5',
                particles: 10,
                size: 'medium'
              },
              {
                icon: Shield,
                title: 'Garantias Emitidas',
                desc: 'Emissão e gestão de garantias bancárias internacionais.',
                color: 'from-cyan-600 to-cyan-700',
                span: 'md:col-span-3 lg:col-span-4',
                particles: 8,
                size: 'small'
              },
              {
                icon: Award,
                title: 'Garantias Recibidas',
                desc: 'Controlo e acompanhamento de garantias recebidas.',
                color: 'from-green-600 to-green-700',
                span: 'md:col-span-3 lg:col-span-4',
                particles: 8,
                size: 'small'
              },
              {
                icon: Briefcase,
                title: 'Ordenes de Pago Financiadas',
                desc: 'Financiamento de ordens de pagamento para operações comerciais.',
                color: 'from-yellow-600 to-yellow-700',
                span: 'md:col-span-3 lg:col-span-4',
                particles: 10,
                size: 'small'
              },
              {
                icon: BarChart3,
                title: 'Eurocobros',
                desc: 'Cobranças internacionais com gestão documental e financeira completa.',
                color: 'from-indigo-600 to-indigo-700',
                span: 'md:col-span-6 lg:col-span-12',
                particles: 12,
                size: 'medium',
                image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80&auto=format&fit=crop'
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50, rotateX: 45 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ 
                  delay: idx * 0.15, 
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className={`group relative ${feature.span}`}
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  whileHover={{ 
                    scale: 1.03, 
                    y: -8,
                    rotateX: 5,
                    rotateY: 5,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`relative h-full rounded-3xl backdrop-blur-xl overflow-hidden transition-all ${
                    isDark 
                      ? 'bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 hover:border-white/30'
                      : 'bg-white border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-2xl'
                  } ${
                    feature.size === 'large' ? 'p-10 md:p-12' : feature.size === 'medium' ? 'p-8' : 'p-6'
                  }`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Animated Gradient Background */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity`}
                  />

                  {/* Shine Effect */}
                  <motion.div
                    initial={{ x: '-100%', y: '-100%' }}
                    whileHover={{ x: '100%', y: '100%' }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"
                    style={{ transform: 'translateZ(0)' }}
                  />

                  {/* Floating Particles */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: feature.particles }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          x: Math.random() * 100 + '%',
                          y: Math.random() * 100 + '%',
                          scale: 0,
                          opacity: 0
                        }}
                        whileInView={{ 
                          scale: [0, 1, 0],
                          opacity: [0, 0.5, 0],
                          y: [
                            `${Math.random() * 100}%`,
                            `${Math.random() * 100}%`
                          ]
                        }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 3 + Math.random() * 2,
                          repeat: Infinity,
                          delay: Math.random() * 2,
                          ease: "easeInOut"
                        }}
                        className={`absolute w-1 h-1 rounded-full bg-gradient-to-br ${feature.color}`}
                      />
                    ))}
                  </div>

                  <div className="relative space-y-6" style={{ transformStyle: 'preserve-3d' }}>
                    {/* Feature Image (if available) */}
                    {feature.image && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className={`rounded-2xl overflow-hidden mb-6 ${
                          isDark ? 'border border-white/10' : 'border-2 border-gray-200'
                        }`}
                      >
                        <img 
                          src={feature.image}
                          alt={feature.title}
                          className="w-full h-48 object-cover"
                        />
                      </motion.div>
                    )}

                    {/* Icon with 3D effect */}
                    <motion.div
                      whileHover={{ 
                        scale: 1.1, 
                        rotate: [0, -10, 10, 0],
                        z: 50
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="relative inline-block"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} ${
                        isDark ? 'shadow-2xl' : 'shadow-xl'
                      } ${
                        feature.size === 'large' ? 'w-20 h-20' : feature.size === 'medium' ? 'w-16 h-16' : 'w-14 h-14'
                      }`}>
                        <feature.icon className={`relative z-10 text-white ${
                          feature.size === 'large' ? 'w-10 h-10' : feature.size === 'medium' ? 'w-8 h-8' : 'w-7 h-7'
                        }`} />
                      </div>
                      {/* Icon Glow */}
                      <motion.div
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} blur-xl opacity-0 group-hover:opacity-60`}
                      />
                    </motion.div>

                    <div className={`space-y-${feature.size === 'large' ? '4' : '3'}`}>
                      <h3 className={`font-black bg-gradient-to-r bg-clip-text text-transparent ${
                        feature.size === 'large' ? 'text-3xl md:text-4xl' : feature.size === 'medium' ? 'text-2xl' : 'text-xl'
                      } ${isDark ? 'from-white to-white/70' : 'from-gray-900 to-gray-700'}`}>
                        {feature.title}
                      </h3>
                      <p className={`leading-relaxed transition-colors ${
                        feature.size === 'large' ? 'text-lg' : 'text-base'
                      } ${isDark ? 'text-white/70 group-hover:text-white/90' : 'text-gray-600 group-hover:text-gray-900'}`}>
                        {feature.desc}
                      </p>
                    </div>

                    {/* Animated Arrow */}
                    <motion.div
                      initial={{ x: 0 }}
                      whileHover={{ x: 8 }}
                      className={`flex items-center gap-2 transition-colors ${
                        isDark ? 'text-white/50 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900'
                      }`}
                    >
                      <span className="text-sm font-semibold">Saiba mais</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Border Gradient Animation */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(135deg, transparent 0%, rgba(220, 38, 38, 0.3) 50%, transparent 100%)`,
                      padding: '2px',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude'
                    }}
                  />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`space-y-8 p-12 rounded-3xl backdrop-blur-xl ${
              isDark
                ? 'bg-gradient-to-br from-red-600/20 to-red-700/10 border border-red-600/20'
                : 'bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 shadow-2xl'
            }`}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 shadow-2xl shadow-red-600/50">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h2 className={`text-4xl md:text-5xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('landing.ctaTitle')}
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {t('landing.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(220, 38, 38, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className={`px-8 py-4 rounded-xl font-bold text-lg shadow-xl ${
                  isDark
                    ? 'bg-white text-red-600'
                    : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                }`}
              >
                Começar Agora - Grátis
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-colors ${
                  isDark
                    ? 'bg-white/10 border border-white/20 hover:bg-white/20 text-white'
                    : 'bg-white border-2 border-gray-300 hover:border-red-400 hover:bg-gray-50 text-gray-900 shadow-md'
                }`}
              >
                {t('auth.login')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative py-8 px-6 border-t ${
        isDark ? 'border-white/10' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto text-center">
          <span className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>© 2026 Santander TradeHub. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
