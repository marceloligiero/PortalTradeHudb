import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { number: 1, key: 'register' },
  { number: 2, key: 'access'   },
  { number: 3, key: 'tutoring' },
  { number: 4, key: 'evolve'   },
];

export default function HowItWorks() {
  const { t } = useTranslation();
  const sectionRef  = useRef<HTMLElement>(null);
  const titleRef    = useRef<HTMLHeadingElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lineRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set([titleRef.current, '.timeline-step', lineRef.current], { opacity: 1, x: 0, scaleY: 1 });
        return;
      }

      // ANIM 4 — título
      gsap.from(titleRef.current, {
        y: 80, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: titleRef.current, start: 'top 85%' },
      });

      // ANIM 8 — Timeline: linha cresce + steps entram da esquerda
      gsap.from(lineRef.current, {
        scaleY: 0, transformOrigin: 'top', duration: 1.2, ease: 'power2.inOut',
        scrollTrigger: { trigger: timelineRef.current, start: 'top 70%' },
      });

      gsap.from('.timeline-step', {
        x: -40, opacity: 0, duration: 0.6, stagger: 0.25, ease: 'power2.out',
        scrollTrigger: { trigger: timelineRef.current, start: 'top 70%' },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-gray-50 dark:bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto px-6">
        <h2 ref={titleRef} className="font-headline text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-16">
          {t('landing.howItWorks.title')}
        </h2>

        <div ref={timelineRef} className="relative">
          {/* Timeline line — animada com scaleY */}
          <div
            ref={lineRef}
            className="absolute left-5 md:left-1/2 top-0 bottom-0 w-0.5 bg-santander-500/30 -translate-x-1/2"
          />

          {STEPS.map((step, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div key={step.key} className="timeline-step relative flex items-start mb-12 last:mb-0">
                {/* Mobile: conteúdo sempre à direita */}
                <div className="md:hidden flex items-start gap-4">
                  <div className="relative z-10 w-10 h-10 rounded-full bg-santander-500 text-white font-mono font-bold flex items-center justify-center shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {t(`landing.howItWorks.${step.key}.title`)}
                    </h3>
                    <p className="font-text text-gray-500 dark:text-gray-400">
                      {t(`landing.howItWorks.${step.key}.description`)}
                    </p>
                  </div>
                </div>

                {/* Desktop: alternado esquerda/direita */}
                <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:gap-8 md:items-center w-full">
                  <div className={isLeft ? 'text-right' : ''}>
                    {isLeft && (
                      <>
                        <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {t(`landing.howItWorks.${step.key}.title`)}
                        </h3>
                        <p className="font-text text-gray-500 dark:text-gray-400">
                          {t(`landing.howItWorks.${step.key}.description`)}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="relative z-10 w-10 h-10 rounded-full bg-santander-500 text-white font-mono font-bold flex items-center justify-center">
                    {step.number}
                  </div>
                  <div>
                    {!isLeft && (
                      <>
                        <h3 className="font-headline text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {t(`landing.howItWorks.${step.key}.title`)}
                        </h3>
                        <p className="font-text text-gray-500 dark:text-gray-400">
                          {t(`landing.howItWorks.${step.key}.description`)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
