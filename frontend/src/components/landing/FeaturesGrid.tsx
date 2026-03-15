import { useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { GraduationCap, ShieldAlert, BarChart3, Headphones, Settings } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '../../lib/cn';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    key: 'formacoes',
    icon: GraduationCap,
    colSpan: 'md:col-span-2 md:row-span-2',
    gradient: 'bg-gradient-to-br from-santander-50 to-white',
    title: 'Formações',
    description:
      'Cursos e planos de treino para gravadores e liberadores. Desde o onboarding de novos colaboradores até formações avançadas por categoria de documento. Certificados incluídos.',
  },
  {
    key: 'tutoria',
    icon: ShieldAlert,
    colSpan: '',
    gradient: 'bg-gradient-to-br from-amber-50 to-white',
    title: 'Tutoria',
    description:
      'Quando o liberador apanha um erro, regista-o aqui. O sistema categoriza, atribui ao gravador e gera um plano de acção com prazos.',
    badge: '⚠ Erros & Planos',
  },
  {
    key: 'relatorios',
    icon: BarChart3,
    colSpan: '',
    gradient: 'bg-gradient-to-br from-santander-50/60 to-white',
    title: 'Relatórios',
    description:
      'Quem erra mais? Em quê? As formações estão a funcionar? Quantas incidências chegaram ao cliente este mês?',
  },
  {
    key: 'chamados',
    icon: Headphones,
    colSpan: '',
    gradient: 'bg-gradient-to-br from-[#DEEDF2]/60 to-white',
    title: 'Chamados',
    description:
      'Sistema fora do ar? Dúvida sobre um procedimento? Um quadro Kanban simples para resolver problemas internos.',
  },
  {
    key: 'dados-mestres',
    icon: Settings,
    colSpan: '',
    gradient: 'bg-gradient-to-br from-gray-100 to-white',
    title: 'Dados Mestres',
    description:
      'Gestão de utilizadores, equipas e permissões. Defina quem é gravador, quem é liberador, quem é trainer.',
    badge: 'ADMIN',
  },
];

function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
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

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={() => glowOpacity.set(0)}
      whileHover={{ scale: 1.02, translateY: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <motion.div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(400px circle at ${glowX}px ${glowY}px, rgba(236,0,0,0.08), transparent 60%)`,
          opacity: glowOpacity,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}

export default function FeaturesGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef   = useRef<HTMLDivElement>(null);
  const bentoRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set([titleRef.current, '.bento-card'], { opacity: 1, y: 0, scale: 1 });
        return;
      }
      gsap.from(titleRef.current, {
        y: 80, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: titleRef.current, start: 'top 85%' },
      });
      gsap.from('.bento-card', {
        y: 40, opacity: 0, scale: 0.95, duration: 0.7,
        stagger: { each: 0.15, from: 'start' },
        ease: 'power2.out',
        scrollTrigger: { trigger: bentoRef.current, start: 'top 80%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="funcionalidades" ref={sectionRef} className="py-24 md:py-32 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={titleRef} className="text-center mb-16">
          <span className="inline-block font-body text-xs font-bold uppercase tracking-widest text-santander-500 mb-4">
            Os 5 Portais
          </span>
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tudo o que a operação precisa.{' '}
            <span className="text-santander-500">Nada que não precise.</span>
          </h2>
          <p className="font-body text-lg text-gray-500 max-w-2xl mx-auto">
            Cinco módulos desenhados para o dia-a-dia real de quem processa documentos.
          </p>
        </div>

        <div ref={bentoRef} className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <GlowCard
                key={feat.key}
                className={cn(
                  'bento-card rounded-2xl p-8 border border-gray-200 hover:border-santander-500/30 transition-colors duration-300 cursor-default shadow-sm',
                  feat.gradient,
                  feat.colSpan
                )}
              >
                <Icon className="w-8 h-8 text-santander-500 mb-4" />
                <h3 className="font-headline text-xl font-bold text-gray-900 mb-2">
                  {feat.title}
                </h3>
                <p className="font-body text-sm text-gray-500 leading-relaxed">
                  {feat.description}
                </p>
                {feat.badge && (
                  <span className="inline-block mt-3 bg-red-50 text-santander-500 text-xs rounded-full px-2.5 py-0.5 font-body font-bold">
                    {feat.badge}
                  </span>
                )}
              </GlowCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
