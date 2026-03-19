import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { useScrollReveal, reveal } from './primitives';

const BENEFITS = ['finalCta.benefit1', 'finalCta.benefit2', 'finalCta.benefit3'];

export default function FinalCTA() {
  const { t } = useTranslation();
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="bg-white dark:bg-[#09090B] pt-32 sm:pt-40 pb-20 sm:pb-28 px-6">
      <style>{`
        @keyframes ctaDotGrid {
          0%   { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes ctaBtnGlow {
          0%, 100% { box-shadow: 0 0 16px rgba(255,255,255,0.12), 0 4px 20px rgba(0,0,0,0.1); }
          50%      { box-shadow: 0 0 32px rgba(255,255,255,0.25), 0 4px 20px rgba(0,0,0,0.1); }
        }
        .cta-dot-grid { animation: ctaDotGrid 25s linear infinite; }
        .cta-btn-glow { animation: ctaBtnGlow 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .cta-dot-grid, .cta-btn-glow { animation: none !important; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto relative z-[2]">
        <div
          className="rounded-3xl relative overflow-hidden"
          style={{
            ...reveal(visible, 0.1),
            boxShadow: visible ? '0 40px 100px rgba(140,0,0,0.25), 0 0 0 1px rgba(236,0,0,0.08)' : 'none',
            transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1), box-shadow 0.8s ease 0.3s',
          }}
        >
          {/* BG Layer 1 — Rich radial gradient */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, #DA0000 0%, #B80000 40%, #8B0000 100%)' }} />

          {/* BG Layer 2 — Dot grid for tech texture */}
          <div
            className="cta-dot-grid absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />

          {/* BG Layer 3 — Soft central glow */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.12), transparent 50%)' }} />

          {/* Content */}
          <div className="relative z-10" style={{ padding: 'clamp(48px, 8vw, 80px) clamp(24px, 5vw, 56px)' }}>

            {/* Title */}
            <div className="text-center" style={reveal(visible, 0.2)}>
              <h2 className="font-headline font-extrabold text-white leading-[1.08] tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}>
                {t('landing.finalCta.titleLine1')}
              </h2>
              {t('landing.finalCta.titleLine2') && (
                <h2 className="font-headline font-extrabold leading-[1.08] tracking-tight mb-8" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', color: 'rgba(255,255,255,0.88)' }}>
                  {t('landing.finalCta.titleLine2')}
                </h2>
              )}
            </div>

            {/* Benefits */}
            <div className="flex flex-col gap-3 max-w-md mx-auto mb-10" style={reveal(visible, 0.35)}>
              {BENEFITS.map((key, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-white/70" />
                  <span className="font-body text-sm leading-relaxed text-white/75">
                    {t(`landing.${key}`)}
                  </span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" style={reveal(visible, 0.5)}>
              <Link
                to="/register"
                className="cta-btn-glow group inline-flex items-center gap-2.5 font-body font-bold text-sm uppercase tracking-wider rounded-xl bg-white text-[#CC0000] transition-all duration-300 hover:scale-105 hover:bg-gray-50"
                style={{ padding: '15px 36px' }}
              >
                {t('landing.finalCta.cta')}
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 font-body font-bold text-sm uppercase tracking-wider rounded-xl text-white border border-white/20 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/40"
                style={{ padding: '15px 36px' }}
              >
                {t('landing.finalCta.ctaSecondary')}
              </Link>
            </div>

            {/* Social proof badge */}
            <div className="text-center mt-10" style={reveal(visible, 0.6)}>
              <div className="mx-auto mb-5 rounded-full" style={{ width: '48px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }} />
              <span className="inline-flex items-center gap-2 font-body text-xs tracking-wide px-5 py-2.5 rounded-full text-white/75 bg-white/[0.07] border border-white/10 backdrop-blur-md">
                <Lock className="w-3.5 h-3.5 text-white/55" />
                {t('landing.finalCta.socialProof')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
