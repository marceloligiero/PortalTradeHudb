import { useState, useEffect, useRef } from 'react';

export default function FinalCTA() {
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
    <section ref={sectionRef} className="bg-white" style={{ padding: '80px 24px' }}>
      <div className="max-w-5xl mx-auto">
        <div
          className="rounded-2xl text-center relative overflow-hidden"
          style={{
            background: '#EC0000',
            padding: '80px 40px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.08 }} aria-hidden>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cta-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-grid)" />
            </svg>
          </div>

          <div className="relative">
            <h2
              className="font-headline font-bold text-white leading-[1.15] mb-4"
              style={{ fontSize: 'clamp(1.875rem, 4vw, 2.75rem)' }}
            >
              Dados de qualidade em horas, não em meses.
            </h2>
            <p
              className="font-body mx-auto mb-8"
              style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', maxWidth: '520px' }}
            >
              Junte-se às equipas que já usam o TradeDataHub para tornar a qualidade operacional
              proactiva, automatizada e partilhada.
            </p>
            <a
              href="/login"
              className="inline-flex font-body font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
              style={{ background: '#fff', color: '#EC0000' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f1f1f1')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              Agendar Demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
