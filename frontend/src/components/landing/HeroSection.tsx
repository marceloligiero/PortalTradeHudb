import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

// ── Constants ─────────────────────────────────────────────────────────────────

const LEFT_TEXTS = [
  'El mismo error, otra vez',
  'Correo enviado, nadie respondió',
  '¿Quién capacitó al nuevo?',
  'El cliente llamó a reclamar',
  '¿Dónde está el informe?',
];

const RIGHT_TEXTS = [
  'Error registrado en 30 segundos',
  'Plan de acción automático',
  'Nuevo colaborador productivo en 3 días',
  'Cero incidencias este mes',
  'Reportes en tiempo real',
];

const INTERVAL = 1.4;

// ── Film grain SVG (inline, no external request) ──────────────────────────────
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeroSection() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);

  const [videoError, setVideoError] = useState(false);
  const [isLoaded,   setIsLoaded]   = useState(false);
  const [time,       setTime]       = useState(0);

  const isMobile       = useIsMobile();
  const prefersReduced = usePrefersReducedMotion();
  const showVideo      = !isMobile && !prefersReduced && !videoError;

  // Content fade-in on mount
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  // Video events: timeupdate + loadeddata
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime   = () => setTime(v.currentTime);
    const onLoaded = () => setIsLoaded(true);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadeddata', onLoaded);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadeddata', onLoaded);
    };
  }, [showVideo]);

  const activeLeft  = Math.min(LEFT_TEXTS.length  - 1, Math.floor(Math.max(0, time - 0.3) / INTERVAL));
  const activeRight = Math.min(RIGHT_TEXTS.length - 1, Math.floor(Math.max(0, time - 0.6) / INTERVAL));
  const showTexts   = showVideo && isLoaded && time >= 0.3 && time < 7.5;
  const showEffects = showVideo && isLoaded;

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-[#09090B]"
      style={{ paddingTop: '80px' }}
    >
      {/* ── CAMADA 1 — Vídeo (fade-in ao carregar) ───────────────────── */}
      {showVideo && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000"
          style={{
            filter: 'brightness(0.75) saturate(0.85)',
            opacity: isLoaded ? 1 : 0,
          }}
          aria-hidden="true"
        >
          <source src="/video/hero-bg.mp4" type="video/mp4" />
          <source src="/video/hero-bg.webm" type="video/webm" />
        </video>
      )}

      {/* ── CAMADA 2 — Film grain (textura analógica subtil) ─────────── */}
      {showEffects && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            opacity: 0.035,
            backgroundImage: GRAIN_SVG,
            backgroundSize: '128px 128px',
            animation: 'grainShift 0.5s steps(1) infinite',
          }}
        />
      )}

      {/* ── CAMADA 3 — Color grading (contraste cinematográfico) ─────── */}
      {showEffects && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-soft-light"
          style={{
            background: 'linear-gradient(135deg, rgba(0,20,60,0.08) 0%, transparent 40%, transparent 60%, rgba(60,20,0,0.06) 100%)',
          }}
        />
      )}

      {/* ── CAMADA 4 — Overlay semitransparente ──────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: theme === 'dark'
            ? 'rgba(0,0,0,0.55)'
            : 'rgba(255,255,255,0.72)',
        }}
      />

      {/* ── CAMADA 5 — Vinheta cinematográfica (bordas escuras) ──────── */}
      {showEffects && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.30) 100%)',
          }}
        />
      )}

      {/* ── CAMADA 6 — Gradiente fade inferior ───────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '240px',
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, transparent, rgba(9,9,11,1))'
            : 'linear-gradient(to bottom, transparent, rgba(248,249,251,1))',
        }}
      />

      {/* ── CAMADA 7 — Linha divisória central com glow vermelho ─────── */}
      {showEffects && (
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] pointer-events-none z-[5]">
          {/* Base branca subtil */}
          <div className="absolute inset-0 bg-white/15" />
          {/* Glow vermelho pulsante */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(236,0,0,0.35) 25%, rgba(236,0,0,0.55) 50%, rgba(236,0,0,0.35) 75%, transparent 100%)',
              animation: 'lineGlow 3s ease-in-out infinite',
            }}
          />
          {/* Partícula que desce */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[#EC0000]"
            style={{
              boxShadow: '0 0 6px rgba(236,0,0,0.7), 0 0 16px rgba(236,0,0,0.35)',
              animation: 'particleDrop 4s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* ── CAMADA 8 — Pensamentos das personagens (glassmorphism) ─────── */}
      {showTexts && (
        <div className="absolute inset-0 pointer-events-none z-[6]">

          {/* ESQUERDA — mulher stressada */}
          <div className="absolute w-[48%] left-[2%]" style={{ top: '10%' }}>
            <div className="mb-3">
              <span
                className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-body text-white/40"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
              >
                Sin sistema
              </span>
            </div>
            <div
              key={`thought-L-${activeLeft}`}
              className="relative animate-[thoughtBubbleLeft_0.7s_ease_forwards]"
            >
              {/* Conectores — 3 pontos descendentes */}
              <div className="absolute -bottom-5 left-[18%] flex flex-col items-center gap-1 opacity-35">
                <div className="w-1 h-1 rounded-full bg-white/60" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <div className="w-2 h-2 rounded-full bg-white/25" />
              </div>
              {/* Bolha glassmorphism */}
              <div
                className="relative w-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] rounded-2xl rounded-bl-sm px-3 py-2.5 sm:px-4 sm:py-3 animate-[thoughtFloat_3.5s_ease-in-out_infinite_0.7s]"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}
              >
                <p
                  className="text-xs sm:text-sm font-body font-medium text-red-300/90 leading-relaxed"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
                >
                  {LEFT_TEXTS[activeLeft]}
                </p>
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center animate-pulse">
                  <span className="text-[10px] text-red-300">!</span>
                </div>
              </div>
            </div>
          </div>

          {/* DIREITA — mulher confiante */}
          <div className="absolute w-[48%] right-[2%]" style={{ top: '10%' }}>
            <div className="mb-3 text-right">
              <span
                className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-body text-white/40"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
              >
                Con TradeDataHub
              </span>
            </div>
            <div
              key={`thought-R-${activeRight}`}
              className="relative animate-[thoughtBubbleRight_0.7s_ease_forwards]"
            >
              {/* Conectores */}
              <div className="absolute -bottom-5 right-[18%] flex flex-col items-center gap-1 opacity-35">
                <div className="w-1 h-1 rounded-full bg-white/60" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <div className="w-2 h-2 rounded-full bg-white/25" />
              </div>
              {/* Bolha glassmorphism */}
              <div
                className="relative w-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] rounded-2xl rounded-br-sm px-3 py-2.5 sm:px-4 sm:py-3 animate-[thoughtFloat_3.5s_ease-in-out_infinite_0.7s]"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}
              >
                <p
                  className="text-xs sm:text-sm font-body font-medium text-green-300/90 leading-relaxed text-right"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
                >
                  {RIGHT_TEXTS[activeRight]}
                </p>
                <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center">
                  <span className="text-[10px] text-green-300">✓</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── CAMADA 10 — Indicador "Live" ─────────────────────────────── */}
      {showEffects && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 pointer-events-none z-[8]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#EC0000] animate-pulse" />
          <span
            className="text-[9px] uppercase tracking-[0.15em] font-body text-white/35"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
          >
            Live
          </span>
        </div>
      )}

      {/* ── CAMADA 11 — Conteúdo principal ───────────────────────────── */}
      <div
        ref={contentRef}
        className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center py-24"
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
            background: theme === 'dark' ? 'rgba(220,38,38,0.15)' : 'rgba(254,242,242,0.9)',
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
          className="font-headline font-bold leading-[1.1] mb-6"
          style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4rem)',
            maxWidth: '820px',
            margin: '0 auto 24px',
            color: theme === 'dark' ? '#ffffff' : '#111827',
            textShadow: showVideo
              ? theme === 'dark'
                ? '0 2px 20px rgba(0,0,0,0.5)'
                : '0 2px 20px rgba(255,255,255,0.8)'
              : 'none',
          }}
        >
          {t('landing.hero.title')}
        </h1>

        {/* Subtitle */}
        <p
          className="font-body leading-relaxed mx-auto mb-12"
          style={{
            fontSize: '1.125rem',
            maxWidth: '620px',
            color: theme === 'dark' ? 'rgba(255,255,255,0.80)' : '#374151',
          }}
        >
          {t('landing.hero.subtitle')}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/register"
            className="font-body font-semibold px-8 py-3.5 rounded-lg text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#EC0000', fontSize: '0.9375rem', boxShadow: '0 4px 16px rgba(236,0,0,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#B80000')}
            onMouseLeave={e => (e.currentTarget.style.background = '#EC0000')}
          >
            {t('landing.hero.cta')}
          </a>
          <a
            href="/login"
            className="font-body font-semibold px-8 py-3.5 rounded-lg border transition-colors duration-200 hover:border-[#EC0000] hover:text-[#EC0000]"
            style={{
              fontSize: '0.9375rem',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)',
              color: theme === 'dark' ? 'rgba(255,255,255,0.9)' : '#111827',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
            }}
          >
            {t('landing.hero.ctaSecondary')}
          </a>
        </div>
      </div>
    </section>
  );
}
