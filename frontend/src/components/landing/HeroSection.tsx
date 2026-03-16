import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLandingImage } from '../../utils/landingImages';
import ImagePlaceholder from '../ImagePlaceholder';
import { useTheme } from '../../contexts/ThemeContext';

// ── Hooks ────────────────────────────────────────────────────────────────────

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 768px)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeroSection() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = useState(false);

  const isMobile          = useIsMobile();
  const prefersReduced    = usePrefersReducedMotion();
  const heroSrc           = getLandingImage('hero-dashboard.png');

  // Show video only when: desktop, no reduced motion, no load error
  const showVideo = !isMobile && !prefersReduced && !videoError;

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white dark:bg-[#09090B]"
      style={{ paddingTop: '80px' }}
    >
      {/* CAMADA 1 — Vídeo de background */}
      {showVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ filter: 'brightness(0.5) saturate(0.3) blur(1px)' }}
          aria-hidden="true"
        >
          <source src="/video/hero-bg.mp4" type="video/mp4" />
          <source src="/video/hero-bg.webm" type="video/webm" />
        </video>
      )}

      {/* CAMADA 2 — Overlay com blur para legibilidade (theme-aware) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: theme === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.90)' }}
      />

      {/* CAMADA 3 — Gradiente fade inferior (theme-aware) */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '200px',
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, transparent, rgba(9,9,11,0.95))'
            : 'linear-gradient(to bottom, transparent, rgba(248,249,251,0.95))',
        }}
      />

      {/* CAMADA 4 — Conteúdo */}
      <div
        ref={contentRef}
        className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center py-20"
        style={{
          opacity: 0,
          transform: 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{
            background: theme === 'dark' ? 'rgba(220,38,38,0.15)' : '#FEF2F2',
            border: theme === 'dark' ? '1px solid rgba(220,38,38,0.3)' : '1px solid #FECACA',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#EC0000' }}
          />
          <span className="font-body text-xs font-semibold uppercase tracking-widest" style={{ color: '#EC0000' }}>
            {t('landing.hero.badge')}
          </span>
        </div>

        {/* H1 */}
        <h1
          className="font-headline font-bold text-[#111827] dark:text-white leading-[1.1] mb-6"
          style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', maxWidth: '800px', margin: '0 auto 24px' }}
        >
          {t('landing.hero.title')}
        </h1>

        {/* Subtitle */}
        <p
          className="font-body text-[#6B7280] dark:text-gray-400 leading-relaxed mx-auto mb-10"
          style={{ fontSize: '1.125rem', maxWidth: '660px' }}
        >
          {t('landing.hero.subtitle')}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="/register"
            className="font-body font-semibold px-7 py-3 rounded-lg text-white transition-colors duration-200"
            style={{ background: '#EC0000', fontSize: '0.9375rem' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#B80000')}
            onMouseLeave={e => (e.currentTarget.style.background = '#EC0000')}
          >
            {t('landing.hero.cta')}
          </a>
          <a
            href="/login"
            className="font-body font-semibold px-7 py-3 rounded-lg border border-gray-300 dark:border-white/20 transition-colors duration-200 text-[#111827] dark:text-white hover:text-[#EC0000] dark:hover:text-[#EC0000]"
            style={{ fontSize: '0.9375rem' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#EC0000')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.2)' : '#D1D5DB')}
          >
            {t('landing.hero.ctaSecondary')}
          </a>
        </div>

        {/* Product dashboard image */}
        <div
          className="relative rounded-2xl overflow-hidden mx-auto border border-gray-200 dark:border-white/10"
          style={{ maxWidth: '900px', boxShadow: '0 24px 80px rgba(0,0,0,0.12)' }}
        >
          {heroSrc ? (
            <img
              src={heroSrc}
              alt={t('landing.hero.dashboardAlt')}
              loading="lazy"
              className="w-full object-cover"
              style={{ aspectRatio: '16/9' }}
            />
          ) : (
            <ImagePlaceholder
              alt={t('landing.hero.dashboardAlt')}
              aspectRatio="16/9"
              className="rounded-2xl"
            />
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: theme === 'dark'
                ? 'linear-gradient(to bottom, transparent 50%, rgba(9,9,11,0.6))'
                : 'linear-gradient(to bottom, transparent 50%, rgba(248,249,251,0.6))',
            }}
          />
        </div>
      </div>
    </section>
  );
}
