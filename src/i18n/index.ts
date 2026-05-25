import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './locales/ru.json';
import kk from './locales/kk.json';

const LANG_KEY = 'lang';

export const LANGUAGES = [
  { code: 'ru', label: 'RU' },
  { code: 'kk', label: 'KK' },
] as const;

export type LangCode = (typeof LANGUAGES)[number]['code'];

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    kk: { translation: kk },
  },
  lng: (localStorage.getItem(LANG_KEY) as LangCode) ?? 'ru',
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
});

export function setLanguage(code: LangCode) {
  void i18n.changeLanguage(code);
  localStorage.setItem(LANG_KEY, code);
}

export { i18n };
