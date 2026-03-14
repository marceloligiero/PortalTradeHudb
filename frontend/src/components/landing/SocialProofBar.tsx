import { useTranslation } from 'react-i18next';

const PROOFS = [
  { key: 'tests', value: '341' },
  { key: 'portals', value: '5' },
  { key: 'languages', value: '3' },
  { key: 'api', value: 'REST' },
  { key: 'cicd', value: 'CI/CD' },
];

export default function SocialProofBar() {
  const { t } = useTranslation();

  return (
    <section className="bg-white dark:bg-[#111] border-y border-gray-200 dark:border-gray-800 py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Desktop: static flex */}
        <div className="hidden md:flex items-center justify-center gap-6 flex-wrap">
          {PROOFS.map((item, i) => (
            <span key={item.key} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-mono">
              <span className="text-santander-500">✓</span>
              {t(`landing.proof.${item.key}`)}
              {i < PROOFS.length - 1 && (
                <span className="ml-4 text-gray-300 dark:text-gray-700">·</span>
              )}
            </span>
          ))}
        </div>

        {/* Mobile: marquee scroll */}
        <div className="md:hidden relative">
          <div className="flex animate-marquee whitespace-nowrap gap-8">
            {[...PROOFS, ...PROOFS].map((item, i) => (
              <span key={`${item.key}-${i}`} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-mono shrink-0">
                <span className="text-santander-500">✓</span>
                {t(`landing.proof.${item.key}`)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
