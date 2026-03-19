import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Shield, Lock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BrandPanelProps {
  variant: 'login' | 'register' | 'forgot';
  step?: number;
}

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/**
 * BrandPanel — Left-side brand showcase for auth pages.
 * Three variants: login (static), register (with step indicator), forgot (recovery messaging).
 */
export default function BrandPanel({ variant, step = 0 }: BrandPanelProps) {
  const { t } = useTranslation();

  const CONFIGS = {
    login: {
      badge: t('auth.brandPanel.loginBadge'),
      title1: t('auth.brandPanel.loginTitle1'),
      title2: t('auth.brandPanel.loginTitle2'),
      highlight: t('auth.brandPanel.loginHighlight'),
      title3: t('auth.brandPanel.loginTitle3'),
      desc: t('auth.brandPanel.loginDesc'),
      deco: '→',
    },
    register: {
      badge: t('auth.brandPanel.registerBadge'),
      title1: t('auth.brandPanel.registerTitle1'),
      title2: t('auth.brandPanel.registerTitle2'),
      highlight: t('auth.brandPanel.registerHighlight'),
      title3: '',
      desc: t('auth.brandPanel.registerDesc'),
      deco: '+',
    },
    forgot: {
      badge: t('auth.brandPanel.forgotBadge'),
      title1: t('auth.brandPanel.forgotTitle1'),
      title2: t('auth.brandPanel.forgotTitle2'),
      highlight: t('auth.brandPanel.forgotHighlight'),
      title3: '',
      desc: t('auth.brandPanel.forgotDesc'),
      deco: '?',
    },
  };

  const c = CONFIGS[variant];

  const STEP_TITLES = variant === 'register' ? [
    { title: t('auth.steps.identity'), sub: t('auth.steps.identitySub') },
    { title: t('auth.steps.credentials'), sub: t('auth.steps.credentialsSub') },
    { title: t('auth.steps.confirmation'), sub: t('auth.steps.confirmationSub') },
  ] : [];

  return (
    <div className="hidden lg:flex flex-col justify-between p-14 relative">
      {/* Dot-grid pattern */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(128,128,128,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Large decorative character */}
      <div className="absolute -right-20 top-1/2 -translate-y-1/2 text-[28rem] font-black text-gray-900/[0.02] dark:text-white/[0.015] leading-none select-none pointer-events-none">
        {c.deco}
      </div>

      <div className="relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
            style={{ background: 'rgba(236,0,0,0.10)', border: '1px solid rgba(236,0,0,0.20)' }}>
            <Zap className="w-3 h-3" style={{ color: '#EC0000' }} />
            <span className="text-[11px] font-body font-bold uppercase tracking-wider" style={{ color: '#EC0000' }}>
              {c.badge}
            </span>
          </div>

          <h1 className="text-5xl xl:text-6xl font-headline font-bold text-gray-900 dark:text-white leading-[1.05] tracking-tight">
            {c.title1}<br />
            {variant === 'register' || variant === 'forgot' ? (
              <><span className="bg-gradient-to-r from-[#EC0000] via-[#FF3333] to-[#FF6600] bg-clip-text text-transparent">{c.highlight}</span> {c.title2}</>
            ) : (
              <>{c.title2} <span className="bg-gradient-to-r from-[#EC0000] via-[#FF3333] to-[#FF6600] bg-clip-text text-transparent">{c.highlight}</span></>
            )}
            {c.title3 && <><br />{c.title3}</>}
          </h1>

          <p className="mt-6 font-body text-gray-500 dark:text-white/60 text-base leading-relaxed max-w-md">
            {c.desc}
          </p>
        </motion.div>

        {/* Security indicators (login + forgot) */}
        {(variant === 'login' || variant === 'forgot') && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
            className="mt-10 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: '#EC0000' }} />
              <span className="text-xs font-body font-medium text-gray-500 dark:text-white/50">{t('auth.brandPanel.secure')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" style={{ color: '#EC0000' }} />
              <span className="text-xs font-body font-medium text-gray-500 dark:text-white/50">{t('auth.brandPanel.encrypted')}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Step indicator (register only) */}
      {variant === 'register' && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: EASE }}
          className="relative z-10 mt-auto pt-8">
          <div className="flex items-center gap-4 mb-6">
            {[0, 1, 2].map(i => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      scale: i === step ? 1.1 : 1,
                      background: i < step ? '#22c55e' : i === step ? '#EC0000' : 'rgba(128,128,128,0.15)',
                      boxShadow: i === step ? '0 0 20px rgba(236,0,0,0.4)' : 'none',
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white">
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </motion.div>
                  <div className="hidden xl:block">
                    <p className={`text-xs font-body font-bold ${i <= step ? 'text-gray-700 dark:text-white/70' : 'text-gray-400 dark:text-white/40'}`}>{STEP_TITLES[i].title}</p>
                    <p className="text-[10px] font-body text-gray-400 dark:text-white/30">{STEP_TITLES[i].sub.split('.')[0]}</p>
                  </div>
                </div>
                {i < 2 && (
                  <motion.div
                    animate={{ background: i < step ? '#22c55e' : 'rgba(128,128,128,0.12)' }}
                    className="flex-1 h-px rounded-full hidden xl:block"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      )}

      {/* Bottom accent line + copyright */}
      <div className="relative z-10 mt-8">
        <div className="h-px bg-gradient-to-r from-[#EC0000]/30 via-gray-300 dark:via-white/10 to-transparent" />
        <p className="mt-4 text-[11px] font-body text-gray-400 dark:text-white/30 font-medium">
          {t('auth.copyrightFull')}
        </p>
      </div>
    </div>
  );
}
