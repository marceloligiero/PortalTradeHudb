import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

/**
 * SectionTransition — floating microcopy between sections that instigates
 * the user to keep scrolling.
 *
 * `align` positions the text on lg+ screens to avoid the ScrollFlowLine:
 *   - "left"   → text on the left side (line is on the right rail)
 *   - "right"  → text on the right side (line is on the left rail)
 *   - "center" → default centered (mobile always centered)
 *   - "below"  → centered but with extra top padding (below the line endpoint pulse)
 */

type Align = 'left' | 'right' | 'center' | 'below';

interface SectionTransitionProps {
  textKey: string;
  /** Position relative to ScrollFlowLine on desktop. Default "center". */
  align?: Align;
  /** Show immediately on load (no scroll trigger). Default false. */
  eager?: boolean;
  /** Target section id to smooth-scroll to on click. */
  targetId?: string;
}

const ALIGN_CLASSES: Record<Align, string> = {
  center: 'items-center',
  left:   'items-center lg:items-start lg:pl-[12%]',
  right:  'items-center lg:items-end lg:pr-[12%]',
  below:  'items-center pt-16 sm:pt-20',
};

export default function SectionTransition({ textKey, align = 'center', eager = false, targetId }: SectionTransitionProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);
  const [parallaxY, setParallaxY] = useState(0);

  const handleClick = () => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (eager) return; // already visible
    const el = ref.current;
    if (!el) return;

    // For align="below", wait for ScrollFlowLine to finish drawing (pulse visible)
    if (align === 'below') {
      const onComplete = () => setVisible(true);
      window.addEventListener('flowline-complete', onComplete);
      return () => window.removeEventListener('flowline-complete', onComplete);
    }

    const check = () => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom >= 0 && rect.top < window.innerHeight * 0.7) {
        setVisible(true);
        return true;
      }
      if (rect.bottom < window.innerHeight) {
        setVisible(true);
        return true;
      }
      return false;
    };

    if (check()) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 },
    );
    observer.observe(el);

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
  }, [align]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const offset = (center - viewH / 2) / viewH;
      setParallaxY(offset * -14);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={ref}
      className={`relative z-[3] flex flex-col py-6 sm:py-8 pointer-events-none select-none ${ALIGN_CLASSES[align]}`}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateY(${visible ? parallaxY : 14}px)`,
          transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s',
        }}
        className="flex flex-col items-center gap-1.5"
      >
        <p className="font-body text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-white/60">
          {t(`landing.scroll.${textKey}`)}
        </p>
        <ChevronDown
          className="w-3.5 h-3.5 text-gray-400 dark:text-white/40"
          style={{ animation: visible ? 'bounceChevron 2s ease-in-out infinite' : 'none' }}
        />
      </div>
    </div>
  );
}
