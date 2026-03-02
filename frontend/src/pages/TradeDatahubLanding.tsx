import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useInView, useSpring, useMotionTemplate } from 'framer-motion';
import {
  GraduationCap, Shield, BarChart3, LogIn, UserPlus, Sun, Moon,
  ArrowRight, Globe, Sparkles, Users, TrendingUp,
  Check, Zap, Lock, Award, Bot, ChevronDown, Star,
  Target, Eye, Layers, Clock, AlertTriangle, FileCheck,
  LineChart, Gauge, BrainCircuit, Workflow, Trophy,
} from 'lucide-react';

// ── CSS keyframes injected globally ───────────────────────────────────────────
const CSS = `
@keyframes shimmer-lr {
  0%   { background-position: 0%   center; }
  100% { background-position: 300% center; }
}
.text-shimmer {
  background: linear-gradient(90deg,#f87171 0%,#fb923c 18%,#fbbf24 36%,#34d399 54%,#60a5fa 72%,#a78bfa 90%,#f87171 100%);
  background-size: 300% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer-lr 5s linear infinite;
}

@keyframes marquee-x {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.marquee-track { animation: marquee-x 28s linear infinite; }
.marquee-track:hover { animation-play-state: paused; }

@property --card-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes card-border-spin {
  to { --card-angle: 360deg; }
}
.card-glow-border { position: relative; isolation: isolate; }
.card-glow-border::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 24px;
  background: conic-gradient(from var(--card-angle), transparent 70%, var(--glow-c,#ef4444) 85%, transparent 100%);
  animation: card-border-spin 5s linear infinite;
  opacity: 0;
  transition: opacity .5s ease;
  z-index: -1;
}
.card-glow-border:hover::before { opacity: 1; }

@keyframes float-badge {
  0%,100% { transform: translateY(0px) rotate(-1deg); }
  50%      { transform: translateY(-10px) rotate(1deg); }
}
.badge-float { animation: float-badge 3.5s ease-in-out infinite; }
.badge-float-slow { animation: float-badge 4.8s ease-in-out infinite; animation-delay: -1.5s; }

@keyframes glow-breathe {
  0%,100% { opacity:.35; transform:scale(1); }
  50%     { opacity:.65; transform:scale(1.06); }
}
.glow-breathe { animation: glow-breathe 4s ease-in-out infinite; }

@keyframes img-ken-burns {
  0%   { transform: scale(1) translate(0,0); }
  100% { transform: scale(1.08) translate(-2%,-1%); }
}
.img-ken-burns { animation: img-ken-burns 12s ease-in-out infinite alternate; }

/* Pixar / 3-D illustration effect */
.img-pixar {
  filter: url(#pixar-smooth) saturate(2.2) contrast(1.22) brightness(1.09) sepia(0.07) hue-rotate(-4deg);
  image-rendering: auto;
  transition: filter .6s ease;
}
.img-pixar:hover {
  filter: url(#pixar-smooth) saturate(2.6) contrast(1.28) brightness(1.13) sepia(0.08) hue-rotate(-4deg);
}
`;

// ── i18n ──────────────────────────────────────────────────────────────────────
const LANGS = [
  { code: 'pt', label: '🇵🇹 PT' },
  { code: 'es', label: '🇪🇸 ES' },
  { code: 'en', label: '🇺🇸 EN' },
] as const;
type LC = 'pt' | 'es' | 'en';

const T = {
  login:    { pt: 'Entrar',    es: 'Entrar',      en: 'Sign In'  },
  register: { pt: 'Registar', es: 'Registrarse',  en: 'Register' },
  hero_pre: { pt: 'A plataforma que centraliza', es: 'La plataforma que centraliza', en: 'The platform that centralises' },
  hero_post:{ pt: 'nas suas Operações',          es: 'en sus Operaciones',           en: 'across your Operations'        },
  hero_sub: {
    pt: 'Centralize formações, tutoria e relatórios numa única plataforma. Insights em tempo real para cada equipa operacional.',
    es: 'Centralice formaciones, tutoría e informes en una única plataforma. Insights en tiempo real para cada equipo.',
    en: 'Centralise training, tutoring and reporting in one platform. Real-time insights for every operational team.',
  },
  scroll:        { pt: 'Explorar', es: 'Explorar', en: 'Explore' },
  portals_title: { pt: 'Os Nossos Portais',           es: 'Nuestros Portales',        en: 'Our Portals'         },
  portals_sub:   { pt: 'Cada portal desenhado para o seu papel na operação', es: 'Cada portal diseñado para su rol operacional', en: 'Each portal designed for your operational role' },
  features_title:{ pt: 'Porquê o Trade Data Hub?',   es: '¿Por qué Trade Data Hub?', en: 'Why Trade Data Hub?' },
  features_sub: {
    pt: 'Argumentos que convencem qualquer gestor de operações',
    es: 'Argumentos que convencen a cualquier gestor de operaciones',
    en: 'Arguments that convince any operations manager',
  },
  access:        { pt: 'Aceder', es: 'Acceder', en: 'Access' },
  cta_title: {
    pt: 'Pronto para transformar as suas Operações?',
    es: '¿Listo para transformar sus Operaciones?',
    en: 'Ready to transform your Operations?',
  },
  cta_sub: {
    pt: 'Registe-se gratuitamente e comece a usar hoje.',
    es: 'Regístrese gratis y empiece hoy.',
    en: 'Sign up for free and start today.',
  },
  cta_btn: { pt: 'Começar agora', es: 'Empezar ahora', en: 'Get started' },
  footer: {
    pt: 'Trade Data Hub © 2025 · Todos os direitos reservados',
    es: 'Trade Data Hub © 2025 · Todos los derechos reservados',
    en: 'Trade Data Hub © 2025 · All rights reserved',
  },
} as const;

const CYCLE_WORDS = {
  pt: ['Formações', 'Tutoria', 'Relatórios'],
  es: ['Formación', 'Tutoría', 'Informes'],
  en: ['Training', 'Tutoring', 'Reporting'],
};

const MARQUEE_ITEMS = [
  '🎓 Portal de Formações', '🛡️ Portal de Tutoria', '📊 Portal de Relatórios',
  '⚡ Análise MPU em Tempo Real', '🔐 5 Roles de Acesso', '🤖 Chatbot IA',
  '📜 Certificados Digitais', '👥 Equipas por Serviço', '✅ Planos de Ação 5W2H',
  '📈 KPIs Cross-Portal',
];

const PORTALS = [
  {
    key: 'formacoes' as const,
    icon: GraduationCap,
    gradient: 'from-blue-600 to-indigo-600',
    glowRgb: '59,130,246',
    glowCss: '#3b82f6',
    // Unsplash: people collaborating at laptops / training
    photo: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=75&fit=crop',
    photoGradient: 'from-indigo-950/85 via-blue-950/50 to-transparent',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    title:  { pt: 'Portal de Formações', es: 'Portal de Formación', en: 'Training Portal'  },
    desc: {
      pt: 'Cursos, planos de formação, desafios práticos e certificados para cada equipa operacional.',
      es: 'Cursos, planes de formación, desafíos y certificados para cada equipo operacional.',
      en: 'Courses, training plans, challenges and certificates for each operational team.',
    },
    features: {
      pt: ['Cursos e lições estruturados', 'Planos de formação personalizados', 'Desafios com análise MPU', 'Certificados digitais automáticos'],
      es: ['Cursos y lecciones estructurados', 'Planes de formación personalizados', 'Desafíos con análisis MPU', 'Certificados digitales automáticos'],
      en: ['Structured courses & lessons', 'Personalised training plans', 'MPU challenge analysis', 'Automatic digital certificates'],
    },
    roles: { pt: 'Formando · Tutor · Admin', es: 'Alumno · Tutor · Admin', en: 'Trainee · Trainer · Admin' },
  },
  {
    key: 'tutoria' as const,
    icon: Shield,
    gradient: 'from-red-600 to-rose-600',
    glowRgb: '239,68,68',
    glowCss: '#ef4444',
    // Unsplash: manager coaching employee / mentoring
    photo: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=700&q=75&fit=crop',
    photoGradient: 'from-rose-950/85 via-red-950/50 to-transparent',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    title:  { pt: 'Portal de Tutoria',   es: 'Portal de Tutoría',  en: 'Tutoring Portal' },
    desc: {
      pt: 'Registo de erros operacionais, planos de ação 5W2H, análise de reincidência e fluxo de aprovação.',
      es: 'Registro de errores operacionales, planes 5W2H, análisis de reincidencia y flujo de aprobación.',
      en: 'Operational error logging, 5W2H action plans, recurrence analysis and approval workflow.',
    },
    features: {
      pt: ['Registo e classificação de erros', 'Planos de ação com 5W2H', 'Deteção de reincidência', 'Validação por supervisor'],
      es: ['Registro y clasificación de errores', 'Planes de acción 5W2H', 'Detección de reincidencia', 'Validación por supervisor'],
      en: ['Error registration & tagging', '5W2H action plans', 'Recurrence detection', 'Supervisor validation'],
    },
    roles: { pt: 'Tutorado · Tutor · Admin', es: 'Tutorado · Tutor · Admin', en: 'Student · Tutor · Admin' },
  },
  {
    key: 'relatorios' as const,
    icon: BarChart3,
    gradient: 'from-emerald-600 to-teal-600',
    glowRgb: '16,185,129',
    glowCss: '#10b981',
    // Unsplash: analytics / financial charts on laptop
    photo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&q=75&fit=crop',
    photoGradient: 'from-teal-950/85 via-emerald-950/50 to-transparent',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    title:  { pt: 'Portal de Relatórios', es: 'Portal de Informes', en: 'Reports Portal'  },
    desc: {
      pt: 'Insights cruzados de formações e tutoria. Relatórios filtrados por equipa operacional, membro ou serviço.',
      es: 'Insights cruzados de formación y tutoría. Informes por equipo operacional, miembro o servicio.',
      en: 'Cross-portal insights from training and tutoring. Reports by team, member or service.',
    },
    features: {
      pt: ['KPIs cross-portal em tempo real', 'Análise por equipa e membro', 'Evolução de MPU e aprovações', 'Relatórios de erros e planos'],
      es: ['KPIs cross-portal en tiempo real', 'Análisis por equipo y miembro', 'Evolución MPU y aprobaciones', 'Informes de errores y planes'],
      en: ['Real-time cross-portal KPIs', 'Team & member analytics', 'MPU & approval trends', 'Error & plan reports'],
    },
    roles: { pt: 'Todos os níveis · Por serviço', es: 'Todos los niveles · Por servicio', en: 'All levels · By service' },
  },
] as const;

const FEATURES = [
  {
    icon: Eye,
    gradient: 'from-blue-500 to-cyan-500',
    glowRgb: '59,130,246',
    photo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&q=75&fit=crop',
    photoGradient: 'from-blue-950/80 via-cyan-950/40 to-transparent',
    title: { pt: 'Visibilidade Total', es: 'Visibilidad Total', en: 'Total Visibility' },
    desc: {
      pt: 'Veja em tempo real quem está formado, quem tem erros recorrentes e que serviço precisa de ação imediata.',
      es: 'Vea en tiempo real quién está formado, quién tiene errores recurrentes y qué servicio necesita acción.',
      en: 'See in real-time who is trained, who has recurring errors and which service needs immediate action.',
    },
    metric: { pt: '100% dos KPIs num só Dashboard', es: '100% de KPIs en un Dashboard', en: '100% of KPIs in one Dashboard' },
  },
  {
    icon: AlertTriangle,
    gradient: 'from-red-500 to-rose-500',
    glowRgb: '239,68,68',
    photo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=700&q=75&fit=crop',
    photoGradient: 'from-rose-950/80 via-red-950/40 to-transparent',
    title: { pt: 'Redução de Erros Operacionais', es: 'Reducción de Errores', en: 'Error Reduction' },
    desc: {
      pt: 'Identifique padrões de erro por serviço, membro e equipa. Atue antes que se tornem reincidentes.',
      es: 'Identifique patrones de error por servicio, miembro y equipo. Actúe antes que sean reincidentes.',
      en: 'Identify error patterns by service, member and team. Act before they become recurring.',
    },
    metric: { pt: 'Deteção automática de reincidência', es: 'Detección automática de reincidencia', en: 'Automatic recurrence detection' },
  },
  {
    icon: Gauge,
    gradient: 'from-emerald-500 to-teal-500',
    glowRgb: '16,185,129',
    photo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&q=75&fit=crop',
    photoGradient: 'from-teal-950/80 via-emerald-950/40 to-transparent',
    title: { pt: 'MPU — Eficiência Medida', es: 'MPU — Eficiencia Medida', en: 'MPU — Measured Efficiency' },
    desc: {
      pt: 'Minutos por operação: saiba exatamente quanto tempo cada serviço demora e onde otimizar.',
      es: 'Minutos por operación: sepa exactamente cuánto tiempo toma cada servicio y dónde optimizar.',
      en: 'Minutes per operation: know exactly how long each service takes and where to optimise.',
    },
    metric: { pt: 'Benchmark por serviço operacional', es: 'Benchmark por servicio operacional', en: 'Benchmark per operational service' },
  },
  {
    icon: Workflow,
    gradient: 'from-purple-500 to-violet-500',
    glowRgb: '139,92,246',
    photo: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&q=75&fit=crop',
    photoGradient: 'from-violet-950/80 via-purple-950/40 to-transparent',
    title: { pt: 'Planos de Ação Estruturados', es: 'Planes de Acción Estructurados', en: 'Structured Action Plans' },
    desc: {
      pt: 'Metodologia 5W2H aplicada a cada erro. Fluxo de aprovação supervisor → gestor com rastreabilidade total.',
      es: 'Metodología 5W2H aplicada a cada error. Flujo de aprobación supervisor → gestor con trazabilidad total.',
      en: '5W2H methodology for every error. Supervisor → manager approval flow with full traceability.',
    },
    metric: { pt: 'Cada ação com responsável e prazo', es: 'Cada acción con responsable y plazo', en: 'Every action with owner & deadline' },
  },
  {
    icon: BrainCircuit,
    gradient: 'from-amber-500 to-orange-500',
    glowRgb: '245,158,11',
    photo: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=700&q=75&fit=crop',
    photoGradient: 'from-orange-950/80 via-amber-950/40 to-transparent',
    title: { pt: 'Formação Direcionada', es: 'Formación Dirigida', en: 'Targeted Training' },
    desc: {
      pt: 'Cursos e desafios alinhados ao serviço real do colaborador. Sem formações genéricas — cada módulo tem impacto direto.',
      es: 'Cursos y desafíos alineados al servicio real. Sin formaciones genéricas — cada módulo tiene impacto directo.',
      en: 'Courses and challenges aligned to real service. No generic training — every module has direct impact.',
    },
    metric: { pt: 'Certificação automática por serviço', es: 'Certificación automática por servicio', en: 'Automatic certification by service' },
  },
];

const STATS = [
  { value: 3,   suffix: '',   label: { pt: 'Portais',          es: 'Portales',         en: 'Portals'       } },
  { value: 5,   suffix: '',   label: { pt: 'Roles de acesso',  es: 'Roles de acceso',  en: 'Access roles'  } },
  { value: 100, suffix: '%',  label: { pt: 'Dados unificados', es: 'Datos unificados', en: 'Unified data'  } },
  { value: 24,  suffix: '/7', label: { pt: 'Disponibilidade',  es: 'Disponibilidad',   en: 'Availability'  } },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

/* Spotlight card — mouse-tracking radial gradient */
function SpotlightCard({ children, className = '', dark }: { children: React.ReactNode; className?: string; dark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const handleMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  }, [mx, my]);
  const bg = useMotionTemplate`radial-gradient(400px circle at ${mx}px ${my}px, ${dark ? 'rgba(220,38,38,0.1)' : 'rgba(220,38,38,0.05)'}, transparent 70%)`;
  return (
    <div ref={ref} onMouseMove={handleMove} className={`relative group ${className}`}>
      <motion.div className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: bg }} />
      {children}
    </div>
  );
}

function CycleWord({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % words.length), 2800);
    return () => clearInterval(t);
  }, [words]);
  return (
    <span className="inline-block">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[idx]}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
          transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="inline-block text-shimmer"
        >
          {words[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1500, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], ['5deg', '-5deg']);
  const rotateY = useTransform(x, [-0.5, 0.5], ['-5deg', '5deg']);
  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left) / r.width - 0.5); y.set((e.clientY - r.top) / r.height - 0.5); }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={className}
    >{children}</motion.div>
  );
}

// ── Dashboard mockup ───────────────────────────────────────────────────────────

function DashboardMockup({ dark }: { dark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-[420px] mx-auto lg:mx-0">
      {/* Floating stat badges */}
      <div className="badge-float absolute -top-6 -right-4 z-20">
        <div className={`rounded-xl px-3 py-2 border text-xs font-bold shadow-2xl ${dark ? 'bg-[#0e0e18] border-emerald-500/25 text-emerald-400' : 'bg-white border-emerald-200 text-emerald-700 shadow-emerald-100/60'}`}>
          ↑ 87% conclusão
        </div>
      </div>
      <div className="badge-float-slow absolute -bottom-6 -left-4 z-20">
        <div className={`rounded-xl px-3 py-2 border text-xs font-bold shadow-2xl ${dark ? 'bg-[#0e0e18] border-blue-500/25 text-blue-400' : 'bg-white border-blue-200 text-blue-700 shadow-blue-100/60'}`}>
          🎓 3 certificados hoje
        </div>
      </div>

      {/* Browser frame */}
      <div className={`rounded-2xl overflow-hidden border ${dark ? 'border-white/[0.09] bg-[#0b0b12] shadow-[0_40px_100px_-12px_rgba(0,0,0,0.75)]' : 'border-gray-200 bg-white shadow-[0_40px_100px_-12px_rgba(0,0,0,0.18)]'}`}>
        {/* Chrome */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${dark ? 'border-white/[0.06] bg-white/[0.015]' : 'border-gray-100 bg-gray-50/80'}`}>
          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400/80" /><div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" /></div>
          <div className={`flex-1 flex items-center justify-center gap-1 text-[10px] rounded-md px-2 py-1 max-w-[190px] mx-auto ${dark ? 'bg-white/[0.04] text-gray-500' : 'bg-gray-100 text-gray-400'}`}>🔒 tradedatahub.pt</div>
        </div>
        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div><div className={`text-[11px] font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Dashboard</div><div className={`text-[9px] ${dark ? 'text-gray-600' : 'text-gray-400'}`}>Operações · Março 2025</div></div>
            <div className="flex -space-x-1.5">{['J','A','C','M'].map((l,i)=><div key={i} className={`w-5 h-5 rounded-full text-[7px] font-bold text-white flex items-center justify-center ring-[1.5px] ${dark?'ring-[#0b0b12]':'ring-white'} ${['bg-blue-500','bg-emerald-500','bg-red-500','bg-purple-500'][i]}`}>{l}</div>)}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{label:'Formandos',val:24,suffix:'',color:'text-blue-500'},{label:'Erros Abertos',val:3,suffix:'',color:'text-red-500'},{label:'Conclusão',val:87,suffix:'%',color:'text-emerald-500'}].map((k,i)=>(
              <motion.div key={i} initial={{opacity:0,scale:0.85}} animate={inView?{opacity:1,scale:1}:{}} transition={{delay:0.45+i*0.1}} className={`rounded-lg p-2.5 ${dark?'bg-white/[0.04] border border-white/[0.06]':'bg-gray-50 border border-gray-100'}`}>
                <div className={`text-base font-black tabular-nums ${k.color}`}>{inView?<AnimatedCounter target={k.val} suffix={k.suffix}/>:'0'}</div>
                <div className={`text-[8px] mt-0.5 ${dark?'text-gray-500':'text-gray-400'}`}>{k.label}</div>
              </motion.div>
            ))}
          </div>
          <div className={`rounded-xl p-3 ${dark?'bg-white/[0.03] border border-white/[0.05]':'bg-gray-50/70 border border-gray-100'}`}>
            <div className={`text-[9px] font-semibold mb-2.5 ${dark?'text-gray-500':'text-gray-400'}`}>Formações concluídas / semana</div>
            <div className="flex items-end gap-1 h-14">
              {[55,72,48,90,65,95,82].map((h,i)=>(
                <motion.div key={i} initial={{scaleY:0}} animate={inView?{scaleY:1}:{}} transition={{delay:0.65+i*0.07,duration:0.5,ease:[0.34,1.56,0.64,1]}} className="flex-1 rounded-t-sm origin-bottom bg-gradient-to-t from-blue-700 to-blue-400" style={{height:`${h}%`,opacity:.88}}/>
              ))}
            </div>
            <div className="flex justify-between mt-1">{['S','T','Q','Q','S','S','D'].map((d,i)=><span key={i} className={`text-[7px] flex-1 text-center ${dark?'text-gray-700':'text-gray-300'}`}>{d}</span>)}</div>
          </div>
          <div className="space-y-1.5">
            {[{name:'João S.',action:'Concluiu Módulo 3 — Serviço A',dot:'bg-emerald-500'},{name:'Ana C.',action:'Erro ALTA registado',dot:'bg-red-500'},{name:'Carlos M.',action:'Plano 5W2H aprovado',dot:'bg-blue-500'}].map((item,i)=>(
              <motion.div key={i} initial={{opacity:0,x:-8}} animate={inView?{opacity:1,x:0}:{}} transition={{delay:1.05+i*0.1}} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] ${dark?'bg-white/[0.02]':'bg-white border border-gray-50'}`}>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.dot}`}/><span className={`font-semibold flex-shrink-0 ${dark?'text-gray-300':'text-gray-700'}`}>{item.name}</span><span className={`truncate ${dark?'text-gray-600':'text-gray-400'}`}>{item.action}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-blue-600/10 blur-[40px] rounded-full pointer-events-none" />
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function TradeDatahubLanding() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<LC>('pt');
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light');
  const [langOpen, setLangOpen] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => { const h = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY }); window.addEventListener('mousemove', h); return () => window.removeEventListener('mousemove', h); }, []);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 24); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h); }, []);

  const t = (key: keyof typeof T) => T[key][lang];

  return (
    <>
      {/* Inject CSS animations */}
      <style>{CSS}</style>

      {/* Hidden SVG filter for Pixar illustration smoothing */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="pixar-smooth" colorInterpolationFilters="sRGB">
            {/* 1 — Smooth skin / surfaces like a CGI render */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="blur" />
            {/* 2 — Blend: 60 % crisp + 40 % blurred → soft-render feel */}
            <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k1="0" k2="0.60" k3="0.40" k4="0" result="smooth" />
            {/* 3 — Posterise with 8 bands → illustrated / cel-shaded tones */}
            <feComponentTransfer in="smooth" result="poster">
              <feFuncR type="discrete" tableValues="0 0.12 0.25 0.40 0.55 0.70 0.84 1" />
              <feFuncG type="discrete" tableValues="0 0.12 0.25 0.40 0.55 0.70 0.84 1" />
              <feFuncB type="discrete" tableValues="0 0.12 0.25 0.40 0.55 0.70 0.84 1" />
            </feComponentTransfer>
            {/* 4 — Edge sharpen: gives the crisp 3-D-render outline */}
            <feConvolveMatrix in="poster" order="3" preserveAlpha="true" result="sharp"
              kernelMatrix="0 -0.2 0  -0.2 1.8 -0.2  0 -0.2 0" />
            {/* 5 — Warm up colours (Pixar golden-hour palette) */}
            <feColorMatrix in="sharp" type="matrix" result="warm"
              values="1.08 0.02 0    0 0.01
                      0.02 1.04 0.01 0 0.01
                      0    0    0.96 0 -0.01
                      0    0    0    1 0" />
          </filter>
        </defs>
      </svg>

      <div className={`min-h-screen overflow-x-hidden ${dark ? 'bg-[#030307]' : 'bg-slate-50'} transition-colors duration-300`}>

        {/* ── Aurora background ─────────────────────────────────────────── */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div animate={{ x:[0,50,-30,0], y:[0,-40,20,0], scale:[1,1.2,.9,1] }} transition={{ duration:22, repeat:Infinity, ease:'easeInOut' }} className={`absolute -top-[20%] -left-[5%] w-[800px] h-[800px] rounded-full blur-[180px] ${dark?'bg-red-600/[0.07]':'bg-red-500/[0.06]'} glow-breathe`} />
          <motion.div animate={{ x:[0,-40,25,0], y:[0,30,-20,0], scale:[1,.88,1.12,1] }} transition={{ duration:28, repeat:Infinity, ease:'easeInOut', delay:4 }} className={`absolute -bottom-[15%] -right-[5%] w-[700px] h-[700px] rounded-full blur-[160px] ${dark?'bg-blue-600/[0.06]':'bg-blue-500/[0.05]'}`} />
          <motion.div animate={{ x:[0,25,-15,0], y:[0,-25,35,0] }} transition={{ duration:19, repeat:Infinity, ease:'easeInOut', delay:8 }} className={`absolute top-[40%] right-[20%] w-[500px] h-[500px] rounded-full blur-[140px] ${dark?'bg-emerald-600/[0.04]':'bg-emerald-500/[0.04]'}`} />
          <div className="absolute inset-0" style={{ backgroundImage:`radial-gradient(circle,${dark?'rgba(255,255,255,0.055)':'rgba(0,0,0,0.065)'} 1px,transparent 1px)`, backgroundSize:'28px 28px' }} />
          <div className={`absolute inset-0 ${dark?'bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_30%,#030307_85%)]':'bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_30%,#f8fafc_85%)]'}`} />
        </div>

        {/* Mouse spotlight */}
        <div className="fixed inset-0 pointer-events-none z-0" style={{ background:`radial-gradient(700px circle at ${mouse.x}px ${mouse.y}px,${dark?'rgba(239,68,68,0.045)':'rgba(239,68,68,0.03)'},transparent 60%)` }} />

        {/* ── Navbar — floating pill ────────────────────────────────────── */}
        <div className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 pt-4 pointer-events-none">
          <motion.div initial={{ y:-28, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.6, ease:[0.25,0.46,0.45,0.94] }} className="max-w-6xl mx-auto pointer-events-auto">
            <div className="rounded-2xl p-px transition-all duration-500" style={{ background: scrolled ? (dark?'linear-gradient(135deg,rgba(239,68,68,.35) 0%,rgba(30,30,50,.4) 50%,rgba(59,130,246,.2) 100%)':'linear-gradient(135deg,rgba(239,68,68,.25) 0%,rgba(200,200,220,.3) 50%,rgba(59,130,246,.15) 100%)') : (dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.09)') }}>
              <div className={`rounded-[15px] backdrop-blur-2xl transition-all duration-500 ${scrolled?(dark?'bg-[#030307]/92 shadow-2xl shadow-black/40':'bg-white/97 shadow-xl shadow-black/10'):(dark?'bg-[#030307]/55':'bg-white/65')}`}>
                <div className="px-5 h-14 flex items-center justify-between gap-4">
                  {/* Brand */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <img src="/logo-sds.png" alt="SDS" className={`h-8 w-auto object-contain transition-all duration-300 ${dark?'':'brightness-0'}`} />
                    <div className={`h-5 w-px ${dark?'bg-white/15':'bg-gray-300'}`} />
                    <span className={`text-sm font-black tracking-tight whitespace-nowrap ${dark?'text-white/90':'text-gray-800'}`}>Trade<span className="text-red-500">Data</span>Hub</span>
                  </div>
                  {/* Controls */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative">
                      <button onClick={() => setLangOpen(o => !o)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${dark?'border-white/[0.09] text-gray-400 hover:bg-white/[0.07] hover:text-white hover:border-white/15':'border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}>
                        <Globe className="w-3.5 h-3.5" /><span className="hidden sm:inline">{LANGS.find(l=>l.code===lang)?.label}</span><span className="sm:hidden">{lang.toUpperCase()}</span>
                      </button>
                      <AnimatePresence>
                        {langOpen && (
                          <motion.div initial={{opacity:0,scale:.92,y:-4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.92,y:-4}} transition={{duration:.14}} className={`absolute right-0 top-full mt-2 rounded-xl border shadow-2xl overflow-hidden z-20 min-w-[100px] ${dark?'bg-[#0c0c12] border-white/10':'bg-white border-gray-200'}`}>
                            {LANGS.map(l=><button key={l.code} onClick={()=>{setLang(l.code);setLangOpen(false);}} className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${l.code===lang?'text-red-500 font-bold':dark?'text-gray-400 hover:bg-white/5 hover:text-white':'text-gray-600 hover:bg-gray-50'}`}>{l.label}</button>)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button onClick={() => setDark(d=>!d)} className={`p-1.5 rounded-xl border transition-all ${dark?'border-white/[0.09] text-gray-400 hover:bg-white/[0.07] hover:text-white':'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                      <AnimatePresence mode="wait"><motion.div key={dark?'sun':'moon'} initial={{rotate:-30,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:30,opacity:0}} transition={{duration:.2}}>{dark?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}</motion.div></AnimatePresence>
                    </button>
                    <div className={`h-5 w-px mx-0.5 ${dark?'bg-white/10':'bg-gray-200'}`} />
                    <button onClick={()=>navigate('/login')} className={`hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:scale-[1.02] ${dark?'border-white/[0.09] text-gray-300 hover:bg-white/[0.07] hover:border-white/15':'border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                      <LogIn className="w-3.5 h-3.5"/>{t('login')}
                    </button>
                    <button onClick={()=>navigate('/register')} className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.04] overflow-hidden group" style={{background:'linear-gradient(135deg,#dc2626,#b91c1c)'}}>
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 pointer-events-none"/>
                      <UserPlus className="w-3.5 h-3.5 relative"/><span className="relative">{t('register')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Hero — 2 colunas ──────────────────────────────────────────── */}
        <section className="relative z-10 pt-32 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">
              {/* Left */}
              <div className="text-center lg:text-left">
                <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{duration:.55}} className="inline-flex items-center gap-2.5 mb-7">
                  <span className={`relative flex items-center gap-2.5 px-5 py-2 rounded-full text-xs font-bold tracking-[.14em] uppercase border ${dark?'bg-red-500/10 border-red-500/20 text-red-400':'bg-red-50 border-red-200 text-red-600'}`}>
                    <span className="relative flex h-2 w-2 flex-shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60"/><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/></span>
                    <Sparkles className="w-3 h-3"/> Trade Data Hub
                  </span>
                </motion.div>
                <motion.h1 initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.65,delay:.1}} className={`text-4xl sm:text-5xl lg:text-[3.4rem] xl:text-[3.8rem] font-black leading-[1.08] tracking-tight mb-6 ${dark?'text-white':'text-gray-900'}`}>
                  {t('hero_pre')}<br/>
                  <CycleWord words={CYCLE_WORDS[lang]}/><br/>
                  <span className={dark?'text-gray-400':'text-gray-600'}>{t('hero_post')}</span>
                </motion.h1>
                <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.65,delay:.25}} className={`text-base sm:text-lg max-w-xl mb-10 leading-relaxed lg:mx-0 mx-auto ${dark?'text-gray-400':'text-gray-500'}`}>
                  {t('hero_sub')}
                </motion.p>
                <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.5,delay:.4}} className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <button onClick={()=>navigate('/login')} className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold text-sm shadow-2xl shadow-red-600/30 transition-all hover:scale-105 hover:shadow-red-600/45">
                    <LogIn className="w-4 h-4"/>{t('login')}<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1"/>
                  </button>
                  <button onClick={()=>navigate('/register')} className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm border transition-all hover:scale-105 ${dark?'border-white/15 text-gray-300 hover:bg-white/5 hover:border-white/25':'border-gray-200 text-gray-700 hover:bg-white hover:shadow-xl hover:border-gray-300'}`}>
                    <UserPlus className="w-4 h-4"/>{t('register')}
                  </button>
                </motion.div>
                <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.4,duration:.8}} className={`hidden lg:flex flex-col items-start gap-1 mt-12 text-xs ${dark?'text-gray-600':'text-gray-400'}`}>
                  <span>{t('scroll')}</span>
                  <motion.div animate={{y:[0,5,0]}} transition={{duration:1.5,repeat:Infinity,ease:'easeInOut'}}><ChevronDown className="w-4 h-4"/></motion.div>
                </motion.div>
              </div>
              {/* Right: mockup */}
              <div className="hidden lg:flex justify-end"><DashboardMockup dark={dark}/></div>
            </div>
          </div>
        </section>

        {/* ── Marquee strip ─────────────────────────────────────────────── */}
        <div className={`relative z-10 overflow-hidden py-4 border-y ${dark?'border-white/[0.06] bg-white/[0.01]':'border-gray-100 bg-white/80'}`}>
          <div className="marquee-track flex gap-14 w-max">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <div key={i} className={`flex items-center gap-2.5 text-sm font-medium whitespace-nowrap select-none ${dark?'text-gray-400':'text-gray-500'}`}>
                <Star className="w-3 h-3 text-red-500 fill-red-500 flex-shrink-0"/>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats strip ───────────────────────────────────────────────── */}
        <section className={`relative z-10 py-12 ${dark?'':'bg-white'}`}>
          <div className="max-w-3xl mx-auto px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {STATS.map((s,i)=>(
                <motion.div key={i} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.08,duration:.5}} className="text-center">
                  <p className={`text-3xl sm:text-4xl font-black tabular-nums leading-none ${dark?'text-white':'text-gray-900'}`}><AnimatedCounter target={s.value} suffix={s.suffix}/></p>
                  <p className={`text-xs mt-2 ${dark?'text-gray-500':'text-gray-500'}`}>{s.label[lang]}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── "Porquê o Trade Data Hub?" — Premium cards para gestores ── */}
        <section className="relative z-10 py-28 px-6 overflow-hidden">
          {/* Section glow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px] pointer-events-none ${dark ? 'bg-red-600/[0.04]' : 'bg-red-600/[0.02]'}`} />

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16 space-y-4">
              <motion.div initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 200 }}>
                <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-[.12em] uppercase border ${dark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                  <Target className="w-3.5 h-3.5" /> {t('features_title')}
                </span>
              </motion.div>
              <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                {t('features_title')}
              </h2>
              <p className={`text-base max-w-2xl mx-auto ${dark ? 'text-gray-500' : 'text-gray-500'}`}>
                {t('features_sub')}
              </p>
            </motion.div>

            {/* Cards — stacked single-column with Pixar-effect photos */}
            <div className="flex flex-col gap-7 max-w-4xl mx-auto">
              {FEATURES.map((f, idx) => {
                const Icon = f.icon;
                const isEven = idx % 2 === 0;
                return (
                  <SpotlightCard key={idx} dark={dark}>
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ delay: idx * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -6 }}
                      className={`card-glow-border group relative rounded-3xl border overflow-hidden transition-all duration-500 ${
                        dark
                          ? 'bg-white/[0.025] border-white/[0.07] hover:border-white/[0.18] hover:bg-white/[0.05]'
                          : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-xl'
                      }`}
                      style={{ '--glow-c': `rgb(${f.glowRgb})` } as React.CSSProperties}
                    >
                      {/* Horizontal split — photo + body side by side on md+, stacked on mobile */}
                      <div className={`flex flex-col md:flex-row ${!isEven ? 'md:flex-row-reverse' : ''}`}>
                        {/* ── Photo side with Pixar effect ── */}
                        <div className="relative overflow-hidden flex-shrink-0 h-56 md:h-auto md:w-[45%] md:min-h-[260px]">
                          <img
                            src={f.photo}
                            alt={f.title[lang]}
                            loading="lazy"
                            className="w-full h-full object-cover img-ken-burns img-pixar"
                          />
                          {/* Warm overlay for illustrated feel */}
                          <div className="absolute inset-0 mix-blend-soft-light bg-gradient-to-br from-amber-300/20 via-transparent to-purple-400/10 pointer-events-none" />
                          {/* Theme gradient overlay */}
                          <div className={`absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r ${isEven ? '' : 'md:bg-gradient-to-l'} ${f.photoGradient}`} />
                          {/* Icon badge floating over photo */}
                          <div className="absolute bottom-4 left-4">
                            <motion.div whileHover={{ scale: 1.1, rotate: [-4, 4, 0] }} transition={{ type: 'spring', stiffness: 300 }} className="relative inline-block">
                              <div className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} shadow-lg w-14 h-14`} style={{ boxShadow: `0 8px 24px rgba(${f.glowRgb}, 0.5)` }}>
                                <Icon className="text-white w-7 h-7" />
                              </div>
                              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${f.gradient} blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                            </motion.div>
                          </div>
                        </div>

                        {/* ── Card body ── */}
                        <div className="relative flex-1 flex flex-col p-7 lg:p-9">
                          {/* Background gradient on hover */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-700`} />
                          {/* Animated shine */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden">
                            <motion.div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }} />
                          </div>

                          <div className="relative z-10 flex-1 flex flex-col gap-4 justify-center">
                            <div>
                              <h3 className={`font-black mb-2.5 leading-tight text-xl lg:text-2xl ${dark ? 'text-white' : 'text-gray-900'}`}>
                                {f.title[lang]}
                              </h3>
                              <p className={`leading-relaxed text-sm lg:text-base ${dark ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-600'} transition-colors duration-300`}>
                                {f.desc[lang]}
                              </p>
                            </div>

                            {/* Metric badge */}
                            <div className="mt-auto pt-2">
                              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold ${
                                dark
                                  ? 'bg-white/[0.04] border-white/[0.08] text-gray-300'
                                  : 'bg-gray-50 border-gray-200 text-gray-600'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${f.gradient} flex-shrink-0`} />
                                {f.metric[lang]}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Portal Cards com fotos reais ──────────────────────────────── */}
        <section className="relative z-10 py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-16">
              <h2 className={`text-3xl sm:text-4xl font-black mb-3 ${dark?'text-white':'text-gray-900'}`}>{t('portals_title')}</h2>
              <p className={`text-sm ${dark?'text-gray-500':'text-gray-500'}`}>{t('portals_sub')}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PORTALS.map((portal, idx) => {
                const Icon = portal.icon;
                return (
                  <motion.div key={portal.key} initial={{opacity:0,y:28}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:idx*.1,duration:.55}}>
                    <TiltCard className="h-full">
                      <div
                        onClick={()=>navigate('/login')}
                        className={`card-glow-border relative h-full rounded-3xl border flex flex-col cursor-pointer transition-all duration-300 group overflow-hidden ${dark?'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.055]':'bg-white border-gray-200/90 hover:border-gray-300 hover:shadow-2xl'}`}
                        style={{ '--glow-c': portal.glowCss } as React.CSSProperties}
                      >
                        {/* Real photo header */}
                        <div className="relative h-48 overflow-hidden rounded-t-3xl flex-shrink-0">
                          <img
                            src={portal.photo}
                            alt={portal.title[lang]}
                            loading="lazy"
                            className="w-full h-full object-cover img-ken-burns img-pixar"
                          />
                          {/* Gradient overlay */}
                          <div className={`absolute inset-0 bg-gradient-to-t ${portal.photoGradient}`} />
                          {/* Icon badge over photo */}
                          <div className="absolute bottom-4 left-4 flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${portal.gradient} flex items-center justify-center shadow-2xl flex-shrink-0`} style={{boxShadow:`0 8px 28px rgba(${portal.glowRgb},.5)`}}>
                              <Icon className="w-6 h-6 text-white"/>
                            </div>
                            <div>
                              <h3 className="text-base font-black text-white drop-shadow-lg">{portal.title[lang]}</h3>
                              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${portal.badge}`}>{portal.roles[lang]}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card body */}
                        <div className="p-6 flex flex-col gap-4 flex-1">
                          <p className={`text-sm leading-relaxed ${dark?'text-gray-400':'text-gray-500'}`}>{portal.desc[lang]}</p>
                          <ul className="space-y-2.5 flex-1">
                            {portal.features[lang].map((f,i)=>(
                              <li key={i} className={`flex items-start gap-2 text-sm ${dark?'text-gray-300':'text-gray-600'}`}>
                                <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0"/>{f}
                              </li>
                            ))}
                          </ul>
                          <div className={`flex items-center gap-1.5 text-sm font-bold pt-1 transition-colors duration-200 ${dark?'text-gray-600 group-hover:text-white':'text-gray-400 group-hover:text-gray-900'}`}>
                            {t('access')}<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5"/>
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA Premium — split layout com foto Pixar ────────────────── */}
        <section className="relative z-10 py-28 px-6 overflow-hidden">
          {/* Ambient glow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full blur-[200px] pointer-events-none ${dark ? 'bg-red-600/[0.06]' : 'bg-red-500/[0.04]'}`} />

          <div className="relative z-10 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <SpotlightCard dark={dark}>
                <div
                  className={`card-glow-border group relative rounded-3xl border overflow-hidden transition-all duration-500 ${
                    dark
                      ? 'bg-white/[0.025] border-white/[0.07] hover:border-white/[0.18] hover:bg-white/[0.05]'
                      : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-2xl'
                  }`}
                  style={{ '--glow-c': '#ef4444' } as React.CSSProperties}
                >
                  {/* Top glow line */}
                  <div className={`absolute top-0 inset-x-10 h-px ${dark ? 'bg-gradient-to-r from-transparent via-red-500/50 to-transparent' : 'bg-gradient-to-r from-transparent via-red-400/50 to-transparent'}`} />

                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* ── Left: Photo collage with Pixar effect ── */}
                    <div className="relative h-72 lg:h-auto lg:min-h-[420px] overflow-hidden">
                      {/* Main photo */}
                      <img
                        src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=75&fit=crop"
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover img-ken-burns img-pixar"
                      />
                      {/* Warm Pixar overlay */}
                      <div className="absolute inset-0 mix-blend-soft-light bg-gradient-to-br from-amber-300/25 via-transparent to-purple-400/15 pointer-events-none" />
                      {/* Theme gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-t ${dark ? 'from-[#030307]/90 via-[#030307]/30' : 'from-white/80 via-white/20'} to-transparent`} />
                      {/* Side fade into card body on desktop */}
                      <div className={`absolute inset-0 hidden lg:block ${dark ? 'bg-gradient-to-r from-transparent via-transparent to-[#030307]/60' : 'bg-gradient-to-r from-transparent via-transparent to-white/50'}`} />

                      {/* Floating stats badges over the photo */}
                      <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-3">
                        {[
                          { icon: Users, label: { pt: '3 Portais', es: '3 Portales', en: '3 Portals' }, color: 'from-blue-500 to-indigo-500', rgb: '59,130,246' },
                          { icon: Shield, label: { pt: '5 Roles', es: '5 Roles', en: '5 Roles' }, color: 'from-red-500 to-rose-500', rgb: '239,68,68' },
                          { icon: TrendingUp, label: { pt: 'KPIs em Tempo Real', es: 'KPIs en Tiempo Real', en: 'Real-time KPIs' }, color: 'from-emerald-500 to-teal-500', rgb: '16,185,129' },
                        ].map((stat, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className={`badge-float inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border backdrop-blur-md text-xs font-bold ${
                              dark
                                ? 'bg-white/[0.08] border-white/[0.12] text-white'
                                : 'bg-white/90 border-gray-200 text-gray-800 shadow-lg'
                            }`}
                            style={{ animationDelay: `${i * -1.2}s` }}
                          >
                            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`} style={{ boxShadow: `0 4px 12px rgba(${stat.rgb},.4)` }}>
                              <stat.icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            {stat.label[lang]}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* ── Right: CTA content ── */}
                    <div className="relative flex flex-col justify-center p-10 lg:p-14">
                      {/* Animated shine */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden">
                        <motion.div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }} />
                      </div>
                      {/* Background gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-500 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-700" />

                      <div className="relative z-10 space-y-7">
                        {/* Badge */}
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 200 }}>
                          <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-[.12em] uppercase border ${dark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                            <Sparkles className="w-3.5 h-3.5" /> Trade Data Hub
                          </span>
                        </motion.div>

                        {/* Title */}
                        <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] ${dark ? 'text-white' : 'text-gray-900'}`}>
                          {t('cta_title')}
                        </h2>

                        {/* Description */}
                        <p className={`text-base leading-relaxed max-w-md ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t('cta_sub')}
                        </p>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-4 pt-2">
                          <motion.button
                            onClick={() => navigate('/register')}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className="relative inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold text-sm shadow-2xl shadow-red-600/30 transition-all hover:shadow-red-600/50 overflow-hidden"
                          >
                            {/* Button shine */}
                            <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: ['-200%', '200%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 3 }} />
                            <Zap className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">{t('cta_btn')}</span>
                            <ArrowRight className="w-4 h-4 relative z-10" />
                          </motion.button>

                          <motion.button
                            onClick={() => navigate('/login')}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className={`inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm border transition-all ${
                              dark
                                ? 'border-white/[0.12] text-gray-300 hover:bg-white/[0.06] hover:border-white/[0.2]'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
                            }`}
                          >
                            <LogIn className="w-4 h-4" />
                            {t('login')}
                          </motion.button>
                        </div>

                        {/* Trust line */}
                        <div className={`flex items-center gap-3 pt-3 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                          <div className="flex -space-x-2.5">
                            {['photo-1507003211169-0a1dd7228f2d', 'photo-1494790108377-be9c29b29330', 'photo-1472099645785-5658abf4ff4e'].map((id, i) => (
                              <img key={i} src={`https://images.unsplash.com/${id}?w=64&h=64&fit=crop&crop=face`} alt="" className="w-8 h-8 rounded-full border-2 border-current object-cover img-pixar" style={{ borderColor: dark ? '#030307' : '#fff' }} />
                            ))}
                          </div>
                          <span className="text-xs font-medium">
                            {lang === 'pt' ? 'Equipas operacionais já utilizam' : lang === 'es' ? 'Equipos operacionales ya lo usan' : 'Operational teams already using it'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className={`relative z-10 py-8 border-t text-center text-xs ${dark?'border-white/[0.06] text-gray-600':'border-gray-100 text-gray-400'}`}>
          {t('footer')}
        </footer>
      </div>
    </>
  );
}
