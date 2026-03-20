import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Animated scroll-down indicator for the hero section.
 * Appears after a delay (when the Teams animation has settled)
 * and fades out as user scrolls past 200px.
 */
export default function ScrollCue() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Show after 3s (Teams animation needs ~2.5s to populate)
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 200);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    const hero = document.querySelector('section');
    if (hero) {
      const bottom = hero.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo({ top: bottom, behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer group"
      style={{
        opacity: visible && !hidden ? 1 : 0,
        transform: visible && !hidden ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        pointerEvents: visible && !hidden ? 'auto' : 'none',
      }}
      aria-label={t('landing.scroll.discover')}
    >
      <span className="font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-white/35 group-hover:text-[#EC0000] dark:group-hover:text-[#EC0000] transition-colors duration-300">
        {t('landing.scroll.discover')}
      </span>
      <div className="relative w-6 h-10 rounded-full border-2 border-gray-300 dark:border-white/20 group-hover:border-[#EC0000]/50 transition-colors duration-300">
        <div
          className="absolute left-1/2 -translate-x-1/2 top-2 w-1 h-2.5 rounded-full"
          style={{
            background: '#EC0000',
            animation: 'scrollDot 2s ease-in-out infinite',
          }}
        />
      </div>
      <ChevronDown
        className="w-4 h-4 text-gray-400 dark:text-white/25 group-hover:text-[#EC0000] transition-colors duration-300"
        style={{ animation: 'bounceChevron 2s ease-in-out infinite' }}
      />
    </button>
  );
}
