import { useState, useEffect, useRef } from 'react';

const leftTexts = [
  'El mismo error, otra vez',
  'Correo enviado, nadie respondió',
  '¿Quién capacitó al nuevo?',
  'El cliente llamó a reclamar',
  '¿Dónde está el informe?',
];

const rightTexts = [
  'Error registrado en 30 segundos',
  'Plan de acción automático',
  'Nuevo colaborador productivo en 3 días',
  'Cero incidencias este mes',
  'Reportes en tiempo real',
];

export default function VideoAntesDepues() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handler = () => setTime(v.currentTime);
    v.addEventListener('timeupdate', handler);
    return () => v.removeEventListener('timeupdate', handler);
  }, []);

  const INTERVAL = 1.3;
  const activeLeft = Math.min(
    leftTexts.length - 1,
    Math.floor(Math.max(0, time - 0.5) / INTERVAL)
  );
  const activeRight = Math.min(
    rightTexts.length - 1,
    Math.floor(Math.max(0, time - 0.8) / INTERVAL)
  );
  const showTexts = time >= 0.5 && time < 7.5;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden">

      {/* VIDEO */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="w-full block"
        aria-hidden="true"
      >
        <source src="/video/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* GRADIENT BASE — garante contraste sem parecer artificial */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[45%] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.18) 50%, transparent 100%)',
        }}
      />

      {/* TEXTOS */}
      {showTexts && (
        <div className="absolute inset-0 flex pointer-events-none">

          {/* ESQUERDA — problemas */}
          <div className="w-1/2 flex flex-col justify-end pb-[12%] pl-[4%]">
            <span
              className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-body text-white/50 mb-2"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
            >
              Sin sistema
            </span>
            <p
              key={`left-${activeLeft}`}
              className="text-xs sm:text-sm md:text-base font-body font-semibold text-white/[0.88] max-w-[85%] leading-snug animate-[cineFadeIn_0.5s_ease_forwards]"
              style={{
                textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 24px rgba(0,0,0,0.3)',
              }}
            >
              {leftTexts[activeLeft]}
            </p>
          </div>

          {/* DIREITA — soluções */}
          <div className="w-1/2 flex flex-col justify-end pb-[12%] pr-[4%] items-end text-right">
            <span
              className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-body text-white/50 mb-2"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
            >
              Con TradeDataHub
            </span>
            <p
              key={`right-${activeRight}`}
              className="text-xs sm:text-sm md:text-base font-body font-semibold text-white/[0.88] max-w-[85%] leading-snug animate-[cineFadeIn_0.5s_ease_forwards]"
              style={{
                textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 24px rgba(0,0,0,0.2)',
              }}
            >
              {rightTexts[activeRight]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
