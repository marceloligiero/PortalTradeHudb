import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ROLE_DEFS = [
  {
    quoteKey: 'recorderQuote',
    roleKey: 'recorderRole',
    subtitleKey: 'recorderSubtitle',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&q=80',
  },
  {
    quoteKey: 'verifierQuote',
    roleKey: 'verifierRole',
    subtitleKey: 'verifierSubtitle',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&q=80',
  },
  {
    quoteKey: 'managerQuote',
    roleKey: 'managerRole',
    subtitleKey: 'managerSubtitle',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=160&q=80',
  },
];

export default function PillarsSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(['.testi-header', '.testimonial-card'], { opacity: 1, y: 0 });
        return;
      }
      gsap.from('.testi-header', {
        y: 60, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
      });
      gsap.from('.testimonial-card', {
        y: 60, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="para-quem"
      ref={sectionRef}
      className="bg-white dark:bg-[#09090B] px-6"
      style={{ paddingTop: '160px', paddingBottom: '160px' }}
    >
      <div className="max-w-7xl mx-auto">
        <h2
          className="testi-header font-headline font-bold text-[#111827] dark:text-white leading-[1.0] mb-20"
          style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)' }}
        >
          {t('landing.pillars.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLE_DEFS.map((roleDef) => (
            <div
              key={roleDef.roleKey}
              className="testimonial-card bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-8 hover:border-gray-300 dark:hover:border-white/[0.12] hover:bg-white dark:hover:bg-[#0F0F0F] transition-all duration-300 group cursor-default"
            >
              {/* Decorative quote mark */}
              <div
                className="font-headline text-8xl text-gray-200 dark:text-white/[0.03] leading-none mb-2 select-none"
                aria-hidden
              >
                "
              </div>
              {/* Quote */}
              <p className="font-body text-gray-500 dark:text-[#666] text-base leading-relaxed mb-8 group-hover:text-gray-600 dark:group-hover:text-[#888] transition-colors duration-300">
                {t(`landing.pillars.${roleDef.quoteKey}`)}
              </p>
              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={roleDef.image}
                  alt={t(`landing.pillars.${roleDef.roleKey}`)}
                  loading="lazy"
                  className="w-11 h-11 rounded-full object-cover object-top grayscale opacity-70"
                />
                <div>
                  <div className="font-headline font-bold text-[#111827] dark:text-white text-sm">
                    {t(`landing.pillars.${roleDef.roleKey}`)}
                  </div>
                  <div className="font-body text-gray-400 dark:text-[#444] text-xs">
                    {t(`landing.pillars.${roleDef.subtitleKey}`)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
