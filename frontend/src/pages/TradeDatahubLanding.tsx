import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Globe,
  FileText,
  CreditCard,
  Landmark,
  CheckCircle,
  Shield,
  BookOpen,
  Layers,
  RefreshCw,
  Clock,
  Target,
  Award,
  ChevronRight,
  Database,
  Workflow,
  GraduationCap,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Star,
  Play,
  TrendingUp,
  Briefcase,
  Receipt
} from 'lucide-react';

// Language options with flags (using FlagCDN images)
const languages = [
  { code: 'pt-PT', name: 'Português', flag: 'https://flagcdn.com/w40/pt.png' },
  { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png' }
];

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

// Floating Particles Component
const FloatingParticles = ({ isDark }: { isDark: boolean }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ 
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
          y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
          opacity: 0
        }}
        animate={{ 
          x: [null, Math.random() * 200 - 100],
          y: [null, Math.random() * 200 - 100],
          opacity: [0, 0.6, 0]
        }}
        transition={{ 
          duration: 10 + Math.random() * 10,
          repeat: Infinity,
          delay: Math.random() * 5
        }}
        className={`absolute w-2 h-2 rounded-full ${isDark ? 'bg-red-500/30' : 'bg-red-500/20'}`}
      />
    ))}
  </div>
);

// Section Component
const Section = ({ children, className = '', id = '', isDark = true }: { children: React.ReactNode; className?: string; id?: string; isDark?: boolean }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={staggerContainer}
      className={`py-24 px-6 ${className}`}
    >
      {children}
    </motion.section>
  );
};

// Premium Process Card Component
const ProcessCard = ({ 
  icon: Icon, 
  title, 
  description, 
  items, 
  focus,
  gradient,
  isDark,
  index
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  items: string[];
  focus: string;
  gradient: string;
  isDark: boolean;
  index: number;
}) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, rotateX: -10 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 60, rotateX: -10 }}
      transition={{ duration: 0.8, delay: index * 0.15 }}
      className="group relative perspective-1000"
    >
      {/* Glow Effect */}
      <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500`} />
      
      <div className={`relative rounded-3xl p-8 border h-full transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-2 ${
        isDark 
          ? 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-white/10 group-hover:border-white/20' 
          : 'bg-white border-gray-200 shadow-xl group-hover:shadow-2xl'
      }`}>
        {/* Premium Badge */}
        <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center ${
          isDark ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-yellow-400 to-orange-400'
        }`}>
          <Star className="w-4 h-4 text-white fill-white" />
        </div>

        {/* Icon */}
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`w-18 h-18 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg`}
          style={{ width: '4.5rem', height: '4.5rem' }}
        >
          <Icon className="w-9 h-9 text-white" />
        </motion.div>
        
        {/* Title */}
        <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        
        {/* Description */}
        <p className={`mb-6 leading-relaxed ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{description}</p>
        
        {/* Items */}
        <div className="space-y-3 mb-6">
          {items.slice(0, 5).map((item, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="flex items-start gap-3"
            >
              <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
              <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{item}</span>
            </motion.div>
          ))}
        </div>
        
        {/* Focus */}
        <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className={`flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            <Target className="w-4 h-4" />
            <span className="text-sm font-semibold">Foco: {focus}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Premium Benefit Card
const BenefitCard = ({ icon: Icon, title, description, isDark, index = 0 }: { icon: React.ElementType; title: string; description: string; isDark: boolean; index?: number }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  
  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className={`p-6 rounded-2xl border transition-all cursor-default ${
        isDark 
          ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 hover:border-red-500/30' 
          : 'bg-white border-gray-200 shadow-lg hover:shadow-xl'
      }`}
    >
      <motion.div 
        whileHover={{ rotate: 10 }}
        className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
          isDark ? 'bg-gradient-to-br from-red-600/30 to-red-700/30' : 'bg-gradient-to-br from-red-100 to-red-50'
        }`}
      >
        <Icon className={`w-7 h-7 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
      </motion.div>
      <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
      <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{description}</p>
    </motion.div>
  );
};

// Premium Step Component
const StepCard = ({ number, title, description, isDark, index = 0 }: { number: string; title: string; description: string; isDark: boolean; index?: number }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  
  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative flex items-start gap-6"
    >
      {/* Connector Line */}
      {index < 3 && (
        <div className={`absolute left-7 top-16 w-0.5 h-full ${isDark ? 'bg-gradient-to-b from-red-600 to-transparent' : 'bg-gradient-to-b from-red-400 to-transparent'}`} />
      )}
      
      <motion.div 
        whileHover={{ scale: 1.1, rotate: 360 }}
        transition={{ duration: 0.5 }}
        className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-xl font-bold text-white shadow-xl shadow-red-600/30 z-10"
      >
        {number}
      </motion.div>
      <div className={`pt-2 pb-8 ${isDark ? '' : ''}`}>
        <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
        <p className={`leading-relaxed ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{description}</p>
      </div>
    </motion.div>
  );
};

// Stats Counter Component
const StatCounter = ({ value, suffix, label, isDark }: { value: number; suffix: string; label: string; isDark: boolean }) => {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
      className="text-center"
    >
      <div className={`text-5xl md:text-6xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {count}{suffix}
      </div>
      <div className={`text-sm font-medium mt-2 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{label}</div>
    </motion.div>
  );
};

export default function TradeDatahubLanding() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === null || saved === 'dark';
  });
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  // --- Landing data from API ---
  const [landingData, setLandingData] = useState<{
    stats: { total_products: number; total_courses: number; total_students: number; total_lessons: number; avg_satisfaction: number };
    ratings: Array<{ user_name: string; stars: number; comment: string | null; rating_type: string; item_name: string | null; created_at: string | null }>;
  } | null>(null);

  useEffect(() => {
    fetch('/api/public/landing')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setLandingData(data); })
      .catch(() => {});
  }, []);

  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
    setShowLangMenu(false);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDark 
        ? 'bg-gradient-to-b from-[#050505] via-[#0a0a0a] to-[#050505] text-white' 
        : 'bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900'
    }`}>
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Grid */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-30' : 'opacity-10'}`} style={{
          backgroundImage: `linear-gradient(${isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.1)'} 1px, transparent 1px),
                           linear-gradient(90deg, ${isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.1)'} 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
        
        {/* Floating Orbs */}
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -80, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] ${
            isDark ? 'bg-red-600/20' : 'bg-red-400/10'
          }`}
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 100, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] ${
            isDark ? 'bg-blue-600/15' : 'bg-blue-400/10'
          }`}
        />
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className={`absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full blur-[120px] ${
            isDark ? 'bg-purple-600/10' : 'bg-purple-400/5'
          }`}
        />
        
        <FloatingParticles isDark={isDark} />
      </div>

      {/* Progress Bar */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 origin-left z-[60]"
      />

      {/* Premium Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 backdrop-blur-2xl border-b transition-colors duration-300 ${
          isDark 
            ? 'bg-[#050505]/90 border-white/10' 
            : 'bg-white/90 border-gray-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="cursor-pointer flex items-center gap-4"
              onClick={() => navigate('/')}
            >
                <button className="ml-4 px-3 py-1 bg-red-600 text-white rounded" onClick={(e) => { e.stopPropagation(); navigate('/portal-tutoria'); }}>Portal de Tutoria</button>
              <img 
                src="/logo-sds.png"
                alt="Santander Digital Services"
                className={`h-10 w-auto transition-all ${isDark ? 'filter brightness-0 invert' : 'filter brightness-0'}`}
              />
              <div className={`hidden md:block h-8 w-px ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-medium text-red-500">{t('landing.navbar.portalTitle')}</span>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Trade Datahub</span>
              </div>
            </motion.div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  isDark 
                    ? 'bg-white/10 hover:bg-white/20 border border-white/10' 
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
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
                      <Moon className="w-5 h-5 text-blue-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Login Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className={`hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                  isDark 
                    ? 'text-white/80 hover:text-white hover:bg-white/10 border border-white/10' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                {t('landing.navbar.login')}
              </motion.button>

              {/* Register Button */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(220, 38, 38, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('landing.navbar.register')}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              {/* Language Selector - Premium */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className={`h-11 px-3 rounded-xl flex items-center gap-2 transition-all ${
                    isDark 
                      ? 'bg-white/10 hover:bg-white/20 border border-white/10' 
                      : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  <img 
                    src={currentLang.flag} 
                    alt={currentLang.name} 
                    className="w-8 h-6 object-cover rounded shadow-sm" 
                  />
                  <ChevronRight className={`w-4 h-4 transition-transform ${showLangMenu ? 'rotate-90' : ''} ${isDark ? 'text-white/60' : 'text-gray-500'}`} />
                </motion.button>

                <AnimatePresence>
                  {showLangMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 top-full mt-3 p-2 rounded-2xl shadow-2xl border z-50 min-w-[180px] backdrop-blur-xl ${
                        isDark 
                          ? 'bg-[#1a1a1a]/95 border-white/10' 
                          : 'bg-white/95 border-gray-200'
                      }`}
                    >
                      <div className={`px-3 py-2 mb-1 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                        {t('landing.navbar.selectLanguage') || 'Idioma'}
                      </div>
                      {languages.map((lang) => (
                        <motion.button
                          key={lang.code}
                          whileHover={{ x: 4 }}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                            i18n.language === lang.code 
                              ? (isDark ? 'bg-red-600/20 border border-red-500/30' : 'bg-red-50 border border-red-200')
                              : (isDark ? 'hover:bg-white/10 border border-transparent' : 'hover:bg-gray-100 border border-transparent')
                          }`}
                        >
                          <img 
                            src={lang.flag} 
                            alt={lang.name} 
                            className="w-10 h-7 object-cover rounded shadow-md" 
                          />
                          <div className="flex flex-col items-start">
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {lang.name}
                            </span>
                            <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                              {lang.code.toUpperCase()}
                            </span>
                          </div>
                          {i18n.language === lang.code && (
                            <CheckCircle className={`w-5 h-5 ml-auto ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Premium */}
      <section className="relative pt-32 pb-32 px-6 min-h-screen flex items-center overflow-hidden">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="max-w-7xl mx-auto w-full relative z-10"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center space-y-10"
          >
            {/* Premium Badge */}
            <motion.div 
              variants={scaleIn} 
              className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border ${
                isDark 
                  ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/30' 
                  : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
              }`}
            >
              <Sparkles className="w-5 h-5 text-red-500" />
              <span className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                {t('landing.badge')}
              </span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </motion.div>

            {/* Main Title */}
            <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-black leading-[0.9]">
              <span className={`block ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('landing.heroTitle1')}
              </span>
              <span className="block bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent">
                {t('landing.heroTitle2')}
              </span>
              <span className={`block text-4xl md:text-5xl font-bold mt-4 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                {t('landing.heroTitle3')}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeInUp} className={`text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed ${
              isDark ? 'text-white/60' : 'text-gray-600'
            }`}>
              {t('landing.heroSubtitle')}
              <br className="hidden md:block" />
              {t('landing.heroSubtitle2')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(220, 38, 38, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="group flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-red-700 font-bold text-lg text-white shadow-2xl shadow-red-600/30"
              >
                <Play className="w-5 h-5" />
                {t('landing.startTraining')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('processos')?.scrollIntoView({ behavior: 'smooth' })}
                className={`flex items-center justify-center gap-2 px-10 py-5 rounded-2xl font-bold text-lg transition-all ${
                  isDark 
                    ? 'bg-white/5 border border-white/20 hover:bg-white/10 text-white' 
                    : 'bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-900'
                }`}
              >
                {t('landing.exploreProcesses')}
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="pt-16">
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto p-8 rounded-3xl ${
                isDark 
                  ? 'bg-white/5 backdrop-blur-xl border border-white/10' 
                  : 'bg-white shadow-2xl border border-gray-100'
              }`}>
                <StatCounter value={landingData?.stats.total_products ?? 7} suffix="" label={t('landing.stats.areas')} isDark={isDark} />
                <StatCounter value={landingData?.stats.total_courses ?? 0} suffix="" label={t('landing.stats.courses')} isDark={isDark} />
                <StatCounter value={landingData?.stats.total_students ?? 0} suffix="" label={t('landing.stats.students')} isDark={isDark} />
                <StatCounter value={landingData?.stats.avg_satisfaction ?? 0} suffix="%" label={t('landing.stats.satisfaction')} isDark={isDark} />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-6 h-10 rounded-full border-2 flex items-start justify-center pt-2 ${
              isDark ? 'border-white/30' : 'border-gray-400'
            }`}
          >
            <motion.div
              animate={{ opacity: [1, 0, 1], y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-1.5 h-3 rounded-full ${isDark ? 'bg-white/60' : 'bg-gray-500'}`}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Introduction Section */}
      <Section className={isDark ? 'bg-gradient-to-b from-transparent to-white/5' : 'bg-gradient-to-b from-transparent to-gray-100/50'} isDark={isDark}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={scaleIn} className="mb-8">
            <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center ${
              isDark ? 'bg-gradient-to-br from-red-600/30 to-red-700/30' : 'bg-gradient-to-br from-red-100 to-red-50'
            }`}>
              <Database className={`w-10 h-10 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            </div>
          </motion.div>
          <motion.h2 variants={fadeInUp} className={`text-3xl md:text-5xl font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('landing.intro.title')}
          </motion.h2>
          <motion.p variants={fadeInUp} className={`text-lg leading-relaxed mb-8 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('landing.intro.p1')}
          </motion.p>
          <motion.p variants={fadeInUp} className={`text-lg leading-relaxed ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('landing.intro.p2')}
          </motion.p>
        </div>
      </Section>

      {/* Trade Processes Section */}
      <Section id="processos" className="relative" isDark={isDark}>
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-20">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
              isDark ? 'bg-red-600/10 border border-red-600/20' : 'bg-red-50 border border-red-200'
            }`}>
              <Zap className="w-4 h-4 text-red-500" />
              <span className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>{t('landing.processes.badge')}</span>
            </div>
            <h2 className={`text-4xl md:text-6xl font-black mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('landing.processes.title')}
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              {t('landing.processes.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Créditos Importación */}
            <ProcessCard
              icon={CreditCard}
              title={t('landing.processes.creditosImportacion.title')}
              description={t('landing.processes.creditosImportacion.description')}
              items={t('landing.processes.creditosImportacion.items', { returnObjects: true }) as string[]}
              focus={t('landing.processes.creditosImportacion.focus')}
              gradient="from-red-600 to-red-700"
              isDark={isDark}
              index={0}
            />

            {/* Remesas Importación */}
            <ProcessCard
              icon={Globe}
              title={t('landing.processes.remesasImportacion.title')}
              description={t('landing.processes.remesasImportacion.description')}
              items={t('landing.processes.remesasImportacion.items', { returnObjects: true }) as string[]}
              focus={t('landing.processes.remesasImportacion.focus')}
              gradient="from-blue-600 to-blue-700"
              isDark={isDark}
              index={1}
            />

            {/* Remesas Exportación */}
            <ProcessCard
              icon={TrendingUp}
              title={t('landing.processes.remesasExportacion.title')}
              description={t('landing.processes.remesasExportacion.description')}
              items={t('landing.processes.remesasExportacion.items', { returnObjects: true }) as string[]}
              focus={t('landing.processes.remesasExportacion.focus')}
              gradient="from-purple-600 to-purple-700"
              isDark={isDark}
              index={2}
            />

            {/* Garantías Emitidas */}
            <ProcessCard
              icon={Shield}
              title={t('landing.processes.garantiasEmitidas.title')}
              description={t('landing.processes.garantiasEmitidas.description')}
              items={t('landing.processes.garantiasEmitidas.items', { returnObjects: true }) as string[]}
              focus={t('landing.processes.garantiasEmitidas.focus')}
              gradient="from-cyan-600 to-cyan-700"
              isDark={isDark}
              index={3}
            />

            {/* Garantías Recibidas */}
            <ProcessCard
              icon={Award}
              title={t('landing.processes.garantiasRecibidas.title')}
              description={t('landing.processes.garantiasRecibidas.description')}
              items={t('landing.processes.garantiasRecibidas.items', { returnObjects: true }) as string[]}
              focus={t('landing.processes.garantiasRecibidas.focus')}
              gradient="from-green-600 to-green-700"
              isDark={isDark}
              index={4}
            />

            {/* Órdenes de Pago Financiadas */}
            <ProcessCard
              icon={Briefcase}
              title={t('landing.processes.ordenesPagoFinanciadas.title')}
              description={t('landing.processes.ordenesPagoFinanciadas.description')}
              items={t('landing.processes.ordenesPagoFinanciadas.items', { returnObjects: true }) as string[]}
              focus={t('landing.processes.ordenesPagoFinanciadas.focus')}
              gradient="from-yellow-600 to-yellow-700"
              isDark={isDark}
              index={5}
            />

            {/* Eurocobros - Full width */}
            <div className="md:col-span-2 lg:col-span-3">
              <ProcessCard
                icon={Receipt}
                title={t('landing.processes.eurocobros.title')}
                description={t('landing.processes.eurocobros.description')}
                items={t('landing.processes.eurocobros.items', { returnObjects: true }) as string[]}
                focus={t('landing.processes.eurocobros.focus')}
                gradient="from-indigo-600 to-indigo-700"
                isDark={isDark}
                index={6}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Trade Datahub Integration */}
      <Section className={isDark ? "bg-gradient-to-b from-white/5 to-transparent" : "bg-gradient-to-b from-gray-100 to-white"} isDark={isDark}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
                isDark 
                  ? "bg-red-600/10 border border-red-600/20" 
                  : "bg-red-50 border border-red-200"
              }`}>
                <Workflow className={isDark ? "w-4 h-4 text-red-400" : "w-4 h-4 text-red-600"} />
                <span className={`text-sm font-medium ${isDark ? "text-red-300" : "text-red-600"}`}>{t('landing.integration.badge')}</span>
              </div>
              <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
                {t('landing.integration.title')}
              </h2>
              <p className={`text-lg leading-relaxed mb-6 ${isDark ? "text-white/70" : "text-gray-600"}`}>
                {t('landing.integration.description')}
              </p>
              <div className="space-y-4">
                {(t('landing.integration.items', { returnObjects: true }) as string[]).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${isDark ? "text-green-400" : "text-green-600"}`} />
                    <p className={isDark ? "text-white/80" : "text-gray-700"}>{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="relative"
            >
              <div className={`backdrop-blur-xl rounded-3xl p-8 border ${
                isDark 
                  ? "bg-gradient-to-br from-white/10 to-white/5 border-white/10" 
                  : "bg-white border-gray-200 shadow-2xl"
              }`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Trade Datahub</h3>
                    <p className={`text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>{t('landing.integration.platform')}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: Layers, color: "blue", title: t('landing.integration.documented'), desc: t('landing.integration.documentedDesc') },
                    { icon: RefreshCw, color: "green", title: t('landing.integration.realtime'), desc: t('landing.integration.realtimeDesc') },
                    { icon: Shield, color: "purple", title: t('landing.integration.compliance'), desc: t('landing.integration.complianceDesc') }
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    const colorClass = item.color === "blue" ? (isDark ? "text-blue-400" : "text-blue-600") 
                      : item.color === "green" ? (isDark ? "text-green-400" : "text-green-600")
                      : (isDark ? "text-purple-400" : "text-purple-600");
                    return (
                      <div key={idx} className={`p-4 rounded-xl border ${
                        isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`w-5 h-5 ${colorClass}`} />
                          <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{item.title}</span>
                        </div>
                        <p className={`text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* How It Works */}
      <Section id="como-funciona" isDark={isDark}>
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
              isDark 
                ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20" 
                : "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200"
            }`}>
              <Play className={isDark ? "w-4 h-4 text-blue-400" : "w-4 h-4 text-blue-600"} />
              <span className={`text-sm font-medium ${isDark ? "text-blue-300" : "text-blue-600"}`}>{t('landing.howItWorks.badge')}</span>
            </div>
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              {t('landing.howItWorks.title')}
            </h2>
            <p className={`text-xl ${isDark ? "text-white/60" : "text-gray-600"}`}>
              {t('landing.howItWorks.subtitle')}
            </p>
          </motion.div>

          <div className="space-y-6">
            {(t('landing.howItWorks.steps', { returnObjects: true }) as Array<{title: string; description: string}>).map((step, idx) => (
              <StepCard 
                key={idx}
                number={String(idx + 1)} 
                title={step.title} 
                description={step.description}
                isDark={isDark}
                index={idx}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* Benefits Section */}
      <Section className={isDark ? "bg-gradient-to-b from-transparent to-white/5" : "bg-gradient-to-b from-white to-gray-50"} isDark={isDark}>
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
              isDark 
                ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20" 
                : "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
            }`}>
              <Award className={isDark ? "w-4 h-4 text-green-400" : "w-4 h-4 text-green-600"} />
              <span className={`text-sm font-medium ${isDark ? "text-green-300" : "text-green-600"}`}>{t('landing.benefits.badge')}</span>
            </div>
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              {t('landing.benefits.title')}
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDark ? "text-white/60" : "text-gray-600"}`}>
              {t('landing.benefits.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BenefitCard
              icon={BookOpen}
              title={t('landing.benefits.items.clarity.title')}
              description={t('landing.benefits.items.clarity.description')}
              isDark={isDark}
            />
            <BenefitCard
              icon={Layers}
              title={t('landing.benefits.items.standardization.title')}
              description={t('landing.benefits.items.standardization.description')}
              isDark={isDark}
            />
            <BenefitCard
              icon={Shield}
              title={t('landing.benefits.items.errors.title')}
              description={t('landing.benefits.items.errors.description')}
              isDark={isDark}
            />
            <BenefitCard
              icon={Award}
              title={t('landing.benefits.items.autonomy.title')}
              description={t('landing.benefits.items.autonomy.description')}
              isDark={isDark}
            />
            <BenefitCard
              icon={Clock}
              title={t('landing.benefits.items.onboarding.title')}
              description={t('landing.benefits.items.onboarding.description')}
              isDark={isDark}
            />
            <BenefitCard
              icon={GraduationCap}
              title={t('landing.benefits.items.certification.title')}
              description={t('landing.benefits.items.certification.description')}
              isDark={isDark}
            />
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="relative overflow-hidden" isDark={isDark}>
        <div className={`absolute inset-0 ${
          isDark 
            ? "bg-gradient-to-r from-red-900/30 via-red-800/20 to-red-900/30" 
            : "bg-gradient-to-r from-red-100 via-red-50 to-red-100"
        }`} />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div variants={fadeInUp}>
            <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
              isDark 
                ? "bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30" 
                : "bg-gradient-to-br from-red-100 to-red-200 border border-red-300"
            }`}>
              <GraduationCap className={`w-10 h-10 ${isDark ? "text-red-400" : "text-red-600"}`} />
            </div>
            <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
              {t('landing.cta.title')}
            </h2>
            <p className={`text-xl mb-8 max-w-2xl mx-auto ${isDark ? "text-white/70" : "text-gray-600"}`}>
              {t('landing.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(220, 38, 38, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-lg shadow-xl shadow-red-600/20"
              >
                <Sparkles className="w-5 h-5" />
                {t('landing.cta.startNow')}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl border font-bold text-lg transition-colors ${
                  isDark 
                    ? "bg-white/5 border-white/10 text-white hover:bg-white/10" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-lg"
                }`}
              >
                <LogIn className="w-5 h-5" />
                {t('landing.cta.haveAccount')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Footer */}
      <footer className={`py-12 px-6 border-t ${isDark ? "border-white/10" : "border-gray-200 bg-white"}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-sds.png"
                alt="Santander Digital Services"
                className={`h-8 w-auto transition-all ${isDark ? "filter brightness-0 invert opacity-60" : "filter brightness-0 opacity-80"}`}
              />
              <span className={isDark ? "text-white/40" : "text-gray-300"}>|</span>
              <span className={`font-medium ${isDark ? "text-white/60" : "text-gray-600"}`}>Trade Datahub</span>
            </div>
            <p className={`text-sm ${isDark ? "text-white/40" : "text-gray-400"}`}>
              {t('landing.footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
