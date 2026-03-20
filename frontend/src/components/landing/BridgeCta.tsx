import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

/**
 * BridgeCta — microcopy text that appears directly below the ScrollFlowLine
 * pulse endpoint. Uses absolute positioning based on the real pulse coordinates
 * dispatched via the 'flowline-complete' custom event.
 *
 * On screens < 1024px (no ScrollFlowLine), falls back to a simple centered
 * reveal triggered by IntersectionObserver.
 */
export default function BridgeCta() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [pulseY, setPulseY] = useState<number | null>(null);

  useEffect(() => {
    // Listen for the line completion with exact endpoint coords
    const onComplete = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.y) {
        setPulseY(detail.y);
        setVisible(true);
      }
    };
    window.addEventListener('flowline-complete', onComplete);

    // Fallback for small screens (no ScrollFlowLine)
    const checkSmall = () => {
      if (window.innerWidth >= 1024) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        setVisible(true);
      }
    };
    window.addEventListener('scroll', checkSmall, { passive: true });
    checkSmall();

    return () => {
      window.removeEventListener('flowline-complete', onComplete);
      window.removeEventListener('scroll', checkSmall);
    };
  }, []);

  // On large screens: absolutely position 50px below the pulse endpoint
  // On small screens: just render in normal flow
  const isLg = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const useAbsolute = isLg && pulseY !== null;

  return (
    <div
      ref={ref}
      className="pointer-events-none select-none"
      style={useAbsolute ? {
        position: 'absolute',
        top: pulseY + 50,
        left: 0,
        right: 0,
        zIndex: 4,
      } : {
        position: 'relative',
        zIndex: 4,
        paddingTop: '1rem',
        paddingBottom: '1rem',
      }}
    >
      <div
        className="flex flex-col items-center gap-1.5"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s',
        }}
      >
        <p className="font-body text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-white/25">
          {t('landing.scroll.bridgeCta')}
        </p>
        <ChevronDown
          className="w-3.5 h-3.5 text-gray-300 dark:text-white/15"
          style={{ animation: visible ? 'bounceChevron 2s ease-in-out infinite' : 'none' }}
        />
      </div>
    </div>
  );
}
