import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle, Moon, Sun, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Button, Input, Alert } from '../components';
import api from '../lib/axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<'email' | 'password' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/verify-email', { email });
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Email não encontrado no sistema');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/direct-reset-password', { 
        email,
        new_password: newPassword 
      });
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] animate-blob ${
          isDark ? 'bg-red-600/10' : 'bg-red-600/5'
        }`} />
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[120px] animate-blob animation-delay-2000 ${
          isDark ? 'bg-blue-600/5' : 'bg-blue-600/3'
        }`} />
      </div>

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80&auto=format&fit=crop"
          alt="Background"
          className={`w-full h-full object-cover ${
            isDark ? 'opacity-5' : 'opacity-[0.03]'
          }`}
        />
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-2xl border-b shadow-2xl transition-colors duration-300 ${
        isDark 
          ? 'bg-[#0a0a0a]/95 border-white/10 shadow-red-600/5' 
          : 'bg-white/95 border-gray-200 shadow-gray-200/50'
      }`}>
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
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 relative group ${
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
              </motion.button>

              <LanguageSwitcher />
              
              <Link
                to="/login"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-medium group ${
                  isDark 
                    ? 'border-white/10 hover:border-white/20 text-white/80 hover:text-white hover:bg-white/10' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm">{t('auth.backToLogin', 'Voltar ao Login')}</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={`rounded-[32px] shadow-2xl p-10 border backdrop-blur-xl ${
              isDark
                ? 'bg-white/5 border-white/10'
                : 'bg-white border-gray-200'
            }`}
          >
            <AnimatePresence mode="wait">
              {step === 'success' ? (
                // Success State
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-6 shadow-lg shadow-green-600/20"
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className={`text-3xl font-black tracking-tight mb-3 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Senha Redefinida!
                  </h1>
                  <p className={`font-medium mb-8 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Sua senha foi alterada com sucesso. Você já pode fazer login com sua nova senha.
                  </p>
                  <Link to="/login">
                    <Button variant="primary" size="lg" className="w-full">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Ir para o Login
                    </Button>
                  </Link>
                </motion.div>
              ) : step === 'password' ? (
                // Password Step
                <motion.div
                  key="password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl mb-6 shadow-lg shadow-red-600/20"
                    >
                      <KeyRound className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className={`text-3xl font-black tracking-tight mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Nova Senha
                    </h1>
                    <p className={`font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Digite sua nova senha para <strong className="text-red-500">{email}</strong>
                    </p>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    {error && (
                      <Alert type="error" message={error} />
                    )}

                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        label="Nova Senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        icon={<Lock className="w-5 h-5" />}
                        theme={isDark ? 'dark' : 'light'}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-4 top-[38px] ${
                          isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        label="Confirmar Senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        icon={<Lock className="w-5 h-5" />}
                        theme={isDark ? 'dark' : 'light'}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute right-4 top-[38px] ${
                          isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      loading={loading}
                      icon={<ArrowRight className="w-5 h-5" />}
                    >
                      Redefinir Senha
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setStep('email');
                        setError('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className={`font-medium transition-colors ${
                        isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ← Voltar para email
                    </button>
                  </div>
                </motion.div>
              ) : (
                // Email Step
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="text-center mb-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl mb-6 shadow-lg shadow-red-600/20"
                    >
                      <Mail className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className={`text-3xl font-black tracking-tight mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Esqueceu a senha?
                    </h1>
                    <p className={`font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Digite seu email cadastrado para redefinir sua senha.
                    </p>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-6">
                    {error && (
                      <Alert type="error" message={error} />
                    )}

                    <Input
                      type="email"
                      label="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      icon={<Mail className="w-5 h-5" />}
                      theme={isDark ? 'dark' : 'light'}
                      required
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      loading={loading}
                      icon={<ArrowRight className="w-5 h-5" />}
                    >
                      Continuar
                    </Button>
                  </form>

                  <div className="mt-10 text-center">
                    <p className={`font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Lembrou a senha?{' '}
                      <Link
                        to="/login"
                        className="text-red-500 hover:text-red-400 font-bold transition-colors"
                      >
                        Fazer Login
                      </Link>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Additional Info */}
          <p className={`text-center text-sm mt-10 font-medium ${
            isDark ? 'text-gray-600' : 'text-gray-500'
          }`}>
            {t('common.appName')} © 2025
          </p>
        </motion.div>
      </div>
    </div>
  );
}
