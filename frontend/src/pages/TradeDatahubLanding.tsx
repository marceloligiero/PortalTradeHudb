/**
 * TradeDatahubLanding — Santander Premium Landing Page
 *
 * Brand palette: Santander Red #EC0000, Black #000, White #FFF
 * Techniques:
 *  · Magnetic particle background (canvas GPU-accelerated)
 *  · Scroll progress bar (useScroll + useSpring)
 *  · 3D tilt hero card (useMotionValue + useSpring + perspective)
 *  · Word-by-word headline stagger (framer-motion)
 *  · Live activity notifications (AnimatePresence social proof)
 *  · Infinite marquee ticker
 *  · Bento grid portal layout (5 portals)
 *  · Animated counters (RAF + quartic easing)
 *  · PremiumNavbar integration
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion, AnimatePresence, useScroll, useMotionValue, useSpring,
} from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowRight, BookOpen, CheckCircle, Shield,
  UserPlus, Receipt,
  BarChart3, Zap, GraduationCap, Layers,
  MessageSquare, TrendingUp, Award, AlertTriangle,
  FileText, Settings, Database,
  type LucideIcon,
} from 'lucide-react';
import PremiumNavbar from '../components/PremiumNavbar';

// ─── i18n ──────────────────────────────────────────────────────────────────────
type LC = 'pt' | 'es' | 'en';

const LANG_OPTIONS = [
  { code: 'pt' as LC, label: '🇵🇹 Português', short: 'PT' },
  { code: 'es' as LC, label: '🇪🇸 Español',   short: 'ES' },
  { code: 'en' as LC, label: '🇺🇸 English',   short: 'EN' },
];

const T = {
  login:    { pt: 'Entrar',    es: 'Entrar',     en: 'Sign In'  },
  register: { pt: 'Registar', es: 'Registrarse', en: 'Register' },

  badge:    { pt: 'Santander Digital Services · Shared Services', es: 'Santander Digital Services · Shared Services', en: 'Santander Digital Services · Shared Services' },
  h1pre:    { pt: 'Trade',         es: 'Trade',        en: 'Trade'       },
  h1main:   { pt: 'DataHub',       es: 'DataHub',      en: 'DataHub'     },
  h1grad:   { pt: 'Formações',     es: 'Formaciones',  en: 'Training'    },
  h1cycle: [
    { pt: 'Formações',    es: 'Formaciones',    en: 'Training'    },
    { pt: 'Tutoria',      es: 'Tutoría',        en: 'Tutoring'    },
    { pt: 'Relatórios',    es: 'Informes',       en: 'Reports'     },
    { pt: 'Dados Mestres', es: 'Datos Maestros', en: 'Master Data' },
    { pt: 'Chamados',     es: 'Incidencias',    en: 'Incidents'   },
  ],
  sub:      {
    pt: 'A plataforma integrada de formação, tutoria e relatórios para as equipas de Trade Finance do Santander. Tudo o que precisas, num só lugar.',
    es: 'La plataforma integrada de formación, tutoría e informes para los equipos de Trade Finance del Santander.',
    en: 'The integrated platform for training, tutoring and reporting for Santander Trade Finance teams. Everything you need, in one place.',
  },
  cta1:  { pt: 'Começar Agora',     es: 'Empezar Ahora',   en: 'Get Started'      },
  cta2:  { pt: 'Explorar Portais',  es: 'Explorar Portales', en: 'Explore Portals' },

  trust1: { pt: 'Certificação Oficial', es: 'Certificación Oficial', en: 'Official Certification' },
  trust2: { pt: 'Seguro & Privado',     es: 'Seguro & Privado',      en: 'Secure & Private'       },
  trust3: { pt: 'Santander Group',      es: 'Santander Group',       en: 'Santander Group'        },

  previewWelcome:  { pt: 'Bom dia, Ana! 👋',       es: '¡Buenos días, Ana! 👋',    en: 'Good morning, Ana! 👋' },
  previewProgress: { pt: '5 portais disponíveis',  es: '5 portales disponibles',   en: '5 portals available'   },
  previewStatus:   { pt: 'Ativo',                  es: 'Activo',                   en: 'Active'                },
  previewComplete: { pt: 'completo',               es: 'completo',                 en: 'complete'              },
  previewOnline:   { pt: 'online',                  es: 'en línea',                  en: 'online'                },

  actName1: { pt: 'Ana S.',  es: 'Ana S.',  en: 'Ana S.'  },
  actMsg1:  { pt: 'completou Remessas de Importação', es: 'completó Remesas de Importación', en: 'completed Import Remittances' },
  actAgo1:  { pt: '2 min atrás', es: 'hace 2 min', en: '2 min ago' },
  actName2: { pt: 'João C.', es: 'Juan C.', en: 'John C.' },
  actMsg2:  { pt: 'criou plano de ação em Tutoria', es: 'creó plan de acción en Tutoría', en: 'created action plan in Tutoring' },
  actAgo2:  { pt: '5 min atrás', es: 'hace 5 min', en: '5 min ago' },
  actName3: { pt: 'Maria R.', es: 'María R.', en: 'Maria R.' },
  actMsg3:  { pt: 'abriu chamado de incidência', es: 'abrió incidencia en Chamados', en: 'opened incident in Chamados' },
  actAgo3:  { pt: '8 min atrás', es: 'hace 8 min', en: '8 min ago' },

  portTag:      { pt: 'Três Portais Integrados',   es: 'Tres Portales Integrados',   en: 'Three Integrated Portals'  },
  portTitle:    { pt: 'Os Nossos Portais',          es: 'Nuestros Portales',          en: 'Our Portals'               },
  portSub:      {
    pt: 'Acede a três portais especializados que trabalham em conjunto para uma formação operacional de excelência.',
    es: 'Accede a tres portales especializados que trabajan juntos para una formación operacional de excelencia.',
    en: 'Access three specialised portals working together for operational excellence training.',
  },
  portAccess:   { pt: 'Aceder ao Portal', es: 'Acceder al Portal', en: 'Access Portal' },

  p1Title: { pt: 'Portal de Formações', es: 'Portal de Formaciones', en: 'Training Portal' },
  p1Sub:   { pt: 'Hub de Aprendizagem', es: 'Hub de Aprendizaje',    en: 'Learning Hub'    },
  p1Desc:  {
    pt: 'Trilhas de formação estruturadas por área operacional, desafios práticos, banco de questões e certificados de conclusão.',
    es: 'Rutas de formación estructuradas por área operacional, desafíos prácticos y certificados de conclusión.',
    en: 'Structured training tracks by operational area, practical challenges, question banks and completion certificates.',
  },
  p1f1: { pt: 'Cursos por área operacional', es: 'Cursos por área operacional', en: 'Courses by operational area' },
  p1f2: { pt: 'Desafios e avaliações',       es: 'Desafíos y evaluaciones',     en: 'Challenges and assessments' },
  p1f3: { pt: 'Certificados de conclusão',   es: 'Certificados de conclusión',  en: 'Completion certificates'   },
  p1f4: { pt: 'Banco de questões',           es: 'Banco de preguntas',          en: 'Question bank'             },
  p1f5: { pt: 'Planos de formação',          es: 'Planes de formación',         en: 'Training plans'            },

  p2Title: { pt: 'Portal de Tutoria', es: 'Portal de Tutoría', en: 'Tutoring Portal' },
  p2Sub:   { pt: 'Gestão de Erros',   es: 'Gestión de Errores', en: 'Error Management' },
  p2Desc:  {
    pt: 'Registo e acompanhamento de erros operacionais, planos de ação, tutoria personalizada e folhas de aprendizagem.',
    es: 'Registro y seguimiento de errores operacionales, planes de acción y tutoría personalizada.',
    en: 'Registration and tracking of operational errors, action plans, personalised tutoring and learning sheets.',
  },
  p2f1: { pt: 'Registo de erros operacionais', es: 'Registro de errores', en: 'Operational error registration' },
  p2f2: { pt: 'Planos de ação',                es: 'Planes de acción',    en: 'Action plans'                   },
  p2f3: { pt: 'Tutoria personalizada',          es: 'Tutoría personalizada', en: 'Personalised tutoring'        },
  p2f4: { pt: 'Folhas de aprendizagem',         es: 'Hojas de aprendizaje', en: 'Learning sheets'               },
  p2f5: { pt: 'Senso de anomalias',             es: 'Senso de anomalías',  en: 'Anomaly tracking'               },

  p3Title: { pt: 'Portal de Relatórios', es: 'Portal de Informes', en: 'Reports Portal' },
  p3Sub:   { pt: 'Analytics & KPIs',     es: 'Analytics & KPIs',   en: 'Analytics & KPIs' },
  p3Desc:  {
    pt: 'Dashboards interativos com métricas de formação, desempenho por equipa, progresso individual e relatórios exportáveis.',
    es: 'Dashboards interactivos con métricas de formación, rendimiento por equipo y progreso individual.',
    en: 'Interactive dashboards with training metrics, team performance, individual progress and exportable reports.',
  },
  p3f1: { pt: 'Dashboard de formações',   es: 'Dashboard de formaciones', en: 'Training dashboard'  },
  p3f2: { pt: 'Métricas por equipa',      es: 'Métricas por equipo',      en: 'Team metrics'        },
  p3f3: { pt: 'Progresso individual',     es: 'Progreso individual',      en: 'Individual progress' },
  p3f4: { pt: 'Relatório de tutoria',     es: 'Informe de tutoría',       en: 'Tutoring report'     },
  p3f5: { pt: 'Exportação PDF/Excel',     es: 'Exportación PDF/Excel',    en: 'PDF/Excel export'    },

  p4Title: { pt: 'Dados Mestres', es: 'Datos Maestros', en: 'Master Data' },
  p4Sub:   { pt: 'Gestão de Referências', es: 'Gestión de Referencias', en: 'Reference Management' },
  p4Desc:  {
    pt: 'Gestão centralizada de dados de referência operacionais: dependências de campos, hierarquias e configurações de processo.',
    es: 'Gestión centralizada de datos de referencia operacionales: dependencias, jerarquías y configuraciones.',
    en: 'Centralised management of operational reference data: field dependencies, hierarchies and process configurations.',
  },
  p4f1: { pt: 'Dependências de campos',  es: 'Dependencias de campos',  en: 'Field dependencies'   },
  p4f2: { pt: 'Hierarquias de dados',    es: 'Jerarquías de datos',     en: 'Data hierarchies'     },
  p4f3: { pt: 'Configuração de processos', es: 'Configuración de procesos', en: 'Process configuration' },
  p4f4: { pt: 'Auditoria de alterações', es: 'Auditoría de cambios',    en: 'Change auditing'      },
  p4f5: { pt: 'Importação de dados',     es: 'Importación de datos',    en: 'Data import'          },

  p5Title: { pt: 'Portal de Chamados', es: 'Portal de Incidencias', en: 'Incidents Portal' },
  p5Sub:   { pt: 'Gestão de Incidências', es: 'Gestión de Incidencias', en: 'Incident Management' },
  p5Desc:  {
    pt: 'Registo, acompanhamento e resolução de chamados operacionais com priorização, SLAs e comunicação integrada.',
    es: 'Registro, seguimiento y resolución de incidencias operacionales con priorización y SLAs.',
    en: 'Registration, tracking and resolution of operational incidents with prioritisation, SLAs and integrated communication.',
  },
  p5f1: { pt: 'Abertura de chamados',    es: 'Apertura de incidencias', en: 'Incident creation'    },
  p5f2: { pt: 'Priorização e SLAs',      es: 'Priorización y SLAs',     en: 'Prioritisation & SLAs'},
  p5f3: { pt: 'Acompanhamento em tempo real', es: 'Seguimiento en tiempo real', en: 'Real-time tracking' },
  p5f4: { pt: 'Histórico de chamados',   es: 'Historial de incidencias', en: 'Incident history'    },
  p5f5: { pt: 'Relatórios de incidências', es: 'Informes de incidencias', en: 'Incident reports'   },



  howTag:   { pt: 'Como Funciona',   es: 'Cómo Funciona', en: 'How It Works'   },
  howTitle: { pt: 'A Sua Jornada',   es: 'Su Camino',     en: 'Your Journey'   },
  s1t: { pt: 'Criar Conta',    es: 'Crear Cuenta',   en: 'Create Account'  },
  s1d: { pt: 'Registe-se e selecione o seu perfil operacional em segundos.', es: 'Regístrese y seleccione su perfil en segundos.', en: 'Register and select your operational profile in seconds.' },
  s2t: { pt: 'Aceder aos Portais', es: 'Acceder a los Portales', en: 'Access the Portals' },
  s2d: { pt: 'Navega entre os portais de Formações, Tutoria e Relatórios conforme o teu perfil.', es: 'Navega entre los portales según tu perfil.', en: 'Navigate between the Training, Tutoring and Reports portals according to your profile.' },
  s3t: { pt: 'Evoluir e Certificar', es: 'Evolucionar y Certificar', en: 'Grow and Get Certified' },
  s3d: { pt: 'Complete formações, receba tutoria personalizada e acompanhe o seu progresso com relatórios detalhados.', es: 'Complete formaciones, reciba tutoría y siga su progreso.', en: 'Complete training, receive tutoring and track your progress with detailed reports.' },

  ctaTag:   { pt: 'Pronto para começar?',         es: '¿Listo para empezar?',   en: 'Ready to start?'           },
  ctaTitle: { pt: 'Acede à plataforma de Trade Finance do Santander', es: 'Accede a la plataforma de Trade Finance del Santander', en: 'Access the Santander Trade Finance platform' },
  ctaSub:   { pt: 'Formação, tutoria e relatórios numa única plataforma integrada. Acesso imediato para todas as equipas.', es: 'Formación, tutoría e informes en una única plataforma integrada.', en: 'Training, tutoring and reporting in one integrated platform. Immediate access for all teams.' },
  ctaB1:    { pt: 'Criar Conta Gratuita', es: 'Crear Cuenta Gratis', en: 'Create Free Account' },
  ctaB2:    { pt: 'Iniciar Sessão',       es: 'Iniciar Sesión',      en: 'Sign In'             },

  copy: { pt: '© 2026 Santander Digital Services', es: '© 2026 Santander Digital Services', en: '© 2026 Santander Digital Services' },
} as const;

const tr = (key: keyof typeof T, lang: LC): string => T[key][lang];

// ─── Portal Definitions ────────────────────────────────────────────────────────
interface PortalDef {
  id: string;
  titleKey: keyof typeof T;
  subKey: keyof typeof T;
  descKey: keyof typeof T;
  featureKeys: (keyof typeof T)[];
  icon: LucideIcon;
  subIcon: LucideIcon;
  color: string;
  gradient: string;
  route: string;
  span: 1 | 2;
}

const PORTALS: PortalDef[] = [
  {
    id: 'formacoes',
    titleKey: 'p1Title', subKey: 'p1Sub', descKey: 'p1Desc',
    featureKeys: ['p1f1', 'p1f2', 'p1f3', 'p1f4', 'p1f5'],
    icon: GraduationCap, subIcon: BookOpen,
    color: '#EC0000',
    gradient: 'from-red-600/20 via-red-500/5 to-transparent',
    route: '/login',
    span: 2,
  },
  {
    id: 'tutoria',
    titleKey: 'p2Title', subKey: 'p2Sub', descKey: 'p2Desc',
    featureKeys: ['p2f1', 'p2f2', 'p2f3', 'p2f4', 'p2f5'],
    icon: MessageSquare, subIcon: AlertTriangle,
    color: '#CC0000',
    gradient: 'from-red-700/20 via-red-600/5 to-transparent',
    route: '/login',
    span: 1,
  },
  {
    id: 'relatorios',
    titleKey: 'p3Title', subKey: 'p3Sub', descKey: 'p3Desc',
    featureKeys: ['p3f1', 'p3f2', 'p3f3', 'p3f4', 'p3f5'],
    icon: BarChart3, subIcon: TrendingUp,
    color: '#FF2D2D',
    gradient: 'from-red-500/20 via-red-400/5 to-transparent',
    route: '/login',
    span: 1,
  },
  {
    id: 'dados-mestres',
    titleKey: 'p4Title', subKey: 'p4Sub', descKey: 'p4Desc',
    featureKeys: ['p4f1', 'p4f2', 'p4f3', 'p4f4', 'p4f5'],
    icon: Database, subIcon: Settings,
    color: '#B30000',
    gradient: 'from-red-800/20 via-red-700/5 to-transparent',
    route: '/login',
    span: 1,
  },
  {
    id: 'chamados',
    titleKey: 'p5Title', subKey: 'p5Sub', descKey: 'p5Desc',
    featureKeys: ['p5f1', 'p5f2', 'p5f3', 'p5f4', 'p5f5'],
    icon: Receipt, subIcon: FileText,
    color: '#FF4D4D',
    gradient: 'from-red-400/20 via-red-300/5 to-transparent',
    route: '/login',
    span: 1,
  },
];

// ─── Marquee ────────────────────────────────────────────────────────────────────
const MARQUEE: Record<LC, string[]> = {
  pt: ['Portal de Formações', 'Portal de Tutoria', 'Portal de Relatórios', 'Dados Mestres', 'Portal de Chamados', 'Trade Finance', 'SWIFT', 'UCP 600', 'Santander Digital Services', 'Shared Services', 'Créditos Importação', 'Remessas', 'Garantias', 'Eurocobros'],
  es: ['Portal de Formaciones', 'Portal de Tutoría', 'Portal de Informes', 'Datos Maestros', 'Portal de Incidencias', 'Trade Finance', 'SWIFT', 'UCP 600', 'Santander Digital Services', 'Shared Services', 'Créditos Importación', 'Remesas', 'Garantías', 'Eurocobros'],
  en: ['Training Portal', 'Tutoring Portal', 'Reports Portal', 'Master Data', 'Incidents Portal', 'Trade Finance', 'SWIFT', 'UCP 600', 'Santander Digital Services', 'Shared Services', 'Import Credits', 'Remittances', 'Guarantees', 'Eurocollections'],
};

// ─── Activity Notifications ────────────────────────────────────────────────────
const ACTIVITIES = [
  { nameKey: 'actName1' as const, msgKey: 'actMsg1' as const, agoKey: 'actAgo1' as const, color: '#EC0000' },
  { nameKey: 'actName2' as const, msgKey: 'actMsg2' as const, agoKey: 'actAgo2' as const, color: '#CC0000' },
  { nameKey: 'actName3' as const, msgKey: 'actMsg3' as const, agoKey: 'actAgo3' as const, color: '#FF2D2D' },
];

// ─── SantanderParticles (GPU-accelerated canvas) ──────────────────────────────
function SantanderParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; pulse: number }[] = [];
    const COUNT = 80;
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        a: Math.random() * 0.3 + 0.05,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x * canvas.width;
      const my = mouseRef.current.y * canvas.height;
      const t = Date.now() * 0.001;

      particles.forEach(p => {
        // Magnetic attraction to mouse
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          p.vx += dx * 0.00004;
          p.vy += dy * 0.00004;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Pulse
        const pulseA = p.a * (0.6 + 0.4 * Math.sin(t * 1.2 + p.pulse));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(236, 0, 0, ${pulseA})`;
        ctx.fill();

        // Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
        grad.addColorStop(0, `rgba(236, 0, 0, ${pulseA * 0.3})`);
        grad.addColorStop(1, 'rgba(236, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(236, 0, 0, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener('mousemove', onMouse, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}

// ─── TiltCard ─────────────────────────────────────────────────────────────────
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(mx, { stiffness: 350, damping: 35 });
  const rotateY = useSpring(my, { stiffness: 350, damping: 35 });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top)  / rect.height - 0.5;
    my.set(nx * 10);
    mx.set(-ny * 10);
  }, [mx, my]);

  const onLeave = useCallback(() => { mx.set(0); my.set(0); }, [mx, my]);

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ perspective: 1200 }}>
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} className={className}>
        {children}
      </motion.div>
    </div>
  );
}

// ─── SectionHead ──────────────────────────────────────────────────────────────
function SectionHead({ badge, badgeIcon: Icon, title, desc }: {
  badge: string; badgeIcon: LucideIcon; title: string; desc?: string;
}) {
  return (
    <div className="text-center mb-16 space-y-5">
      <motion.div initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EC0000]/[0.08] border border-[#EC0000]/20">
        <Icon className="w-3.5 h-3.5 text-[#EC0000]" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#EC0000]/80">{badge}</span>
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]
          bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
        {title}
      </motion.h2>
      {desc && (
        <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.25, duration: 0.6 }}
          className="text-base md:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed">
          {desc}
        </motion.p>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TradeDatahubLanding() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<LC>(() => {
    const l = localStorage.getItem('language') ?? 'pt-PT';
    if (l.startsWith('es')) return 'es';
    if (l.startsWith('en')) return 'en';
    return 'pt';
  });
  const [actIdx, setActIdx] = useState(0);
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);
  const [cycleIdx, setCycleIdx] = useState(0);
  const cycleWords = (T.h1cycle as Array<Record<string, string>>).map(w => w[lang]);

  useEffect(() => {
    const id = setInterval(() => setCycleIdx(i => (i + 1) % cycleWords.length), 2800);
    return () => clearInterval(id);
  }, [cycleWords.length]);

  const changeLang = useCallback((l: LC) => {
    setLang(l);
    localStorage.setItem('language', l === 'pt' ? 'pt-PT' : l);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setActIdx(i => (i + 1) % ACTIVITIES.length), 3500);
    return () => clearInterval(id);
  }, []);

  const { data: kpis } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => axios.get('/api/stats/kpis').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  const steps = [
    { num: '01', titleKey: 's1t' as const, descKey: 's1d' as const, icon: UserPlus },
    { num: '02', titleKey: 's2t' as const, descKey: 's2d' as const, icon: Layers   },
    { num: '03', titleKey: 's3t' as const, descKey: 's3d' as const, icon: Award    },
  ];

  const marqueeItems = [...MARQUEE[lang], ...MARQUEE[lang]];

  return (
    <div className="min-h-screen bg-[#030307] text-white overflow-x-hidden selection:bg-[#EC0000]/30 selection:text-white">

      {/* Scroll progress — Santander red */}
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#EC0000] via-[#FF4D4D] to-[#EC0000] origin-left z-[100]"
        style={{ scaleX }} />

      {/* Backgrounds */}
      <SantanderParticles />

      {/* Subtle noise */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.012]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '256px 256px' }} />

      {/* Dot grid */}
      <div className="fixed inset-0 z-[1] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(236,0,0,0.015) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      {/* Ambient red glow — top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(236,0,0,0.06) 0%, transparent 70%)', filter: 'blur(100px)' }} />

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <PremiumNavbar
        showThemeToggle={false}
        onLangChange={(code) => changeLang(code.startsWith('pt') ? 'pt' : code.startsWith('es') ? 'es' : 'en')}
        currentLang={lang === 'pt' ? 'pt-PT' : lang}
      />

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-24 pb-32 z-10">
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="text-center mb-12">

            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full
                bg-[#EC0000]/[0.08] border border-[#EC0000]/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#EC0000] animate-pulse" />
              <span className="text-[11px] font-bold text-white/50 tracking-wide uppercase">{tr('badge', lang)}</span>
            </motion.div>

            {/* Headline — Trade DataHub */}
            <div className="mb-4">
              <div className="text-5xl sm:text-6xl xl:text-[90px] font-black leading-[0.95] tracking-tighter">
                {[tr('h1pre', lang), tr('h1main', lang)].map((word, wi) => (
                  <span key={wi} className="inline-block overflow-hidden mr-[0.12em] last:mr-0">
                    <motion.span
                      className={`inline-block ${wi === 1 ? 'text-[#EC0000]' : 'text-white'}`}
                      initial={{ y: '120%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.35 + wi * 0.12, ease: [0.22, 1, 0.36, 1] }}>
                      {word}
                    </motion.span>
                  </span>
                ))}
              </div>
              <div className="mt-2 relative" style={{ height: 'clamp(4.2rem, 13vw, 8.5rem)' }}>
                <div className="absolute inset-0 overflow-hidden" style={{ bottom: '-0.25em' }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={cycleWords[cycleIdx]}
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: '-100%', opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="text-5xl sm:text-6xl xl:text-[90px] font-black leading-[1.2] tracking-tighter pb-2
                        bg-gradient-to-r from-[#EC0000] via-[#FF4D4D] to-[#EC0000] bg-clip-text text-transparent">
                      {cycleWords[cycleIdx]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Decorative line */}
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-24 h-[2px] mx-auto mb-6 bg-gradient-to-r from-transparent via-[#EC0000] to-transparent origin-center" />

            {/* Subtitle */}
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10 text-white/40">
              {tr('sub', lang)}
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
              <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(236,0,0,0.4)' }}
                whileTap={{ scale: 0.97 }} onClick={() => navigate('/register')}
                className="group relative flex items-center justify-center gap-2.5 w-full sm:w-auto
                  px-9 py-4 rounded-2xl font-bold text-white text-[15px]
                  bg-[#EC0000] hover:bg-[#D00000]
                  shadow-[0_0_30px_rgba(236,0,0,0.25)] transition-all duration-300
                  overflow-hidden">
                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent
                  -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10">{tr('cta1', lang)}</span>
                <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('portals')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center justify-center gap-2 w-full sm:w-auto
                  px-9 py-4 rounded-2xl font-semibold text-white/50 text-[15px]
                  bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1]
                  hover:border-[#EC0000]/30 transition-all duration-300">
                {tr('cta2', lang)}
              </motion.button>
            </motion.div>

            {/* Trust badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.7 }}
              className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {[
                { icon: CheckCircle, text: tr('trust1', lang) },
                { icon: Shield,      text: tr('trust2', lang) },
                { icon: Zap,         text: tr('trust3', lang) },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 + i * 0.1 }} className="flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5 text-[#EC0000]/70" />
                  <span className="text-xs font-medium text-white/35">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* ── 3D Portal Preview Card ── */}
          <motion.div initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-4xl mx-auto">

            <TiltCard>
              {/* Red glow border */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#EC0000]/15 via-transparent to-[#EC0000]/10 blur-sm" />

              <div className="relative rounded-2xl border border-white/[0.1] bg-[#0a0a0f]/95 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.7)]">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.016]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#EC0000]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#EC0000]/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#EC0000]/25" />
                  </div>
                  <div className="flex-1 ml-2 h-5 rounded-md bg-white/[0.04] px-3 flex items-center">
                    <span className="text-[10px] text-white/20 font-mono">portal.tradedatahub.com</span>
                  </div>
                  <div className="flex items-center gap-1.5 mr-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-wide">Live</span>
                  </div>
                </div>

                {/* Dashboard body */}
                <div className="flex h-[230px] md:h-[270px]">
                  {/* Sidebar */}
                  <div className="hidden sm:flex flex-col w-[140px] border-r border-white/[0.05] p-3 gap-0.5">
                    <div className="text-[8px] font-bold uppercase tracking-widest text-white/15 px-2 mb-2">Portais</div>
                    {[
                      { label: 'Formações',     active: true  },
                      { label: 'Tutoria',       active: false },
                      { label: 'Relatórios',    active: false },
                      { label: 'Dados Mestres', active: false },
                      { label: 'Chamados',      active: false },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-medium
                        ${item.active ? 'bg-[#EC0000]/10 text-white/80 border border-[#EC0000]/20' : 'text-white/20'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.active ? 'bg-[#EC0000]' : 'bg-white/20'}`} />
                        {item.label}
                      </div>
                    ))}
                    <div className="mt-auto pt-3 border-t border-white/[0.04]">
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#EC0000] flex items-center justify-center text-[7px] font-bold">A</div>
                        <div>
                          <div className="text-[9px] text-white/50 font-semibold">Ana Silva</div>
                          <div className="text-[7px] text-white/20">Formanda</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main area */}
                  <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-white/70">{tr('previewWelcome', lang)}</div>
                        <div className="text-[9px] text-white/30 mt-0.5">{tr('previewProgress', lang)}</div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[9px] font-bold text-emerald-400">{tr('previewStatus', lang)}</span>
                      </div>
                    </div>

                    {/* Portal mini-cards */}
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      {[
                        { label: 'Formações',    pct: 68, icon: '🎓' },
                        { label: 'Tutoria',      pct: 42, icon: '💬' },
                        { label: 'Relatórios',   pct: 91, icon: '📊' },
                        { label: 'Dados Mestres',pct: 55, icon: '🗄️' },
                        { label: 'Chamados',     pct: 28, icon: '🎫' },
                      ].map((p, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 + i * 0.12 }}
                          className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#EC0000]/20 transition-colors flex flex-col justify-between">
                          <div className="text-lg mb-1">{p.icon}</div>
                          <div className="text-[9px] font-semibold text-white/55 mb-2">{p.label}</div>
                          <div>
                            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-1">
                              <motion.div className="h-full rounded-full bg-[#EC0000]"
                                initial={{ width: 0 }} animate={{ width: `${p.pct}%` }}
                                transition={{ delay: 1.2 + i * 0.18, duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
                            </div>
                            <div className="text-[8px] text-white/22">{p.pct}% {tr('previewComplete', lang)}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Chart bars */}
                    <div className="flex items-end gap-0.5 h-10 opacity-50">
                      {[30, 52, 44, 70, 48, 82, 60, 88, 65, 92, 72, 85, 68, 95].map((h, i) => (
                        <motion.div key={i} className="flex-1 rounded-t-[2px]"
                          style={{ height: `${h}%`, background: `linear-gradient(to top, rgba(236,0,0,0.7), rgba(236,0,0,0.08))` }}
                          initial={{ scaleY: 0, originY: '100%' }} animate={{ scaleY: 1 }}
                          transition={{ delay: 1.4 + i * 0.03, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Activity notification */}
            <div className="absolute -bottom-4 -left-4 md:-left-8 z-20 w-[230px]">
              <AnimatePresence mode="wait">
                {ACTIVITIES.map((act, i) => i === actIdx && (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -16, scale: 0.92 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -16, scale: 0.92 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-[#EC0000]/15
                      bg-[#0a0a14]/90 backdrop-blur-xl shadow-xl">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-white bg-[#EC0000]">
                      {tr(act.nameKey, lang)[0]}
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-white/80 leading-tight">{tr(act.nameKey, lang)}</div>
                      <div className="text-[9px] text-white/35 leading-tight mt-0.5">{tr(act.msgKey, lang)}</div>
                      <div className="text-[8px] text-white/20 mt-1">{tr(act.agoKey, lang)}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Live users pill */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              className="absolute -top-4 -right-4 md:-right-6 z-20
                flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#EC0000]/15
                bg-[#0a0a14]/90 backdrop-blur-xl shadow-lg">
              <div className="flex -space-x-1">
                {['#EC0000','#CC0000','#FF2D2D'].map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-[#0a0a14] flex items-center justify-center text-[6px] font-bold text-white"
                    style={{ background: c }}>
                    {['A','J','M'][i]}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-semibold text-white/50">
                {(kpis?.users?.active ?? 12)}+ {tr('previewOnline', lang)}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-[#EC0000]/20 flex items-start justify-center pt-1.5">
            <motion.div animate={{ opacity: [1, 0], y: [0, 12] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-1 rounded-full bg-[#EC0000]/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* ══ MARQUEE ══════════════════════════════════════════════════════════ */}
      <section className="py-5 border-y border-[#EC0000]/[0.08] overflow-hidden relative z-10">
        <motion.div className="flex gap-10 w-max"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}>
          {marqueeItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-white/[0.15] flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EC0000]/40" />
              <span className="text-[13px] font-semibold tracking-wide whitespace-nowrap">{item}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ══ PORTALS BENTO ════════════════════════════════════════════════════ */}
      <section id="portals" className="relative py-28 px-4 sm:px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <SectionHead
            badge={tr('portTag', lang)}
            badgeIcon={Layers}
            title={tr('portTitle', lang)}
            desc={tr('portSub', lang)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {PORTALS.map((portal, i) => {
              const isHovered = hoveredPortal === portal.id;
              const isWide = portal.span === 2;
              return (
                <motion.div key={portal.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  onHoverStart={() => setHoveredPortal(portal.id)}
                  onHoverEnd={() => setHoveredPortal(null)}
                  className={`relative group rounded-2xl border overflow-hidden cursor-default transition-all duration-500
                    ${isWide ? 'md:col-span-2 p-8 md:p-10' : 'md:col-span-1 p-7 md:p-8'}
                    ${isHovered ? 'border-[#EC0000]/25' : 'border-white/[0.08]'} bg-white/[0.022]`}
                  style={isHovered ? { boxShadow: `0 0 80px ${portal.color}12` } : {}}
                >
                  {/* Gradient fill on hover */}
                  <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 20% 20%, ${portal.color}09, transparent 65%)` }} />

                  {/* Top gradient stripe */}
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: `linear-gradient(to right, transparent, ${portal.color}50, transparent)` }} />

                  <div className="relative z-10">
                    {/* Icons row */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <motion.div whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`inline-flex items-center justify-center rounded-2xl ${isWide ? 'w-14 h-14' : 'w-12 h-12'}`}
                          style={{
                            background: `linear-gradient(135deg, ${portal.color}, ${portal.color}80)`,
                            boxShadow: `0 8px 24px ${portal.color}30`,
                          }}>
                          <portal.icon className={`text-white ${isWide ? 'w-7 h-7' : 'w-6 h-6'}`} />
                        </motion.div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                            style={{ color: portal.color }}>{tr(portal.subKey, lang)}</div>
                          <h3 className={`font-black text-white ${isWide ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}>
                            {tr(portal.titleKey, lang)}
                          </h3>
                        </div>
                      </div>
                      <portal.subIcon className="w-5 h-5 text-white/15 group-hover:text-white/30 transition-colors" />
                    </div>

                    {/* Description */}
                    <p className={`text-white/40 leading-relaxed mb-6 group-hover:text-white/55 transition-colors duration-300
                      ${isWide ? 'text-[15px] md:text-base max-w-xl' : 'text-sm'}`}>
                      {tr(portal.descKey, lang)}
                    </p>

                    {/* Features list */}
                    <div className={`grid gap-2 mb-7 ${isWide ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : 'grid-cols-2'}`}>
                      {portal.featureKeys.map((fk, fi) => (
                        <motion.div key={fi}
                          initial={{ opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 + fi * 0.05 }}
                          className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: portal.color }} />
                          <span className="text-[11px] font-medium text-white/40 group-hover:text-white/55 transition-colors">
                            {tr(fk, lang)}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {/* CTA */}
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/login')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${portal.color}30, ${portal.color}15)`,
                        border: `1px solid ${portal.color}35`,
                        color: portal.color,
                      }}>
                      {tr('portAccess', lang)}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>



      {/* ══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section className="relative py-28 px-4 sm:px-6 z-10">
        <div className="max-w-4xl mx-auto">
          <SectionHead badge={tr('howTag', lang)} badgeIcon={BookOpen} title={tr('howTitle', lang)} />

          <div className="relative">
            {/* Center line — Santander red */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#EC0000]/15 to-transparent" />
            <div className="space-y-5 md:space-y-0 md:grid md:gap-y-8">
              {steps.map((step, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: isLeft ? -30 : 30, y: 20 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: i * 0.14, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative md:flex md:items-center md:gap-8 ${isLeft ? '' : 'md:flex-row-reverse'}`}>
                    <div className={`md:w-[calc(50%-2.5rem)] ${isLeft ? 'md:text-right' : ''}`}>
                      <motion.div whileHover={{ y: -4 }}
                        className="p-6 md:p-7 rounded-2xl border bg-white/[0.022] border-white/[0.08]
                          hover:border-[#EC0000]/20 hover:bg-white/[0.035] transition-all duration-300">
                        <div className="text-5xl font-black mb-4 leading-none text-[#EC0000]/[0.08]">
                          {step.num}
                        </div>
                        <div className={`flex items-center gap-2.5 mb-3 ${isLeft ? 'md:justify-end' : ''}`}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#EC0000]/10 text-[#EC0000]">
                            <step.icon className="w-4 h-4" />
                          </div>
                          <h3 className="text-lg font-bold text-white">{tr(step.titleKey, lang)}</h3>
                        </div>
                        <p className="text-sm leading-relaxed text-white/35">{tr(step.descKey, lang)}</p>
                      </motion.div>
                    </div>
                    <div className="hidden md:flex items-center justify-center w-5 flex-shrink-0">
                      <motion.div
                        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                        transition={{ delay: i * 0.14 + 0.3, type: 'spring', stiffness: 300 }}
                        className="w-3.5 h-3.5 rounded-full bg-[#EC0000]"
                        style={{ boxShadow: '0 0 14px rgba(236,0,0,0.6)' }} />
                    </div>
                    <div className="hidden md:block md:w-[calc(50%-2.5rem)]" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-32 px-4 sm:px-6 z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl border border-[#EC0000]/15 overflow-hidden">

            {/* Red gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0000] via-[#0c0308] to-[#030307]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-72 rounded-full blur-3xl opacity-20"
              style={{ background: 'radial-gradient(ellipse, rgba(236,0,0,0.6), transparent)' }} />

            <div className="relative z-10 text-center px-8 py-16 md:py-20 space-y-6">
              <motion.div initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ type: 'spring', stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EC0000]/10 border border-[#EC0000]/25">
                <GraduationCap className="w-3.5 h-3.5 text-[#EC0000]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#EC0000]">
                  {tr('ctaTag', lang)}
                </span>
              </motion.div>

              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight max-w-2xl mx-auto">
                {tr('ctaTitle', lang)}
              </h2>

              <p className="text-base md:text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
                {tr('ctaSub', lang)}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 60px rgba(236,0,0,0.4)' }}
                  whileTap={{ scale: 0.97 }} onClick={() => navigate('/register')}
                  className="group flex items-center justify-center gap-2.5 px-10 py-4 rounded-2xl
                    font-bold text-white text-[15px]
                    bg-[#EC0000] hover:bg-[#D00000]
                    shadow-[0_0_30px_rgba(236,0,0,0.25)] transition-all duration-300">
                  {tr('ctaB1', lang)}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </motion.button>

                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 px-10 py-4 rounded-2xl
                    font-semibold text-white/50 text-[15px]
                    bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.1]
                    hover:border-[#EC0000]/25 transition-all duration-300">
                  {tr('ctaB2', lang)}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className="relative py-8 px-4 sm:px-6 border-t border-[#EC0000]/[0.08] z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo-sds.png" alt="SDS" className="h-5 w-auto opacity-25" />
            <span className="text-xs text-white/20 font-medium">{tr('copy', lang)}</span>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-[#EC0000]/[0.08] to-transparent flex-1 mx-8 hidden md:block" />
          <div className="flex items-center gap-4">
            {LANG_OPTIONS.map(l => (
              <button key={l.code} onClick={() => changeLang(l.code)}
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors
                  ${lang === l.code ? 'text-[#EC0000]' : 'text-white/15 hover:text-white/30'}`}>
                {l.short}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
