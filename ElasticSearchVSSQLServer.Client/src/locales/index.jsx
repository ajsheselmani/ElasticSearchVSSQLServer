import en from './languages/en.json';
import sq from './languages/sq.json';
import sr from './languages/sr.json';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: en,
  },
  sq: {
    translation: sq,
  },
  sr: {
    translation: sr,
  },
};

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'sq',
  lng: 'sq',
  interpolation: {
    escapeValue: false,
  },
});

export const dateLocales = {
  en: () => import('dayjs/locale/en'),
  sq: () => import('dayjs/locale/sq'),
  sr: () => import('dayjs/locale/sr'),
};

export default i18n;
