import { useEffect, useState } from 'react';

/**
 * Thin progress bar fixed at the top of the viewport.
 * Shows how far the user has scrolled through the page.
 * Only visible after scrolling past the hero (>100vh).
 */
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollY / docHeight) * 100 : 0);
      setShow(scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="fixed top-16 left-0 right-0 z-40 h-[2px] pointer-events-none"
      style={{ opacity: show ? 1 : 0, transition: 'opacity 0.3s ease' }}
    >
      <div
        className="h-full"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #EC0000 0%, #FF3333 50%, #EC0000 100%)',
          transition: 'width 0.1s linear',
          boxShadow: '0 0 8px rgba(236,0,0,0.4)',
        }}
      />
    </div>
  );
}
