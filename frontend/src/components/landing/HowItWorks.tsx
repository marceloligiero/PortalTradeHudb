import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileEdit, ShieldCheck, BookOpen, TrendingDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    number: '01',
    icon: FileEdit,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Gravação',
    description:
      'As agências enviam pedidos. O gravador regista cada documento no sistema. As formações garantem que sabe exactamente como fazer.',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=640&q=80',
    imageAlt: 'Profissional a registar dados no computador',
  },
  {
    number: '02',
    icon: ShieldCheck,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    title: 'Conferência',
    description:
      'O liberador confere cada registo. Se encontra um erro, regista-o na tutoria. O gravador recebe um plano de acção para corrigir.',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=640&q=80',
    imageAlt: 'Profissional a rever documento no ecrã',
  },
  {
    number: '03',
    icon: BookOpen,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    title: 'Aprendizagem',
    description:
      'Cada erro vira uma ficha de aprendizagem. Cada padrão de erro gera uma nova formação. A equipa melhora continuamente.',
    image: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=640&q=80',
    imageAlt: 'Formação e mentoring em equipa corporativa',
  },
  {
    number: '04',
    icon: TrendingDown,
    iconBg: 'bg-red-50',
    iconColor: 'text-santander-500',
    title: 'Resultado',
    description:
      'Menos erros internos. Menos incidências no cliente. Mais eficiência operacional. Dados que provam a evolução.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&q=80',
    imageAlt: 'Dashboard com métricas e gráficos de performance',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set([titleRef.current, '.flow-step'], { opacity: 1, y: 0, x: 0 });
        return;
      }

      gsap.from(titleRef.current, {
        y: 60, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: titleRef.current, start: 'top 85%' },
      });

      gsap.from('.flow-step', {
        y: 50, opacity: 0, duration: 0.7, stagger: 0.2, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="como-funciona" ref={sectionRef} className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={titleRef} className="text-center mb-20">
          <span className="inline-block font-body text-xs font-bold uppercase tracking-widest text-santander-500 mb-4">
            Fluxo da Operação
          </span>
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            O sistema que intercepta erros{' '}
            <span className="text-santander-500">antes do cliente.</span>
          </h2>
          <p className="font-body text-lg text-gray-500 max-w-2xl mx-auto">
            Integrado em cada etapa do processamento de documentos.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-20 md:space-y-28">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 1;
            return (
              <div
                key={step.title}
                className={`flow-step flex flex-col ${
                  isEven ? 'md:flex-row-reverse' : 'md:flex-row'
                } items-center gap-12 md:gap-16`}
              >
                {/* Image */}
                <div className="w-full md:w-1/2 relative">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-xl">
                    <img
                      src={step.image}
                      alt={step.imageAlt}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-santander-500 text-white font-body text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                        Etapa {step.number}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="w-full md:w-1/2">
                  <div className={`inline-flex w-12 h-12 ${step.iconBg} rounded-xl items-center justify-center mb-6`}>
                    <Icon className={`w-6 h-6 ${step.iconColor}`} />
                  </div>
                  <h3 className="font-headline text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="font-body text-lg text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
