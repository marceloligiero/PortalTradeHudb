import { motion } from 'framer-motion';

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

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(236,0,0,0.1) 0%, transparent 70%)',
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-6 max-w-6xl mx-auto"
        style={{ paddingTop: '160px', paddingBottom: '120px' }}
      >
        {/* Badge */}
        <motion.div variants={child}>
          <span className="inline-flex items-center gap-2 border border-white/[0.08] text-[#666] text-xs font-body uppercase tracking-[0.2em] rounded-full px-5 py-2 mb-12">
            <span className="w-1.5 h-1.5 rounded-full bg-santander-500 animate-pulse" />
            5 portais integrados · 3 idiomas
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={child}
          className="font-headline font-bold text-white leading-[1.0] mb-6"
          style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
        >
          Cada erro que passa
          <br />
          custa caro.
        </motion.h1>

        <motion.p
          variants={child}
          className="font-headline font-bold text-santander-500 leading-[1.0] mb-12"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
        >
          Cada erro que se repete
          <br />
          custa mais.
        </motion.p>

        {/* Subtitle */}
        <motion.p
          variants={child}
          className="font-body text-[#666] max-w-[580px] mx-auto mb-16 leading-relaxed"
          style={{ fontSize: 'clamp(1rem, 1.5vw, 1.2rem)' }}
        >
          A plataforma que transforma erros em aprendizagem, formação em resultado e dados
          em decisões. Do gravador ao liberador — tudo num só lugar.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={child} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/login"
            className="bg-santander-500 hover:bg-santander-400 text-white font-body font-bold uppercase tracking-wide text-sm px-8 py-4 rounded-full transition-all duration-300 shadow-[0_0_40px_rgba(236,0,0,0.25)] hover:shadow-[0_0_60px_rgba(236,0,0,0.5)]"
          >
            Começar Agora →
          </a>
          <a
            href="#como-funciona"
            className="border border-white/[0.12] text-[#999] hover:text-white hover:border-white/25 font-body text-sm px-8 py-4 rounded-full transition-all duration-300"
          >
            Ver Como Funciona
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
