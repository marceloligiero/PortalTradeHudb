import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TECH = [
  { name: 'React',          symbol: '⚛' },
  { name: 'TypeScript',     symbol: 'TS' },
  { name: 'Vite',           symbol: '⚡' },
  { name: 'Tailwind CSS',   symbol: '🎨' },
  { name: 'FastAPI',        symbol: '🚀' },
  { name: 'Python',         symbol: '🐍' },
  { name: 'MySQL',          symbol: '🗄' },
  { name: 'Docker',         symbol: '🐳' },
  { name: 'GitHub Actions', symbol: '⚙' },
  { name: 'Nginx',          symbol: '🌐' },
  { name: 'JWT',            symbol: '🔐' },
  { name: 'Zustand',        symbol: '🐻' },
];

export default function TechStack() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(['.tech-header', '.tech-item'], { opacity: 1, y: 0 });
        return;
      }
      gsap.from('.tech-header', {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      });
      gsap.from('.tech-item', {
        y: 30, opacity: 0, duration: 0.5, stagger: { each: 0.04, from: 'random' }, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-[#050505] border-y border-white/[0.06] px-6"
      style={{ paddingTop: '120px', paddingBottom: '120px' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="tech-header mb-12">
          <h2
            className="font-headline font-bold text-white leading-[1.0] mb-2"
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
          >
            {t('landing.tech.title')}
          </h2>
          <p className="font-body text-[#444] text-sm">
            {t('landing.tech.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {TECH.map((item) => (
            <div
              key={item.name}
              className="tech-item bg-black border border-white/[0.06] rounded-xl p-4 flex flex-col items-center gap-2 hover:border-white/[0.12] hover:bg-[#0A0A0A] transition-all duration-300 group cursor-default"
            >
              <span className="text-2xl" role="img" aria-label={item.name}>{item.symbol}</span>
              <span className="font-body text-[#444] text-xs text-center leading-tight group-hover:text-[#777] transition-colors duration-300">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
