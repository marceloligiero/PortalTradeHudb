import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

interface SectionBridgeProps {
  /** i18n key under landing.scroll (e.g. "bridgeProblem") */
  textKey: string;
  /** Background matches the section ABOVE */
  bgClass?: string;
}

/**
 * A micro-element placed between sections that:
 * 1. Creates visual continuity (gradient fade)
 * 2. Teases the next section with curiosity-driven microcopy
 * 3. Shows a subtle animated chevron
 *
 * Reveals on scroll via IntersectionObserver.
 */
export default function SectionBridge({ textKey, bgClass = 'bg-white dark:bg-[#09090B]' }: SectionBridgeProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative ${bgClass} py-6 sm:py-8`}>
      <div
        className="flex flex-col items-center gap-2"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        {/* Thin accent line */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-[#EC0000]/30 to-transparent" />

        {/* Microcopy */}
        <p className="font-body text-[11px] sm:text-xs font-medium text-gray-400 dark:text-white/25 tracking-wide text-center px-4 max-w-xs">
          {t(`landing.scroll.${textKey}`)}
        </p>

        {/* Chevron */}
        <ChevronDown
          className="w-4 h-4 text-gray-300 dark:text-white/15"
          style={{ animation: visible ? 'bounceChevron 2s ease-in-out infinite' : 'none' }}
        />
      </div>
    </div>
  );
}
