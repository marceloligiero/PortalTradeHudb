import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ROLES = [
  {
    quote:
      '"Acesso formações, recebo feedback dos meus erros, acompanho o plano de acção e evoluo com dados concretos sobre a minha performance."',
    role: 'Gravador',
    subtitle: 'Colaborador de Processamento',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&q=80',
  },
  {
    quote:
      '"Registo erros, crio planos de acção, acompanho a evolução de cada gravador e acesso relatórios de performance da equipa."',
    role: 'Liberador / Formador',
    subtitle: 'Verificador & Formador',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&q=80',
  },
  {
    quote:
      '"Visão total da operação. Relatórios cruzados, KPIs de qualidade e controlo sobre formações, tutoria e suporte."',
    role: 'Gestor / Administrador',
    subtitle: 'Coordenador de Operações',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=160&q=80',
  },
];

export default function PillarsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(['.testi-header', '.testimonial-card'], { opacity: 1, y: 0 });
        return;
      }
      gsap.from('.testi-header', {
        y: 60, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      });
      gsap.from('.testimonial-card', {
        y: 60, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="para-quem"
      ref={sectionRef}
      className="bg-black px-6"
      style={{ paddingTop: '160px', paddingBottom: '160px' }}
    >
      <div className="max-w-7xl mx-auto">
        <h2
          className="testi-header font-headline font-bold text-white leading-[1.0] mb-20"
          style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)' }}
        >
          Pensado para cada papel na operação.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLES.map((role) => (
            <div
              key={role.role}
              className="testimonial-card bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-8 hover:border-white/[0.12] hover:bg-[#0F0F0F] transition-all duration-300 group cursor-default"
            >
              {/* Decorative quote mark */}
              <div
                className="font-headline text-8xl text-white/[0.03] leading-none mb-2 select-none"
                aria-hidden
              >
                "
              </div>
              {/* Quote */}
              <p className="font-body text-[#666] text-base leading-relaxed mb-8 group-hover:text-[#888] transition-colors duration-300">
                {role.quote}
              </p>
              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={role.image}
                  alt={role.role}
                  loading="lazy"
                  className="w-11 h-11 rounded-full object-cover object-top grayscale opacity-70"
                />
                <div>
                  <div className="font-headline font-bold text-white text-sm">{role.role}</div>
                  <div className="font-body text-[#444] text-xs">{role.subtitle}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
