import { useTranslation } from 'react-i18next';

const PROOFS = [
  { key: 'tests',     value: '341' },
  { key: 'portals',   value: '5'   },
  { key: 'languages', value: '3'   },
  { key: 'api',       value: 'REST' },
  { key: 'cicd',      value: 'CI/CD' },
];

// ANIM 13 — Marquee: duplicar itens para scroll contínuo sem salto
function MarqueeTrack() {
  const { t } = useTranslation();
  const items = [...PROOFS, ...PROOFS];

  return (
    <div className="relative overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap gap-12" style={{ width: 'max-content' }}>
        {items.map((item, i) => (
          <span
            key={`${item.key}-${i}`}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-text shrink-0"
          >
            <span className="text-santander-500 font-bold">✓</span>
            <span className="font-mono text-santander-500 font-bold">{item.value}</span>
            {t(`landing.proof.${item.key}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SocialProofBar() {
  return (
    <section className="bg-white dark:bg-[#111] border-y border-gray-200 dark:border-gray-800 py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <MarqueeTrack />
      </div>
    </section>
  );
}
