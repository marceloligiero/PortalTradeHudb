import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
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
  Play
} from 'lucide-react';

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
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === null || saved === 'dark';
  });
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

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
              <img 
                src="/logo-sds.png"
                alt="Santander Digital Services"
                className={`h-10 w-auto transition-all ${isDark ? 'filter brightness-0 invert' : ''}`}
              />
              <div className={`hidden md:block h-8 w-px ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-medium text-red-500">PORTAL DE FORMAÇÕES</span>
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
                Entrar
              </motion.button>

              {/* Register Button */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(220, 38, 38, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold shadow-lg shadow-red-600/20 hover:shadow-red-600/40 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Registar</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
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
                Santander Digital Services | Shared Services
              </span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </motion.div>

            {/* Main Title */}
            <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-black leading-[0.9]">
              <span className={`block ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Portal de
              </span>
              <span className="block bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent">
                Formações
              </span>
              <span className={`block text-4xl md:text-5xl font-bold mt-4 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                Trade Datahub
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeInUp} className={`text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed ${
              isDark ? 'text-white/60' : 'text-gray-600'
            }`}>
              Capacitação operacional de excelência para equipas de Trade Finance.
              <br className="hidden md:block" />
              Processos padronizados. Conhecimento centralizado. Resultados consistentes.
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
                Começar Formação
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
                Explorar Processos
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
                <StatCounter value={4} suffix="" label="Áreas Operacionais" isDark={isDark} />
                <StatCounter value={100} suffix="%" label="Processos Mapeados" isDark={isDark} />
                <StatCounter value={24} suffix="/7" label="Acesso Disponível" isDark={isDark} />
                <StatCounter value={98} suffix="%" label="Satisfação" isDark={isDark} />
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
            O que é o Portal de Formações
          </motion.h2>
          <motion.p variants={fadeInUp} className={`text-lg leading-relaxed mb-8 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            O Portal de Formações do Trade Datahub é a plataforma oficial de capacitação operacional para as equipas 
            que atuam nos processos de comércio exterior. Desenvolvido no contexto de Shared Services do Santander Digital Services, 
            o portal centraliza todo o conhecimento necessário para a execução correta, padronizada e eficiente das operações de Trade Finance.
          </motion.p>
          <motion.p variants={fadeInUp} className={`text-lg leading-relaxed ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            Através de trilhas de formação estruturadas por área operacional, os colaboradores desenvolvem competências técnicas 
            alinhadas com os processos oficiais, regulamentações internacionais e melhores práticas do setor.
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
              <span className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>4 Áreas Especializadas</span>
            </div>
            <h2 className={`text-4xl md:text-6xl font-black mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Áreas Operacionais de Trade
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Formação especializada para cada etapa do processo de Trade Finance
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Remessas Internacionais */}
            <ProcessCard
              icon={Globe}
              title="Remessas Internacionais"
              description="Execução dos fluxos financeiros associados às operações de comércio exterior, garantindo a correta movimentação de fundos entre ordenante e beneficiário."
              items={[
                "Processamento de remessas de entrada e saída",
                "Validação de dados do ordenante e beneficiário",
                "Envio e receção de mensagens SWIFT",
                "Validação de compliance e sanções",
                "Tratamento de exceções e devoluções",
                "Liquidação e conciliação de operações"
              ]}
              focus="Execução correta, redução de falhas e padronização global"
              gradient="from-blue-600 to-blue-700"
              isDark={isDark}
              index={0}
            />

            {/* Cobranças Internacionais */}
            <ProcessCard
              icon={FileText}
              title="Cobranças Internacionais (Eurocobros)"
              description="Operações de cobrança internacional onde o banco atua como intermediário entre exportador e importador, garantindo o fluxo documental e financeiro."
              items={[
                "Receção e conferência de documentos comerciais",
                "Envio de documentos ao banco do importador",
                "Controlo das modalidades D/P e D/A",
                "Acompanhamento de aceite e pagamento",
                "Gestão de prazos e instruções do cliente",
                "Tratamento de não pagamento ou devoluções",
                "Liquidação dos valores recebidos"
              ]}
              focus="Controlo de prazos e acompanhamento do ciclo da cobrança"
              gradient="from-green-600 to-green-700"
              isDark={isDark}
              index={1}
            />

            {/* Cartas de Crédito */}
            <ProcessCard
              icon={CreditCard}
              title="Cartas de Crédito (Trade Finance – LCs)"
              description="Operações em que o banco atua como garantidor do pagamento, mediante cumprimento das condições documentais estabelecidas pela UCP 600."
              items={[
                "Emissão e avisamento de cartas de crédito",
                "Processamento de alterações (amendments)",
                "Conferência documental conforme UCP 600 e ISBP",
                "Identificação e tratamento de discrepâncias",
                "Envio e receção de mensagens SWIFT",
                "Controlo de prazos, vencimentos e liquidação",
                "Interface operacional com bancos correspondentes"
              ]}
              focus="Rigor documental e aderência às regras internacionais"
              gradient="from-red-600 to-red-700"
              isDark={isDark}
              index={2}
            />

            {/* Financiamentos */}
            <ProcessCard
              icon={Landmark}
              title="Financiamentos ao Comércio Exterior"
              description="Gestão operacional dos produtos de crédito vinculados às operações de importação e exportação, assegurando o correto controlo e liquidação."
              items={[
                "Liberação de recursos conforme contrato",
                "Controlo de contratos ativos",
                "Cálculo de juros e encargos",
                "Interface operacional com área de câmbio",
                "Liquidação no vencimento",
                "Gestão de prorrogações e antecipações",
                "Encerramento e baixa de operações"
              ]}
              focus="Execução precisa e controlo de contratos"
              gradient="from-purple-600 to-purple-700"
              isDark={isDark}
              index={3}
            />
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
                <span className={`text-sm font-medium ${isDark ? "text-red-300" : "text-red-600"}`}>Integração Total</span>
              </div>
              <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
                Integração com o Trade Datahub
              </h2>
              <p className={`text-lg leading-relaxed mb-6 ${isDark ? "text-white/70" : "text-gray-600"}`}>
                O Portal de Formações está totalmente integrado ao Trade Datahub, garantindo que todo o conteúdo 
                de capacitação reflete fielmente os processos oficiais, fluxos operacionais e padrões globais da organização.
              </p>
              <div className="space-y-4">
                {[
                  "Conteúdo alinhado com processos oficiais documentados",
                  "Atualização contínua conforme evolução dos fluxos",
                  "Fonte única de conhecimento operacional",
                  "Conformidade com padrões internacionais (UCP, SWIFT)"
                ].map((item, idx) => (
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
                    <p className={`text-sm ${isDark ? "text-white/60" : "text-gray-500"}`}>Plataforma Central de Dados</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: Layers, color: "blue", title: "Processos Documentados", desc: "Fluxos oficiais por área operacional" },
                    { icon: RefreshCw, color: "green", title: "Atualização em Tempo Real", desc: "Sincronização automática de conteúdos" },
                    { icon: Shield, color: "purple", title: "Compliance Integrado", desc: "Alinhamento regulatório garantido" }
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
              <span className={`text-sm font-medium ${isDark ? "text-blue-300" : "text-blue-600"}`}>Passo a Passo</span>
            </div>
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              Como Funciona
            </h2>
            <p className={`text-xl ${isDark ? "text-white/60" : "text-gray-600"}`}>
              Acesso simples e direto ao conhecimento operacional
            </p>
          </motion.div>

          <div className="space-y-6">
            <StepCard 
              number="1" 
              title="Selecione a Área de Trade" 
              description="Escolha a área operacional onde atua: Remessas, Eurocobros, Cartas de Crédito ou Financiamentos. Cada área possui trilhas de formação específicas."
              isDark={isDark}
            />
            <StepCard 
              number="2" 
              title="Aceda aos Módulos de Formação" 
              description="Explore os módulos estruturados por processo, desde conceitos fundamentais até procedimentos avançados. Conteúdo desenvolvido por especialistas operacionais."
              isDark={isDark}
            />
            <StepCard 
              number="3" 
              title="Aplique no Dia a Dia" 
              description="Utilize o conhecimento adquirido na execução das suas atividades diárias. Consulte os materiais sempre que necessário como referência."
              isDark={isDark}
            />
            <StepCard 
              number="4" 
              title="Mantenha-se Atualizado" 
              description="Acompanhe as atualizações de conteúdo que refletem as evoluções dos processos e regulamentações do setor de Trade Finance."
              isDark={isDark}
            />
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
              <span className={`text-sm font-medium ${isDark ? "text-green-300" : "text-green-600"}`}>Vantagens</span>
            </div>
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              Benefícios para as Equipas Operacionais
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${isDark ? "text-white/60" : "text-gray-600"}`}>
              Capacitação focada em resultados concretos para a operação
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BenefitCard
              icon={BookOpen}
              title="Clareza de Processo"
              description="Compreensão completa de cada etapa operacional, eliminando dúvidas e ambiguidades na execução."
              isDark={isDark}
            />
            <BenefitCard
              icon={Layers}
              title="Padronização"
              description="Uniformidade na execução das operações, garantindo consistência entre equipas e turnos."
              isDark={isDark}
            />
            <BenefitCard
              icon={Shield}
              title="Redução de Erros"
              description="Diminuição significativa de falhas operacionais através do conhecimento preciso dos procedimentos."
              isDark={isDark}
            />
            <BenefitCard
              icon={Award}
              title="Maior Autonomia"
              description="Colaboradores mais preparados para tomar decisões e resolver situações do dia a dia."
              isDark={isDark}
            />
            <BenefitCard
              icon={Clock}
              title="Onboarding Eficiente"
              description="Integração mais rápida de novos membros da equipa com acesso imediato ao conhecimento estruturado."
              isDark={isDark}
            />
            <BenefitCard
              icon={GraduationCap}
              title="Certificação"
              description="Reconhecimento formal das competências adquiridas através de certificados de conclusão."
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
              Aceda ao Portal de Formações
            </h2>
            <p className={`text-xl mb-8 max-w-2xl mx-auto ${isDark ? "text-white/70" : "text-gray-600"}`}>
              Explore as trilhas de capacitação por processo de Trade e desenvolva as competências 
              essenciais para a excelência operacional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(220, 38, 38, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-lg shadow-xl shadow-red-600/20"
              >
                <Sparkles className="w-5 h-5" />
                Começar Agora
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
                Já tenho conta
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
              © {new Date().getFullYear()} Santander Digital Services. Portal de Formações - Trade Datahub.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
