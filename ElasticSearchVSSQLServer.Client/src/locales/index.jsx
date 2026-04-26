import en from './languages/en.json';
import sq from './languages/sq.json';
import sr from './languages/sr.json';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const LANGUAGE_STORAGE_KEY = 'app_language';

export function normalizeLanguage(value) {
  return ['sq', 'en', 'sr'].includes(value) ? value : 'sq';
}

export function getStoredLanguage() {
  if (typeof window === 'undefined') return 'sq';

  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function persistLanguage(language) {
  const normalizedLanguage = normalizeLanguage(language);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
  }

  return normalizedLanguage;
}

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
  lng: getStoredLanguage(),
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
