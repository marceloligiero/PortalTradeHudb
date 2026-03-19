import { useRef, useEffect, useState, type ReactNode, type CSSProperties } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
 *  useScrollReveal – IntersectionObserver hook for scroll-triggered animations
 * ───────────────────────────────────────────────────────────────────────────── */
export function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  reveal() – CSS style helper for stagger fade + slide up
 * ───────────────────────────────────────────────────────────────────────────── */
export function reveal(visible: boolean, delay = 0): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(32px)',
    transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  SectionWrapper – Consistent section with padding, max-width, bg slot
 * ───────────────────────────────────────────────────────────────────────────── */
interface SectionWrapperProps {
  children: ReactNode;
  id?: string;
  className?: string;
  wide?: boolean; /* 1280 instead of 1152 */
}

export function SectionWrapper({ children, id, className = '', wide }: SectionWrapperProps) {
  const maxW = wide ? 'max-w-[1280px]' : 'max-w-6xl';
  return (
    <section id={id} className={`relative py-24 sm:py-32 px-6 ${className}`}>
      <div className={`${maxW} mx-auto relative z-[2]`}>{children}</div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  SectionLabel – Red pulse dot + uppercase label
 * ───────────────────────────────────────────────────────────────────────────── */
export function SectionLabel({ text, style }: { text: string; style?: CSSProperties }) {
  return (
    <div className="flex items-center gap-2 mb-5" style={style}>
      <span className="w-2 h-2 rounded-full bg-[#EC0000] animate-pulse" />
      <span className="font-body text-xs font-bold uppercase tracking-[0.15em] text-[#EC0000]">
        {text}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  SectionTitle – Large headline with optional accent bar
 * ───────────────────────────────────────────────────────────────────────────── */
export function SectionTitle({ children, accent = true, style, maxWidth }: {
  children: ReactNode;
  accent?: boolean;
  style?: CSSProperties;
  maxWidth?: string;
}) {
  return (
    <div className={`flex gap-4 mb-6 ${accent ? '' : ''}`} style={style}>
      {accent && <div className="w-[3px] rounded-full shrink-0 self-stretch mt-1 bg-[#EC0000]" />}
      <h2
        className="font-headline font-bold text-gray-900 dark:text-white leading-[1.12]"
        style={{ fontSize: 'clamp(1.875rem, 4vw, 2.75rem)', maxWidth: maxWidth || '700px' }}
      >
        {children}
      </h2>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  TiltCard – 3D perspective tilt on hover (GPU-optimised)
 * ───────────────────────────────────────────────────────────────────────────── */
interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  intensity?: number; /* max degrees – default 6 */
  glare?: boolean;
}

export function TiltCard({ children, className = '', style, intensity = 6, glare = true }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale3d(1.02,1.02,1.02)`;
    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.12), transparent 60%)`;
      glareRef.current.style.opacity = '1';
    }
  };

  const handleLeave = () => {
    const el = cardRef.current;
    if (el) el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
    if (glareRef.current) glareRef.current.style.opacity = '0';
  };

  return (
    <div
      ref={cardRef}
      className={`relative will-change-transform ${className}`}
      style={{ transition: 'transform 0.35s ease', transformStyle: 'preserve-3d', ...style }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-10"
          style={{ opacity: 0, transition: 'opacity 0.35s ease' }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  GlassCard – Glassmorphism card
 * ───────────────────────────────────────────────────────────────────────────── */
export function GlassCard({ children, className = '', style }: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 dark:border-white/[0.08] ${className}`}
      style={{
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        ...style,
      }}
    >
      <style>{`
        @media (prefers-color-scheme: dark) {
          .glass-dark { background: rgba(22,22,24,0.75) !important; }
        }
      `}</style>
      <div className="dark:!bg-[rgba(22,22,24,0.75)] rounded-[inherit]">
        {children}
      </div>
    </div>
  );
}
