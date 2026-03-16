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

interface ChatMsg {
  sender: string;
  avatar: string;
  color: string;
  text: string;
  time: string;
}

const INCOMING_MESSAGES: ChatMsg[] = [
  { sender: 'Carlos M.',     avatar: 'CM', color: '#EF4444', text: '¿Otra vez el mismo error? ¿Nadie revisa esto?',       time: 'Hace 2 min'  },
  { sender: 'Ana Directora', avatar: 'AD', color: '#F97316', text: 'El cliente llamó a reclamar. Necesito respuestas.',    time: 'Hace 5 min'  },
  { sender: 'Luis Ops',      avatar: 'LO', color: '#EAB308', text: '¿Quién capacitó al nuevo? Ya van 3 errores hoy.',     time: 'Hace 8 min'  },
  { sender: 'Marta S.',      avatar: 'MS', color: '#EF4444', text: 'El informe de ayer sigue sin aparecer.',              time: 'Hace 12 min' },
  { sender: 'Dir. Regional', avatar: 'DR', color: '#DC2626', text: 'Esto no puede volver a pasar. Quiero soluciones.',    time: 'Hace 15 min' },
];

const OUTGOING_MESSAGES: ChatMsg[] = [
  { sender: 'Tú', avatar: '✓', color: '#22C55E', text: 'Error registrado. Plan de acción creado automáticamente.',       time: 'Ahora' },
  { sender: 'Tú', avatar: '✓', color: '#22C55E', text: 'Cliente gestionado. Seguimiento activo en el sistema.',          time: 'Ahora' },
  { sender: 'Tú', avatar: '✓', color: '#22C55E', text: 'Nuevo colaborador productivo en 3 días con onboarding digital.', time: 'Ahora' },
  { sender: 'Tú', avatar: '✓', color: '#22C55E', text: 'Informe actualizado en tiempo real. Cero incidencias este mes.', time: 'Ahora' },
  { sender: 'Tú', avatar: '✓', color: '#22C55E', text: 'Errores recurrentes bajaron un 74%. Datos en el dashboard.',     time: 'Ahora' },
];

const INTERVAL = 1.4;

// ── Film grain SVG (inline, no external request) ──────────────────────────────
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeroSection() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoError, setVideoError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [time, setTime] = useState(0);

  const isMobile = useIsMobile();
  const prefersReduced = usePrefersReducedMotion();
  const showVideo = !isMobile && !prefersReduced && !videoError;

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
    const onTime = () => setTime(v.currentTime);
    const onLoaded = () => setIsLoaded(true);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadeddata', onLoaded);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadeddata', onLoaded);
    };
  }, [showVideo]);

  const leftCount  = Math.min(INCOMING_MESSAGES.length, Math.floor(Math.max(0, time - 0.3) / INTERVAL) + 1);
  const rightCount = Math.min(OUTGOING_MESSAGES.length, Math.floor(Math.max(0, time - 0.8) / INTERVAL) + 1);
  const showTexts  = showVideo && isLoaded && time >= 0.3;
  const showEffects = showVideo && isLoaded;
  const showTyping  = showTexts && leftCount >= INCOMING_MESSAGES.length;

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-[#09090B]"
      style={{ paddingTop: '80px' }}
    >
      {/* ── CAMADA 1 — Vídeo ─────────────────────────────────────────── */}
      {showVideo && (
        <video
          ref={videoRef}
          autoPlay
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

      {/* ── CAMADA 2 — Film grain ─────────────────────────────────────── */}
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

      {/* ── CAMADA 3 — Color grading ──────────────────────────────────── */}
      {showEffects && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-soft-light"
          style={{
            background: 'linear-gradient(135deg, rgba(0,20,60,0.08) 0%, transparent 40%, transparent 60%, rgba(60,20,0,0.06) 100%)',
          }}
        />
      )}

      {/* ── CAMADA 4 — Overlay semitransparente ───────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: theme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.72)',
        }}
      />

      {/* ── CAMADA 5 — Vinheta ────────────────────────────────────────── */}
      {showEffects && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.30) 100%)',
          }}
        />
      )}

      {/* ── CAMADA 6 — Gradiente fade inferior ────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '240px',
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, transparent, rgba(9,9,11,1))'
            : 'linear-gradient(to bottom, transparent, rgba(248,249,251,1))',
        }}
      />

      {/* ── CAMADA 7 — Linha divisória central ────────────────────────── */}
      {showEffects && (
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] pointer-events-none z-[5]">
          <div className="absolute inset-0 bg-white/15" />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(236,0,0,0.35) 25%, rgba(236,0,0,0.55) 50%, rgba(236,0,0,0.35) 75%, transparent 100%)',
              animation: 'lineGlow 3s ease-in-out infinite',
            }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[#EC0000]"
            style={{
              boxShadow: '0 0 6px rgba(236,0,0,0.7), 0 0 16px rgba(236,0,0,0.35)',
              animation: 'particleDrop 4s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* ── CAMADA 8 — Chat estilo Teams ──────────────────────────────── */}
      {showTexts && (
        <div className="absolute inset-0 pointer-events-none z-[6] flex">

          {/* ESQUERDA — cobranças (incoming) */}
          <div className="w-1/2 flex flex-col justify-end pb-[8%] pl-[2%] pr-[1%] gap-1.5 overflow-hidden">
            <span
              className="self-start text-[9px] uppercase tracking-[0.2em] font-body font-semibold text-white/90 px-2 py-0.5 rounded mb-1"
              style={{
                background: 'rgba(239,68,68,0.25)',
                border: '1px solid rgba(239,68,68,0.35)',
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
              }}
            >
              {t('landing.hero.video.labelLeft')}
            </span>

            {INCOMING_MESSAGES.slice(0, leftCount).map((msg, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5"
                style={{
                  animation: 'chatSlideInLeft 0.4s ease forwards',
                  animationDelay: `${i * 0.05}s`,
                  opacity: 0,
                }}
              >
                {/* Avatar */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5"
                  style={{ background: msg.color }}
                >
                  {msg.avatar}
                </div>
                {/* Bubble */}
                <div
                  className="flex-1 rounded-xl rounded-tl-sm px-2.5 py-1.5"
                  style={{
                    background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="text-[10px] font-semibold font-body" style={{ color: msg.color }}>
                      {msg.sender}
                    </span>
                    <span className="text-[9px] text-white/30 font-body">{msg.time}</span>
                  </div>
                  <p
                    className="text-[11px] font-body text-white/80 leading-snug"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                  >
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {showTyping && (
              <div className="flex items-center gap-1.5 pl-7 mt-0.5">
                <div
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl rounded-tl-sm"
                  style={{
                    background: 'rgba(0,0,0,0.40)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {[0, 1, 2].map(d => (
                    <span
                      key={d}
                      className="w-1 h-1 rounded-full bg-white/50 inline-block"
                      style={{
                        animation: 'typingDot 1s ease-in-out infinite',
                        animationDelay: `${d * 0.2}s`,
                      }}
                    />
                  ))}
                  <span className="text-[9px] text-white/35 font-body ml-1">{t('landing.hero.video.typing')}</span>
                </div>
              </div>
            )}
          </div>

          {/* DIREITA — respostas positivas (outgoing) */}
          <div className="w-1/2 flex flex-col justify-end pb-[8%] pr-[2%] pl-[1%] gap-1.5 overflow-hidden items-end">
            <span
              className="text-[9px] uppercase tracking-[0.2em] font-body font-semibold text-white/90 px-2 py-0.5 rounded mb-1"
              style={{
                background: 'rgba(34,197,94,0.20)',
                border: '1px solid rgba(34,197,94,0.35)',
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
              }}
            >
              {t('landing.hero.video.labelRight')}
            </span>

            {OUTGOING_MESSAGES.slice(0, rightCount).map((msg, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 flex-row-reverse w-full"
                style={{
                  animation: 'chatSlideInRight 0.4s ease forwards',
                  animationDelay: `${i * 0.05}s`,
                  opacity: 0,
                }}
              >
                {/* Avatar */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                  style={{ background: msg.color }}
                >
                  {msg.avatar}
                </div>
                {/* Bubble */}
                <div
                  className="flex-1 rounded-xl rounded-tr-sm px-2.5 py-1.5"
                  style={{
                    background: 'rgba(34,197,94,0.15)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(34,197,94,0.20)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  }}
                >
                  <div className="flex items-baseline gap-1.5 justify-end mb-0.5">
                    <span className="text-[9px] text-white/30 font-body">{msg.time}</span>
                    <span className="text-[9px] text-green-400/80">✓✓</span>
                  </div>
                  <p
                    className="text-[11px] font-body text-white/85 leading-snug text-right"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                  >
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ── CAMADA 10 — Indicador "Live" ──────────────────────────────── */}
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

      {/* ── CAMADA 11 — Conteúdo principal ────────────────────────────── */}
      <div
        ref={contentRef}
        className={showVideo
          ? 'absolute top-[14%] inset-x-0 z-10 px-8 text-center'
          : 'relative z-10 w-full max-w-4xl mx-auto px-6 text-center py-24'
        }
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
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            margin: '0 auto 24px',
            maxWidth: '820px',
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
          className="font-body leading-relaxed mb-12"
          style={{
            fontSize: '1rem',
            maxWidth: '580px',
            margin: '0 auto 40px',
            color: theme === 'dark' ? 'rgba(255,255,255,0.80)' : '#374151',
          }}
        >
          {t('landing.hero.subtitle')}
        </p>
      </div>
    </section>
  );
}
