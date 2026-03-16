import { useEffect, useRef } from 'react';
import { getLandingImage } from '../../utils/landingImages';
import ImagePlaceholder from '../ImagePlaceholder';

// Vídeo de background — se não existir, fallback para bg branco
const _videos = import.meta.glob(
  '/src/assets/video/*',
  { eager: true, import: 'default' }
) as Record<string, string>;

function getVideo(filename: string): string | null {
  const key = Object.keys(_videos).find((k) => k.endsWith(`/${filename}`));
  return key ? (_videos[key] ?? null) : null;
}

export default function HeroSection() {
  const contentRef = useRef<HTMLDivElement>(null);
  const heroSrc   = getLandingImage('hero-dashboard.png');
  const videoSrc  = getVideo('hero-bg.mp4');

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="relative overflow-hidden bg-white"
      style={{ paddingTop: '96px' }}
    >
      {/* ── Vídeo de background (só carrega se o ficheiro existir) ── */}
      {videoSrc && (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ filter: 'brightness(0.9) saturate(0.8)' }}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          {/* Overlay branco para manter legibilidade do texto */}
          <div className="absolute inset-0 bg-white/80 pointer-events-none" />
        </>
      )}

      {/* ── Conteúdo ── */}
      <div
        ref={contentRef}
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        style={{
          paddingTop: '72px',
          paddingBottom: '64px',
          opacity: 0,
          transform: 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#EC0000' }}
          />
          <span className="font-body text-xs font-semibold uppercase tracking-widest" style={{ color: '#EC0000' }}>
            Plataforma Operacional Interna · 5 Portais · 3 Idiomas
          </span>
        </div>

        {/* H1 */}
        <h1
          className="font-headline font-bold text-[#111827] leading-[1.1] mb-6"
          style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', maxWidth: '800px', margin: '0 auto 24px' }}
        >
          Corrija problemas de qualidade antes que se tornem problemas de negócio.
        </h1>

        {/* Subtitle */}
        <p
          className="font-body text-[#6B7280] leading-relaxed mx-auto mb-10"
          style={{ fontSize: '1.125rem', maxWidth: '660px' }}
        >
          O TradeDataHub substitui o combate reactivo a erros por gestão proactiva e automatizada
          da qualidade operacional. Gravadores, liberadores e gestores trabalham juntos numa única
          plataforma. Proteja os seus clientes, melhore os seus processos.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="/login"
            className="font-body font-semibold px-7 py-3 rounded-lg text-white transition-colors duration-200"
            style={{ background: '#EC0000', fontSize: '0.9375rem' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#B80000')}
            onMouseLeave={e => (e.currentTarget.style.background = '#EC0000')}
          >
            Agendar Demo
          </a>
          <a
            href="#como-funciona"
            className="font-body font-semibold px-7 py-3 rounded-lg border transition-colors duration-200 text-[#111827] hover:text-[#EC0000]"
            style={{ borderColor: '#E5E7EB', fontSize: '0.9375rem' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#EC0000')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
          >
            Tour do Produto
          </a>
        </div>

        {/* Product visual (dashboard) */}
        <div
          className="relative rounded-2xl overflow-hidden mx-auto"
          style={{ maxWidth: '900px', boxShadow: '0 24px 80px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB' }}
        >
          {heroSrc ? (
            <img
              src={heroSrc}
              alt="Dashboard analítico do TradeDataHub"
              loading="lazy"
              className="w-full object-cover"
              style={{ aspectRatio: '16/9' }}
            />
          ) : (
            <ImagePlaceholder
              alt="Dashboard analítico do TradeDataHub"
              aspectRatio="16/9"
              className="rounded-2xl"
            />
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(248,249,251,0.6))' }}
          />
        </div>
      </div>

      {/* Gradient to next section */}
      <div
        className="relative z-10"
        style={{ height: '60px', background: 'linear-gradient(to bottom, #fff, #F8F9FB)' }}
      />
    </section>
  );
}
