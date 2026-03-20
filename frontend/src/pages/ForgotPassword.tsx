import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, KeyRound, ChevronLeft, CheckCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import LandingNavbar from '../components/landing/LandingNavbar';
import { useTheme } from '../contexts/ThemeContext';
import { MeshBackground, NoiseOverlay, FloatInput, AuthSubmitButton, BrandPanel } from '../components/auth';

/* ═══════════════════════════════════════════════════════════════════
   FORGOT PASSWORD PAGE
   ═══════════════════════════════════════════════════════════════════ */

const slideV = {
  enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const [step, setStep] = useState<'email' | 'password' | 'success'>('email');
  const [dir, setDir] = useState(1);
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

  const stepDotIdx = step === 'email' ? 0 : step === 'password' ? 1 : 2;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090B] relative overflow-x-hidden transition-colors duration-500">
      <MeshBackground isDark={isDark} />
      <NoiseOverlay />
      <LandingNavbar minimal />

      <div className="relative z-10 min-h-screen flex items-stretch pt-20 lg:pt-0">
        {/* LEFT: Brand Panel */}
        <div className="hidden lg:flex lg:w-[55%]">
          <BrandPanel variant="forgot" />
        </div>

        {/* Vertical divider */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-white/[0.06] to-transparent" />

        {/* RIGHT: Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[400px]">

            {/* Back button + step dots */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={() => { setError(''); if (step === 'email') navigate('/login'); else { setDir(-1); setStep('email'); } }}
                className="flex items-center gap-1 text-sm font-body font-medium text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 transition-colors">
                <ChevronLeft className="w-4 h-4" />
                <span>{step === 'email' ? t('auth.login') : t('common.back')}</span>
              </button>
              {step !== 'success' && (
                <div className="flex gap-1.5">
                  {[0, 1].map(i => (
                    <motion.div key={i}
                      animate={{
                        width: i === stepDotIdx ? 20 : 6,
                        background: i < stepDotIdx ? '#22c55e' : i === stepDotIdx ? '#EC0000' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                      }}
                      transition={{ duration: 0.3 }}
                      className="h-1.5 rounded-full"
                    />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Header */}
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                {step === 'success' ? (
                  <div className="flex flex-col items-start gap-3">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: 'linear-gradient(to bottom right, #22c55e, #16a34a)', boxShadow: '0 8px 24px rgba(34,197,94,0.25)' }}>
                      <CheckCircle className="w-6 h-6 text-white" />
                    </motion.div>
                    <h2 className="text-3xl sm:text-4xl font-headline font-bold text-gray-900 dark:text-white tracking-tight leading-tight whitespace-pre-line">
                      {t('auth.forgot.successTitle')}
                    </h2>
                    <p className="font-body text-gray-500 dark:text-white/50 text-sm">{t('auth.forgot.successSub')}</p>
                  </div>
                ) : (
                  <>
                    <p className="font-body text-gray-500 dark:text-white/50 text-sm font-medium mb-2">
                      {step === 'email' ? t('auth.forgot.sub') : t('auth.forgot.forEmail')}
                      {step === 'password' && <span className="font-semibold" style={{ color: '#EC0000' }}> {email}</span>}
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-headline font-bold text-gray-900 dark:text-white tracking-tight leading-tight whitespace-pre-line">
                      {step === 'email' ? t('auth.forgot.title') : t('auth.forgot.newPasswordTitle')}
                      <span style={{ color: '#EC0000' }}>.</span>
                    </h2>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Form content */}
            <AnimatePresence custom={dir} mode="wait">
              {step === 'email' && (
                <motion.form key="email" custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={handleEmailSubmit} aria-label={t('auth.forgotPasswordTitle')}
                  className="mt-10 space-y-4">

                  <FloatInput
                    type="email" placeholder={t('auth.emailPlaceholder')} value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }} autoFocus
                    icon={<Mail className="w-[18px] h-[18px]" />}
                    id="forgot-email"
                  />

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        role="alert" aria-live="assertive"
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
                        style={{ background: 'rgba(236,0,0,0.08)', borderColor: 'rgba(236,0,0,0.20)' }}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#EC0000' }} />
                        <p className="text-xs font-body font-medium" style={{ color: '#EC0000' }}>{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-2">
                    <AuthSubmitButton loading={loading} label={t('auth.continue')} icon={<ArrowRight className="w-[18px] h-[18px]" />} />
                  </div>

                  <div className="pt-4 text-center">
                    <p className="text-xs font-body text-gray-400 dark:text-white/35">
                      {t('auth.rememberPassword')}{' '}
                      <Link to="/login" className="font-bold transition-colors hover:opacity-80" style={{ color: '#EC0000' }}>{t('auth.doLogin')}</Link>
                    </p>
                  </div>
                </motion.form>
              )}

              {step === 'password' && (
                <motion.form key="password" custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={handlePasswordSubmit} aria-label={t('auth.resetPassword')}
                  className="mt-10 space-y-4">

                  <FloatInput
                    type={showPw ? 'text' : 'password'} placeholder={t('auth.newPassword')} value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setError(''); }}
                    icon={<Lock className="w-[18px] h-[18px]" />}
                    id="forgot-new-password"
                    right={
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
                        className="text-gray-400 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/60 transition-colors flex-shrink-0 p-0.5">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <FloatInput
                    type={showCPw ? 'text' : 'password'} placeholder={t('auth.confirmNewPassword')} value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    icon={<Lock className="w-[18px] h-[18px]" />}
                    id="forgot-confirm-password"
                    right={
                      <button type="button" onClick={() => setShowCPw(v => !v)}
                        aria-label={showCPw ? t('auth.hidePassword') : t('auth.showPassword')}
                        className="text-gray-400 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/60 transition-colors flex-shrink-0 p-0.5">
                        {showCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        role="alert" aria-live="assertive"
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
                        style={{ background: 'rgba(236,0,0,0.08)', borderColor: 'rgba(236,0,0,0.20)' }}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#EC0000' }} />
                        <p className="text-xs font-body font-medium" style={{ color: '#EC0000' }}>{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-2">
                    <AuthSubmitButton loading={loading} label={t('auth.resetPassword')} icon={<KeyRound className="w-[18px] h-[18px]" />} />
                  </div>
                </motion.form>
              )}

              {step === 'success' && (
                <motion.div key="success" custom={dir} variants={slideV} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-10 space-y-6">

                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto shadow-lg"
                    style={{ background: 'linear-gradient(to bottom right, #22c55e, #16a34a)', boxShadow: '0 8px 24px rgba(34,197,94,0.25)' }}>
                    <CheckCircle className="w-8 h-8 text-white" />
                  </motion.div>

                  <p className="text-sm font-body text-gray-500 dark:text-white/50 text-center">{t('auth.passwordResetSuccessMsg')}</p>

                  <AuthSubmitButton
                    type="button"
                    loading={false}
                    label={t('auth.goToLogin')}
                    icon={<ArrowRight className="w-[18px] h-[18px]" />}
                    onClick={() => navigate('/login')}
                  />
                </motion.div>
              )}
            </AnimatePresence>

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
