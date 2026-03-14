import { useTranslation } from 'react-i18next';

const TECH = [
  { name: 'React', mono: 'React' },
  { name: 'FastAPI', mono: 'FastAPI' },
  { name: 'MySQL', mono: 'MySQL' },
  { name: 'Docker', mono: 'Docker' },
  { name: 'Tailwind', mono: 'Tailwind' },
  { name: 'TypeScript', mono: 'TypeScript' },
  { name: 'Zustand', mono: 'Zustand' },
];

export default function TechStack() {
  const { t } = useTranslation();

  return (
    <section className="bg-gray-50 dark:bg-gray-950 py-16">
      <div className="max-w-5xl mx-auto px-6">
        <p className="font-body text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 text-center mb-8">
          {t('landing.tech.title')}
        </p>
        <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap">
          {TECH.map((tech) => (
            <span
              key={tech.name}
              className="font-mono text-sm md:text-base text-gray-400 dark:text-gray-600 opacity-30 hover:opacity-100 transition-opacity duration-300 cursor-default"
            >
              {tech.mono}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
