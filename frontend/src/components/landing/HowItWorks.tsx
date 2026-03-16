import { useState, useEffect, useRef } from 'react';
import { Edit, ShieldCheck, BookOpen, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    number: 1,
    icon: Edit,
    title: 'Gravar com Formação',
    description:
      'As agências enviam documentos. O gravador regista cada pedido no sistema. As formações garantem que sabe exactamente como fazer — desde o primeiro dia, com plano de treino personalizado.',
  },
  {
    number: 2,
    icon: ShieldCheck,
    title: 'Conferir com Registo',
    description:
      'O liberador confere cada registo. Se encontra um erro, regista-o na tutoria com categoria e tipo (interno vs incidência). O gravador recebe notificação e plano de acção. Nada se perde.',
  },
  {
    number: 3,
    icon: BookOpen,
    title: 'Aprender com os Erros',
    description:
      'Cada erro gera ficha de aprendizagem. Cada padrão de erro alimenta novas formações. As incidências — erros que chegaram ao cliente — são documentadas e partilhadas com a equipa.',
  },
  {
    number: 4,
    icon: TrendingUp,
    title: 'Melhorar com Dados',
    description:
      'Relatórios cruzam formações e erros. Mostram quem melhora, quem precisa de atenção, e se as formações estão a funcionar. Decisões baseadas em dados, não em intuição.',
  },
];

export default function HowItWorks() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const reveal: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease',
  };

  return (
    <section
      id="como-funciona"
      ref={sectionRef}
      className="bg-white"
      style={{ padding: '100px 24px' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16" style={reveal}>
          {/* Left — sticky header + CTAs */}
          <div className="lg:sticky lg:top-24 self-start">
            <span
              className="font-body text-xs font-bold uppercase tracking-widest"
              style={{ color: '#EC0000' }}
            >
              Como Funciona
            </span>
            <h2
              className="font-headline font-bold text-[#111827] leading-[1.15] mt-3 mb-4"
              style={{ fontSize: 'clamp(1.875rem, 4vw, 2.75rem)' }}
            >
              O TradeDataHub integra contexto, automação e colaboração num ciclo contínuo de qualidade.
            </h2>
            <p className="font-body text-[#6B7280] mb-8" style={{ fontSize: '1rem' }}>
              A plataforma aprende com os erros, mantém as regras certas e alerta as pessoas certas
              antes que os problemas se espalhem.
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="font-body font-semibold text-sm px-5 py-2.5 rounded-lg text-white transition-colors duration-200"
                style={{ background: '#EC0000' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#B80000')}
                onMouseLeave={e => (e.currentTarget.style.background = '#EC0000')}
              >
                Ver o Produto
              </Link>
              <a
                href="#funcionalidades"
                className="font-body font-semibold text-sm px-5 py-2.5 rounded-lg border text-[#111827] transition-colors duration-200 hover:text-[#EC0000]"
                style={{ borderColor: '#E5E7EB' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#EC0000')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
              >
                Tour do Produto
              </a>
            </div>
          </div>

          {/* Right — stepper */}
          <div>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex gap-5">
                  {/* Connector */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-headline font-bold text-sm shrink-0"
                      style={{ background: '#EC0000' }}
                    >
                      {step.number}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="w-px grow mt-2 mb-2" style={{ background: '#E5E7EB' }} />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ paddingBottom: i < STEPS.length - 1 ? '32px' : 0 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 shrink-0" style={{ color: '#EC0000' }} />
                      <h3 className="font-headline font-bold text-[#111827] text-base">
                        {step.title}
                      </h3>
                    </div>
                    <p className="font-body text-[#6B7280] text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
