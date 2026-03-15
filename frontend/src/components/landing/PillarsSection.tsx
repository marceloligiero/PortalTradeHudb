import { useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { UserCog, UserCheck, LayoutDashboard } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ROLES = [
  {
    icon: UserCog,
    title: 'Gravador',
    subtitle: 'Colaborador de Processamento',
    description:
      'Acessa formações, recebe feedback dos seus erros, acompanha o seu plano de acção e evolui com dados concretos sobre a sua performance.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=480&q=80',
    imageAlt: 'Profissional jovem focado no computador',
  },
  {
    icon: UserCheck,
    title: 'Liberador / Trainer',
    subtitle: 'Verificador & Formador',
    description:
      'Regista erros, cria planos de acção, acompanha a evolução de cada gravador e acessa relatórios de performance da equipa.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=480&q=80',
    imageAlt: 'Profissional sénior a rever documentos',
  },
  {
    icon: LayoutDashboard,
    title: 'Gestor / Admin',
    subtitle: 'Coordenador de Operações',
    description:
      'Visão total da operação. Relatórios cruzados, gestão de equipas, KPIs de qualidade e controlo sobre formações, tutoria e suporte.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=480&q=80',
    imageAlt: 'Gestor a analisar relatórios e dashboards',
  },
];

function RoleCard({ role }: { role: typeof ROLES[0] }) {
  const cardRef     = useRef<HTMLDivElement>(null);
  const glowX       = useMotionValue(0);
  const glowY       = useMotionValue(0);
  const glowOpacity = useMotionValue(0);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    glowX.set(e.clientX - rect.left);
    glowY.set(e.clientY - rect.top);
    glowOpacity.set(1);
  };

  const Icon = role.icon;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={() => glowOpacity.set(0)}
      whileHover={{ translateY: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="pillar-card bg-white rounded-2xl border border-gray-200 hover:border-santander-500/30 hover:shadow-xl hover:shadow-red-500/5 transition-colors duration-300 overflow-hidden cursor-default"
      style={{ position: 'relative' }}
    >
      <motion.div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(400px circle at ${glowX}px ${glowY}px, rgba(236,0,0,0.06), transparent 60%)`,
          opacity: glowOpacity,
        }}
      />
      {/* Photo */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={role.image}
          alt={role.imageAlt}
          loading="lazy"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-santander-500 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 relative z-[1]">
        <span className="inline-block font-body text-xs font-bold uppercase tracking-widest text-santander-500 mb-1">
          {role.subtitle}
        </span>
        <h3 className="font-headline text-2xl font-bold text-gray-900 mb-3">
          {role.title}
        </h3>
        <p className="font-body text-gray-500 text-sm leading-relaxed">
          {role.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function PillarsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef   = useRef<HTMLDivElement>(null);
  const cardsRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set([titleRef.current, '.pillar-card'], { opacity: 1, y: 0 });
        return;
      }
      gsap.from(titleRef.current, {
        y: 80, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: titleRef.current, start: 'top 85%' },
      });
      gsap.from('.pillar-card', {
        y: 60, opacity: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out',
        scrollTrigger: { trigger: cardsRef.current, start: 'top 75%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="para-quem" ref={sectionRef} className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={titleRef} className="text-center mb-16">
          <span className="inline-block font-body text-xs font-bold uppercase tracking-widest text-santander-500 mb-4">
            Para Quem
          </span>
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Pensado para cada papel na operação.
          </h2>
          <p className="font-body text-lg text-gray-500 max-w-2xl mx-auto">
            Cada utilizador vê exactamente o que precisa para fazer o seu trabalho melhor.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ROLES.map(role => (
            <RoleCard key={role.title} role={role} />
          ))}
        </div>
      </div>
    </section>
  );
}
