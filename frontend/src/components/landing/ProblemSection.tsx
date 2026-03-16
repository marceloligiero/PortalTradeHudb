import { useEffect, useRef } from 'react';

export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          sectionRef.current?.querySelectorAll<HTMLElement>('.fade-up').forEach((el, i) => {
            setTimeout(() => {
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
            }, i * 120);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const fadeStyle: React.CSSProperties = {
    opacity: 0,
    transform: 'translateY(20px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease',
  };

  return (
    <section ref={sectionRef} className="bg-white" style={{ padding: '100px 24px' }}>
      <div className="max-w-6xl mx-auto">
        <span className="fade-up font-body text-xs font-bold uppercase tracking-widest inline-block mb-4" style={{ ...fadeStyle, color: '#EC0000' }}>
          O Problema
        </span>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <h2
              className="fade-up font-headline font-bold text-[#111827] leading-[1.15] mb-6"
              style={{ ...fadeStyle, fontSize: 'clamp(1.875rem, 4vw, 2.75rem)' }}
            >
              Erros operacionais são um problema de negócio preso em ferramentas técnicas.
            </h2>
            <p
              className="fade-up font-body text-[#6B7280] leading-relaxed mb-5"
              style={{ ...fadeStyle, fontSize: '1rem' }}
            >
              Todos os coordenadores conhecem o padrão: erros são descobertos tarde demais, equipas
              correm para diagnosticar, e correcções chegam muito depois de o cliente já ter sido
              impactado.
            </p>
            <p
              className="fade-up font-body text-[#6B7280] leading-relaxed"
              style={{ ...fadeStyle, fontSize: '1rem' }}
            >
              Registos em Excel não escalam, conferências informais não deixam rastro, e novos
              gravadores aprendem "fazendo" sem plano de formação estruturado. O resultado: os mesmos
              erros repetem-se, incidências chegam ao cliente, e ninguém tem dados para medir a evolução.
            </p>
          </div>

          {/* Flow diagram */}
          <div
            className="fade-up rounded-2xl p-8"
            style={{ ...fadeStyle, background: '#F8F9FB', border: '1px solid #E5E7EB' }}
          >
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-6">
              Sem sistema
            </p>
            <div className="space-y-0">
              {[
                { emoji: '🏦', title: 'Agência', sub: 'Envia documentos',           borderColor: '#E5E7EB', titleColor: '#111827' },
                { emoji: '❌', title: 'Gravador', sub: 'Sem formação estruturada',  borderColor: '#FECACA', titleColor: '#DC2626' },
                { emoji: '❌', title: 'Liberador', sub: 'Sem registo de erros',     borderColor: '#FECACA', titleColor: '#DC2626' },
                { emoji: '💥', title: 'Cliente',  sub: 'Incidência — já tarde',     borderColor: '#DC2626', titleColor: '#DC2626' },
              ].map((row, i, arr) => (
                <div key={row.title}>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg bg-white"
                    style={{ border: `1px solid ${row.borderColor}` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center text-sm shrink-0">
                      {row.emoji}
                    </div>
                    <div>
                      <div className="font-body font-semibold text-sm" style={{ color: row.titleColor }}>
                        {row.title}
                      </div>
                      <div className="font-body text-xs text-[#9CA3AF]">{row.sub}</div>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-px h-5 bg-[#E5E7EB] ml-7" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
