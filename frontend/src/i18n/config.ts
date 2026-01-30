import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptPT from './locales/pt-PT.json';
import es from './locales/es.json';
import en from './locales/en.json';

const resources = {
  'pt-PT': { translation: ptPT },
  'pt': { translation: ptPT }, // Alias para compatibilidade
  es: { translation: es },
  en: { translation: en },
};

const supportedLanguages = ['pt-PT', 'pt', 'es', 'en'] as const;

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'pt-PT';
  }

  const saved = localStorage.getItem('language');
  // Normalizar "pt" para "pt-PT"
  if (saved === 'pt') {
    localStorage.setItem('language', 'pt-PT');
    return 'pt-PT';
  }
  return saved && supportedLanguages.includes(saved as (typeof supportedLanguages)[number])
    ? saved
    : 'pt-PT';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'pt-PT',
    interpolation: {
      escapeValue: false,
    },
  });

// Temporary runtime diagnostics - remove after debugging translations
if (typeof window !== 'undefined') {
  // Log current language and check if pt-PT resources exist
  // eslint-disable-next-line no-console
  console.log('i18n: current language =', i18n.language);
  // eslint-disable-next-line no-console
  console.log('i18n: has pt-PT bundle =', i18n.hasResourceBundle('pt-PT', 'translation'));
  // eslint-disable-next-line no-console
  console.log('i18n: available languages =', Object.keys(i18n.options.resources || {}));
  // Check specific keys to debug missing translations
  // eslint-disable-next-line no-console
  console.log('i18n: exists challenges.titleLabel (pt-PT) =', i18n.exists('challenges.titleLabel', { lng: 'pt-PT' }));
  // eslint-disable-next-line no-console
  console.log('i18n: resource challenges.titleLabel (pt-PT) =', i18n.getResource('pt-PT', 'translation', 'challenges.titleLabel'));
  // eslint-disable-next-line no-console
  console.log('i18n: pt-PT bundle top keys =', Object.keys(i18n.getResourceBundle('pt-PT', 'translation') || {}));
  // eslint-disable-next-line no-console
  console.log('i18n: pt-PT has challenges key =', !!i18n.getResourceBundle('pt-PT', 'translation')?.challenges);
  // eslint-disable-next-line no-console
  console.log('i18n: pt-PT.challenges keys =', Object.keys(i18n.getResourceBundle('pt-PT', 'translation')?.challenges || {}));
  // eslint-disable-next-line no-console
  console.log('i18n: pt-PT.challenges.titleLabel direct access =', i18n.getResourceBundle('pt-PT', 'translation')?.challenges?.titleLabel);

  // If nested JSON keys are present but i18next is not resolving dotted keys,
  // flatten the resource bundle into dot-notated keys so `t('challenges.titleLabel')` works.
  try {
    const res = i18n.options.resources || {};
    Object.keys(res).forEach((lng) => {
      const bundle = (res as any)[lng]?.translation || {};
      const walk = (obj: any, prefix = '') => {
        Object.keys(obj).forEach((k) => {
          const val = obj[k];
          const path = prefix ? `${prefix}.${k}` : k;
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            walk(val, path);
          } else {
            // add flattened key to i18n resource store
            try {
              i18n.addResource(lng, 'translation', path, val);
            } catch (e) {
              // ignore
            }
          }
        });
      };
      walk(bundle);
    });
    // eslint-disable-next-line no-console
    console.log('i18n: flattened resources added for languages =', Object.keys(i18n.options.resources || {}));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('i18n: error flattening resources', err);
  }
}

export default i18n;
