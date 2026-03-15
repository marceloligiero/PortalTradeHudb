import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

const child = {
  hidden:  { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] },
  },
};

function MagneticButton({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
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
      href={href}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

export default function FinalCTA() {
  const { ref, isInView } = useInView();

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background photo with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-santander-600/90" />

      {/* Noise grain */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating glow */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-white/10 blur-[120px] pointer-events-none"
        style={{ top: '50%', left: '50%', translateX: '-50%', translateY: '-50%' }}
        animate={{ x: [0, -30, 20, 0], y: [0, 30, -20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-3xl mx-auto px-6 text-center"
        variants={container}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        <motion.h2
          variants={child}
          className="font-headline text-3xl md:text-5xl text-white font-bold leading-tight mb-4"
        >
          Erros vão acontecer.
          <br />
          <span className="text-white/70">O que muda é o que se faz com eles.</span>
        </motion.h2>

        <motion.p variants={child} className="font-body text-lg text-white/75 max-w-xl mx-auto mt-4 mb-10">
          O TradeDataHub transforma cada erro numa equipa melhor.
        </motion.p>

        <motion.div variants={child} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <MagneticButton
            href="/login"
            className="inline-block border-2 border-white text-white font-body font-bold uppercase tracking-wide px-8 py-4 rounded-full hover:bg-white hover:text-santander-500 shadow-lg transition-all duration-300 cursor-pointer"
          >
            Solicitar Acesso
          </MagneticButton>
          <a
            href="/login"
            className="text-white/60 text-sm font-body hover:text-white/90 transition-colors"
          >
            Já tenho conta — Iniciar Sessão
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
