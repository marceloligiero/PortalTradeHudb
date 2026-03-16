import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function FinalCTA() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-white dark:bg-[#09090B]" style={{ padding: '80px 24px' }}>

      {/* Keyframes inline */}
      <style>{`
        @keyframes patternDrift {
          0%   { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.10); }
          50%       { box-shadow: 0 0 40px rgba(255,255,255,0.28); }
        }
        @keyframes floatGlow {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-12px); }
        }
        .cta-pattern      { animation: patternDrift 20s linear infinite; }
        .cta-btn-primary  { animation: glowPulse 3s ease-in-out infinite; }
        .cta-glow-top     { animation: floatGlow 7s ease-in-out infinite; }
        .cta-glow-bottom  { animation: floatGlow 9s ease-in-out infinite reverse; }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div
          className="rounded-3xl text-center relative overflow-hidden"
          style={{
            padding: '96px 48px',
            boxShadow: '0 32px 80px rgba(180,0,0,0.25)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          {/* CAMADA 1 — Gradient diagonal */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #EC0000 0%, #B80000 40%, #CC0000 70%, #EC0000 100%)',
            }}
          />

          {/* CAMADA 2 — Pattern SVG animado */}
          <div
            className="cta-pattern absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* CAMADA 3 — Glow radial central */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)',
            }}
          />

          {/* CAMADA 4 — Círculos decorativos flutuantes */}
          <div
            className="cta-glow-top absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }}
          />
          <div
            className="cta-glow-bottom absolute -bottom-20 -left-20 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }}
          />

          {/* CAMADA 5 — Conteúdo */}
          <div className="relative z-10 max-w-3xl mx-auto">

            {/* Label pill */}
            <span
              className="inline-block px-4 py-1.5 mb-8 text-xs font-body font-bold uppercase tracking-[0.2em] rounded-full"
              style={{
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              {t('landing.finalCta.label')}
            </span>

            {/* Título */}
            <h2
              className="font-headline font-bold text-white leading-[1.1] mb-6"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)' }}
            >
              {t('landing.finalCta.titleLine1')}
              {t('landing.finalCta.titleLine2') && (
                <>
                  <br />
                  <span style={{ color: 'rgba(255,255,255,0.88)' }}>{t('landing.finalCta.titleLine2')}</span>
                </>
              )}
            </h2>

            {/* Subtítulo */}
            <p
              className="font-body leading-relaxed mx-auto mb-10"
              style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.72)', maxWidth: '520px' }}
            >
              {t('landing.finalCta.subtitle')}
            </p>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">

              {/* Primário — branco com seta */}
              <a
                href="/register"
                className="cta-btn-primary group inline-flex items-center gap-2 font-body font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-300 hover:scale-[1.04]"
                style={{
                  background: '#fff',
                  color: '#EC0000',
                  padding: '14px 32px',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                {t('landing.finalCta.cta')}
                <svg
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>

              {/* Secundário — outline branco */}
              <a
                href="/login"
                className="inline-flex items-center gap-2 font-body font-bold text-sm uppercase tracking-wider rounded-lg transition-all duration-300"
                style={{
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.35)',
                  padding: '14px 32px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                }}
              >
                {t('landing.finalCta.ctaSecondary')}
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
