/**
 * Landing page reusable primitives.
 * SectionWrapper, TiltCard, AnimatedCard, SectionLabel, SectionTitle, FeatureGrid
 */
import { useEffect, useRef, useState, forwardRef, type ReactNode, type CSSProperties } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   useScrollReveal — IntersectionObserver hook for scroll-triggered reveals
   ═══════════════════════════════════════════════════════════════════════════ */
export function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      const rect = el.getBoundingClientRect();
      // Visible if: currently in viewport OR already scrolled past (above viewport)
      if (rect.bottom >= 0 && rect.top < window.innerHeight * (1 - threshold)) {
        setVisible(true);
        return true;
      }
      // Already scrolled past — element is above the viewport
      if (rect.bottom < window.innerHeight) {
        setVisible(true);
        return true;
      }
      return false;
    };

    // Check immediately (handles anchor-link jumps)
    if (check()) return;

    // Fallback: IntersectionObserver for normal scroll
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(el);

    // Also listen for scroll to catch fast navigations the observer misses
    const onScroll = () => {
      if (check()) {
        window.removeEventListener('scroll', onScroll);
        observer.disconnect();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);
  return { ref, visible };
}

/* ═══════════════════════════════════════════════════════════════════════════
   reveal() — inline style for staggered scroll reveal (fade + rise)
   ═══════════════════════════════════════════════════════════════════════════ */
export function reveal(visible: boolean, delay = 0): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(32px)',
    transition: `opacity 1.1s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 1.1s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   revealSlide() — horizontal slide-in reveal (left or right)
   ═══════════════════════════════════════════════════════════════════════════ */
export function revealSlide(visible: boolean, direction: 'left' | 'right' = 'left', delay = 0): CSSProperties {
  const offset = direction === 'left' ? '-40px' : '40px';
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateX(0)' : `translateX(${offset})`,
    transition: `opacity 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   revealScale() — scale-up reveal from center (for cards, images)
   ═══════════════════════════════════════════════════════════════════════════ */
export function revealScale(visible: boolean, delay = 0): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1)' : 'scale(0.92)',
    transition: `opacity 1.1s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 1.1s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SectionWrapper — full-width section container with max-w + padding
   ═══════════════════════════════════════════════════════════════════════════ */
interface SectionWrapperProps {
  id?: string;
  children: ReactNode;
  className?: string;
  /** 'light' = bg-white/dark, 'alt' = bg-gray-50/#111113 */
  bg?: 'light' | 'alt';
}

export const SectionWrapper = forwardRef<HTMLElement, SectionWrapperProps>(
  function SectionWrapper({ id, children, className = '', bg = 'light' }, ref) {
    const bgClass = bg === 'alt'
      ? 'bg-[#F8F9FB] dark:bg-[#111113]'
      : 'bg-white dark:bg-[#09090B]';

    return (
      <section ref={ref} id={id} className={`relative overflow-hidden ${bgClass} ${className}`} style={{ padding: '120px 24px' }}>
        <div className="max-w-6xl mx-auto relative z-[2]">
          {children}
        </div>
      </section>
    );
  }
);

/* ═══════════════════════════════════════════════════════════════════════════
   SectionLabel — small red dot + uppercase label
   ═══════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════
   SectionTitle — headline with optional red accent bar
   ═══════════════════════════════════════════════════════════════════════════ */
export function SectionTitle({ children, bar = true, maxWidth, style }: {
  children: ReactNode;
  bar?: boolean;
  maxWidth?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`flex gap-4 mb-5 ${bar ? '' : ''}`} style={style}>
      {bar && <div className="w-[3px] rounded-full shrink-0 self-stretch mt-1 bg-[#EC0000]" />}
      <h2
        className="font-headline font-bold text-gray-900 dark:text-white leading-[1.12]"
        style={{ fontSize: 'clamp(1.875rem, 4vw, 2.75rem)', maxWidth: maxWidth || '700px' }}
      >
        {children}
      </h2>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TiltCard — 3D tilt-on-hover card with perspective
   ═══════════════════════════════════════════════════════════════════════════ */
interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  glare?: boolean;
}

export function TiltCard({ children, className = '', style, glare = true }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -10;
    const rotateY = (x - 0.5) * 10;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
    if (glareRef.current) {
      glareRef.current.style.opacity = '1';
      glareRef.current.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;
    }
  };

  const handleLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
    if (glareRef.current) glareRef.current.style.opacity = '0';
  };

  return (
    <div
      ref={cardRef}
      className={`relative transition-transform duration-300 ease-out ${className}`}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform', ...style }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {glare && (
        <div
          ref={glareRef}
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 transition-opacity duration-300"
          style={{ opacity: 0 }}
        />
      )}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GlassCard — glassmorphism container
   ═══════════════════════════════════════════════════════════════════════════ */
export function GlassCard({ children, className = '', style }: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AnimatedCounter — number animates from 0 to target on reveal
   ═══════════════════════════════════════════════════════════════════════════ */
export function AnimatedCounter({ value, visible, suffix = '', prefix = '' }: {
  value: number;
  visible: boolean;
  suffix?: string;
  prefix?: string;
}) {
  const [current, setCurrent] = useState(0);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!visible || animatedRef.current) return;
    animatedRef.current = true;
    const duration = 2800;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, value]);

  return <>{prefix}{current}{suffix}</>;
}
