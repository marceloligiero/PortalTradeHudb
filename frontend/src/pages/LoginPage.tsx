import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/auth';
import { useAuthStore } from '../stores/authStore';
import {
  LogIn, Mail, Lock, Eye, EyeOff,
  ArrowRight, UserPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingNavbar from '../components/landing/LandingNavbar';
import { useTheme } from '../contexts/ThemeContext';
import { MeshBackground, NoiseOverlay, FloatInput, AuthSubmitButton, BrandPanel } from '../components/auth';

/* ═══════════════════════════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(s => s.login);
  const rawRedirect = new URLSearchParams(location.search).get('redirect') || '/';
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: any) => { login(data.user, data.access_token); navigate(redirectTo); },
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); loginMutation.mutate({ email, password }); };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090B] relative overflow-x-hidden transition-colors duration-500">
      <MeshBackground isDark={isDark} />
      <NoiseOverlay />
      <LandingNavbar minimal />

      <div className="relative z-10 min-h-screen flex items-stretch pt-20 lg:pt-0">
        {/* LEFT: Brand Panel */}
        <div className="hidden lg:flex lg:w-[55%]">
          <BrandPanel variant="login" />
        </div>

        {/* Vertical divider */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-white/[0.06] to-transparent" />

        {/* RIGHT: Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[400px]">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}>
              <p className="font-body text-gray-500 dark:text-white/50 text-sm font-medium mb-2">{t('auth.loginToContinue')}</p>
              <h2 className="text-3xl sm:text-4xl font-headline font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                {t('common.welcome')}<span style={{ color: '#EC0000' }}>.</span>
              </h2>
            </motion.div>

            {/* Form */}
            <motion.form onSubmit={handleSubmit} aria-label={t('auth.login')}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-10 space-y-4">

              <FloatInput
                type="email" placeholder={t('auth.emailPlaceholder')} value={email}
                onChange={e => setEmail(e.target.value)} autoFocus
                icon={<Mail className="w-[18px] h-[18px]" />}
                id="login-email"
              />

              <FloatInput
                type={showPassword ? 'text' : 'password'} placeholder={t('auth.password')} value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock className="w-[18px] h-[18px]" />}
                id="login-password"
                right={
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    className="text-gray-400 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/60 transition-colors flex-shrink-0 p-0.5">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <div className="flex justify-end pt-1">
                <Link to="/forgot-password"
                  className="text-xs font-body font-medium text-gray-400 dark:text-white/40 hover:text-[#EC0000] transition-colors">
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              {/* Error */}
              <AnimatePresence>
                {loginMutation.isError && (
                  <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    role="alert" aria-live="assertive"
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
                    style={{ background: 'rgba(236,0,0,0.08)', borderColor: 'rgba(236,0,0,0.20)' }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#EC0000' }} />
                    <p className="text-xs font-body font-medium" style={{ color: '#EC0000' }}>{t('auth.loginError')}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <div className="pt-2">
                <AuthSubmitButton
                  loading={loginMutation.isPending}
                  label={t('auth.login')}
                  icon={<LogIn className="w-[18px] h-[18px]" />}
                />
              </div>
            </motion.form>

            {/* Divider */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]" />
              <span className="text-[11px] font-body text-gray-400 dark:text-white/30 font-medium uppercase tracking-wider">{t('common.or')}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]" />
            </motion.div>

            {/* Register link */}
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              type="button" onClick={() => navigate('/register')}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-gray-200 dark:border-white/[0.08] text-sm font-body font-semibold text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:border-gray-300 dark:hover:border-white/[0.15] transition-all duration-300 group cursor-pointer">
              <UserPlus className="w-4 h-4" />
              <span>{t('auth.noAccount')}</span>
              <span className="font-bold" style={{ color: '#EC0000' }}>{t('auth.register')}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </motion.button>

            {/* Footer (mobile) */}
            <p className="lg:hidden text-center text-[11px] font-body text-gray-400 dark:text-white/25 mt-10">
              {t('auth.copyright')}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
