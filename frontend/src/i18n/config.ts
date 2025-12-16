import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptPT from './locales/pt-PT.json';
import es from './locales/es.json';
import en from './locales/en.json';

const resources = {
  'pt-PT': { translation: ptPT },
  es: { translation: es },
  en: { translation: en },
};

const supportedLanguages = ['pt-PT', 'es', 'en'] as const;

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'pt-PT';
  }

  const saved = localStorage.getItem('language');
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

export default i18n;
