import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useInView } from '../../hooks/useInView';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
};

const child = {
  hidden:  { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
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
    <section
      ref={ref}
      className="relative bg-black overflow-hidden"
      style={{ paddingTop: '200px', paddingBottom: '200px' }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(236,0,0,0.07) 0%, transparent 60%)',
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        <motion.h2
          variants={child}
          className="font-headline font-bold text-white leading-[1.0] mb-8"
          style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
        >
          Pronto para o
          <br />
          que vem a seguir?
        </motion.h2>

        <motion.p
          variants={child}
          className="font-body text-[#444] text-base mb-14 max-w-md mx-auto leading-relaxed"
        >
          O TradeDataHub transforma cada erro numa equipa melhor.
        </motion.p>

        <motion.div variants={child} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <MagneticButton
            href="/login"
            className="bg-santander-500 hover:bg-santander-400 text-white font-body font-bold uppercase tracking-wide text-sm px-8 py-4 rounded-full transition-all duration-300 shadow-[0_0_40px_rgba(236,0,0,0.25)] hover:shadow-[0_0_60px_rgba(236,0,0,0.5)]"
          >
            Acessar Plataforma →
          </MagneticButton>
          <a
            href="#funcionalidades"
            className="border border-white/[0.12] text-[#555] hover:text-white hover:border-white/25 font-body text-sm px-8 py-4 rounded-full transition-all duration-300"
          >
            Explorar Módulos
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
