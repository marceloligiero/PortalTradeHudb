import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/auth';
import { useAuthStore } from '../stores/authStore';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { LogIn, Mail, Lock, ArrowRight, Moon, Sun } from 'lucide-react';
import { Button, Input, Alert } from '../components';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: any) => {
      login(data.user, data.access_token);
      navigate('/');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
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
                to="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-medium group ${
                  isDark 
                    ? 'border-white/10 hover:border-white/20 text-white/80 hover:text-white hover:bg-white/10' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm">{t('common.backToHome')}</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Form */}
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
            {/* Logo/Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl mb-6 shadow-lg shadow-red-600/20"
              >
                <LogIn className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className={`text-4xl font-black tracking-tight mb-3 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {t('common.welcome')}
              </h1>
              <p className={`font-medium ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t('auth.loginToContinue')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <Input
                type="email"
                label={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.enterEmail')}
                icon={<Mail className="w-5 h-5" />}
                theme={isDark ? 'dark' : 'light'}
                required
              />

              {/* Password Field */}
              <Input
                type="password"
                label={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.enterPassword')}
                icon={<Lock className="w-5 h-5" />}
                theme={isDark ? 'dark' : 'light'}
                required
              />

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className={`text-sm font-medium transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-red-400' 
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  {t('auth.forgotPassword', 'Esqueceu a senha?')}
                </Link>
              </div>

              {/* Error Message */}
              {loginMutation.isError && (
                <Alert type="error" message={t('auth.loginError')} />
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={loginMutation.isPending}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                {t('auth.login')}
              </Button>
            </form>

            {/* Registration Link */}
            <div className="mt-10 text-center">
              <p className={`font-medium ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t('auth.noAccount')}{' '}
                <Link
                  to="/register"
                  className="text-red-500 hover:text-red-400 font-bold transition-colors"
                >
                  {t('auth.register')}
                </Link>
              </p>
            </div>
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
