import { useTranslation } from 'react-i18next';

const TECH = [
  'React', 'FastAPI', 'MySQL', 'Docker',
  'Tailwind', 'TypeScript', 'Zustand', 'Python 3.13',
];

export default function TechStack() {
  const { t } = useTranslation();
  // Duplicar para ANIM 13 — Marquee contínuo sem salto
  const items = [...TECH, ...TECH];

  return (
    <section className="bg-gray-50 dark:bg-gray-950 py-16 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 mb-6">
        <p className="font-text text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 text-center">
          {t('landing.tech.title')}
        </p>
      </div>

      {/* ANIM 13 — Marquee */}
      <div className="relative overflow-hidden">
        {/* fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-gray-50 dark:from-gray-950 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-gray-50 dark:from-gray-950 to-transparent z-10" />

        <div className="flex animate-marquee whitespace-nowrap gap-12" style={{ width: 'max-content' }}>
          {items.map((tech, i) => (
            <span
              key={`${tech}-${i}`}
              className="font-mono text-sm md:text-base text-gray-400 dark:text-gray-500 hover:text-santander-500 dark:hover:text-santander-500 transition-colors duration-300 cursor-default shrink-0"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
