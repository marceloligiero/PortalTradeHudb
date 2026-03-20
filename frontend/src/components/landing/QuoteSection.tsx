import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FAQ_KEYS = [
  { qKey: 'q1', aKey: 'a1' },
  { qKey: 'q2', aKey: 'a2' },
  { qKey: 'q3', aKey: 'a3' },
  { qKey: 'q4', aKey: 'a4' },
  { qKey: 'q5', aKey: 'a5' },
];

export default function QuoteSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(['.faq-header', '.faq-item'], { opacity: 1, y: 0 });
        return;
      }
      gsap.from('.faq-header', {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      });
      gsap.from('.faq-item', {
        y: 30, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section
      ref={sectionRef}
      className="bg-white dark:bg-[#09090B] px-6"
      style={{ paddingTop: '160px', paddingBottom: '160px' }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          className="faq-header font-headline font-bold text-[#111827] dark:text-white leading-[1.0] mb-16"
          style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
        >
          {t('landing.faq.title')}
        </h2>

        <div>
          {FAQ_KEYS.map((faqKey, i) => (
            <div key={i} className="faq-item border-b border-gray-200 dark:border-white/[0.06]">
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between py-6 text-left group"
              >
                <span className="font-body text-[#111827] dark:text-white text-base pr-8 group-hover:text-gray-600 dark:group-hover:text-white/80 transition-colors">
                  {t(`landing.faq.${faqKey.qKey}`)}
                </span>
                <span className="shrink-0 text-gray-400 dark:text-[#444] group-hover:text-gray-600 dark:group-hover:text-[#777] transition-colors">
                  {openIndex === i ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </span>
              </button>
              {openIndex === i && (
                <div className="pb-6">
                  <p className="font-body text-gray-500 dark:text-[#555] text-sm leading-relaxed">
                    {t(`landing.faq.${faqKey.aKey}`)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
