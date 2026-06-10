import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';

/**
 * i18n scaffold. English only for Phase 1; Telugu ("te") slots in for Phase 2
 * by adding a locale file — no UI changes required.
 */
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
