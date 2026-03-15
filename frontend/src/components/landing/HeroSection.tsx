import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const child = {
  hidden:  { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] },
  },
};

function MagneticLink({ to, className, children }: { to: string; className: string; children: React.ReactNode }) {
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMouse = (e: React.MouseEvent) => {
    if (prefersReduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width  / 2)) * 0.15);
    y.set((e.clientY - (rect.top  + rect.height / 2)) * 0.15);
  };

  return (
    <motion.a
      ref={ref}
      href={to}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80')`,
        }}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A0005]/92 via-[#8B0000]/82 to-santander-600/70" />

      {/* Noise grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating glow */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-santander-500/20 blur-[120px] pointer-events-none"
        animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-20"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Tag */}
        <motion.div variants={child}>
          <span className="inline-block bg-white/10 border border-white/20 backdrop-blur text-xs text-white rounded-full px-4 py-1.5 font-body font-bold uppercase tracking-widest mb-8">
            Gestão de Operações de Back-Office
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={child}
          className="font-headline text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-4"
        >
          Cada erro que passa custa caro.
        </motion.h1>

        <motion.p
          variants={child}
          className="font-headline text-3xl md:text-4xl font-bold text-white/55 tracking-tight mb-8"
        >
          Cada erro que se repete custa mais.
        </motion.p>

        {/* Subtitle */}
        <motion.p
          variants={child}
          className="font-body text-lg md:text-xl text-white/75 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          O TradeDataHub é a plataforma que a sua equipa de processamento precisa para transformar
          erros em aprendizagem, formação em resultado e dados em decisões.{' '}
          <span className="text-white font-semibold">Do gravador ao liberador — tudo num só lugar.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div variants={child} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <MagneticLink
            to="/login"
            className="bg-santander-500 hover:bg-santander-600 text-white font-body font-bold uppercase tracking-wide px-8 py-4 rounded-full shadow-[0_0_40px_rgba(236,0,0,0.35)] hover:shadow-[0_0_60px_rgba(236,0,0,0.5)] transition-all duration-300"
          >
            Começar Agora →
          </MagneticLink>
          <MagneticLink
            to="#como-funciona"
            className="border border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-full font-body transition-all duration-300"
          >
            Ver Como Funciona
          </MagneticLink>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-down">
        <ChevronDown className="w-6 h-6 text-white/40" />
      </div>
    </section>
  );
}
