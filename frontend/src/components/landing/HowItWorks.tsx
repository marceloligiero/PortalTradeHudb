import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileEdit, ShieldCheck, BookOpen, TrendingDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    number: '01',
    icon: FileEdit,
    title: 'Gravação',
    description:
      'As agências enviam pedidos. O gravador regista cada documento no sistema. As formações garantem que sabe exactamente como fazer.',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&q=70',
    imageAlt: 'Profissional a registar dados no computador',
  },
  {
    number: '02',
    icon: ShieldCheck,
    title: 'Conferência',
    description:
      'O liberador confere cada registo. Se encontra um erro, regista-o na tutoria. O gravador recebe um plano de acção para corrigir.',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=70',
    imageAlt: 'Profissional a rever documento no ecrã',
  },
  {
    number: '03',
    icon: BookOpen,
    title: 'Aprendizagem',
    description:
      'Cada erro vira uma ficha de aprendizagem. Cada padrão de erro gera uma nova formação. A equipa melhora continuamente.',
    image: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=600&q=70',
    imageAlt: 'Formação corporativa em equipa',
  },
  {
    number: '04',
    icon: TrendingDown,
    title: 'Resultado',
    description:
      'Menos erros internos. Menos incidências no cliente. Mais eficiência operacional. Dados que provam a evolução.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=70',
    imageAlt: 'Dashboard com métricas e gráficos',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(['.flow-header', '.pipeline-card'], { opacity: 1, y: 0 });
        return;
      }
      gsap.from('.flow-header', {
        y: 60, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      });
      gsap.from('.pipeline-card', {
        y: 50, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="como-funciona" ref={sectionRef} className="bg-black px-6" style={{ paddingTop: '160px', paddingBottom: '160px' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flow-header text-center mb-20">
          <h2
            className="font-headline font-bold text-white leading-[1.05] mb-4"
            style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)' }}
          >
            O sistema que intercepta erros{' '}
            <span className="text-santander-500">antes do cliente.</span>
          </h2>
          <p className="font-body text-[#555] text-lg max-w-xl mx-auto">
            Integrado em cada etapa do processamento de documentos.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="pipeline-card group relative bg-[#0A0A0A] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] hover:-translate-y-1 hover:bg-[#0F0F0F] transition-all duration-300 cursor-default"
              >
                {/* Photo */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={step.image}
                    alt={step.imageAlt}
                    loading="lazy"
                    className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-55 group-hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-santander-500" />
                    <span className="font-body text-[#444] text-xs uppercase tracking-widest">{step.number}</span>
                  </div>
                </div>
                {/* Text */}
                <div className="p-6">
                  <h3 className="font-headline font-bold text-white text-xl mb-3">{step.title}</h3>
                  <p className="font-body text-[#555] text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
