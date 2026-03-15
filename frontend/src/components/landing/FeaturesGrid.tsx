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
    colSpan: 'md:col-span-2',
    title: 'Formações',
    description:
      'Cursos e planos de treino para gravadores e liberadores. Desde o onboarding até formações avançadas por categoria de documento. Certificados incluídos.',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=70',
    hasPhoto: true,
  },
  {
    key: 'tutoria',
    icon: ShieldAlert,
    colSpan: 'md:col-span-1',
    title: 'Tutoria',
    description:
      'O liberador regista erros aqui. O sistema categoriza, atribui ao gravador e gera plano de acção. O erro transforma-se em aprendizagem.',
    hasPhoto: false,
  },
  {
    key: 'relatorios',
    icon: BarChart3,
    colSpan: 'md:col-span-1',
    title: 'Relatórios',
    description:
      'Quem erra mais? Em quê? As formações funcionam? Relatórios por equipa, gravador e categoria de erro.',
    hasPhoto: false,
  },
  {
    key: 'chamados',
    icon: Headphones,
    colSpan: 'md:col-span-2',
    title: 'Chamados',
    description:
      'Dúvida, problema técnico ou pedido de acesso? Kanban simples para resolver sem e-mails perdidos.',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=70',
    hasPhoto: true,
  },
  {
    key: 'dados-mestres',
    icon: Settings,
    colSpan: 'md:col-span-3',
    title: 'Dados Mestres',
    description:
      'Gestão de utilizadores, equipas, roles e permissões. O painel de controlo do administrador.',
    hasPhoto: false,
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
      whileHover={{ translateY: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <motion.div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(400px circle at ${glowX}px ${glowY}px, rgba(236,0,0,0.07), transparent 60%)`,
          opacity: glowOpacity,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}

export default function FeaturesGrid() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(['.bento-header', '.bento-card'], { opacity: 1, y: 0 });
        return;
      }
      gsap.from('.bento-header', {
        y: 60, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      });
      gsap.from('.bento-card', {
        y: 40, opacity: 0, duration: 0.7, stagger: { each: 0.1 }, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="funcionalidades" ref={sectionRef} className="bg-black px-6" style={{ paddingTop: '160px', paddingBottom: '160px' }}>
      <div className="max-w-7xl mx-auto">
        <div className="bento-header mb-16">
          <h2
            className="font-headline font-bold text-white leading-[1.0] mb-1"
            style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)' }}
          >
            Tudo o que a operação precisa.
          </h2>
          <p
            className="font-headline font-bold text-[#333] leading-[1.0]"
            style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)' }}
          >
            Nada que não precise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <GlowCard
                key={feat.key}
                className={cn(
                  'bento-card bg-[#0A0A0A] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] hover:bg-[#0F0F0F] transition-colors duration-300 cursor-default',
                  feat.colSpan
                )}
              >
                {feat.hasPhoto && (feat as { image?: string }).image ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={(feat as { image: string }).image}
                      alt={feat.title}
                      loading="lazy"
                      className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
                  </div>
                ) : null}
                <div className="p-7">
                  <Icon className="w-7 h-7 text-santander-500 mb-4" />
                  <h3 className="font-headline text-white font-bold text-xl mb-2">{feat.title}</h3>
                  <p className="font-body text-[#555] text-sm leading-relaxed">{feat.description}</p>
                </div>
              </GlowCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
