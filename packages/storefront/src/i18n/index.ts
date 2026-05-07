import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import zhTW from './locales/zh-TW.json';
import th from './locales/th.json';
import id from './locales/id.json';
import vi from './locales/vi.json';
import tl from './locales/tl.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'zh-TW', name: '繁體中文', flag: '<svg viewBox="0 0 1000 600" width="24" height="16" style="border: 0.5px solid #eee; border-radius: 2px;"><rect width="250" height="600" fill="#008100"/><rect x="250" width="500" height="600" fill="#fff"/><rect x="750" width="250" height="600" fill="#008100"/><path d="M545,86c-5-2-12-6-16-10s-5-6-3-9c1-3,5-6,11-6s12,3,15,6s5,6,3,9S550,88,545,86z M551,324c-31-48-62-92-93-131 c-23-28-46-51-68-68c-22-16-43-26-64-30c-21-4-41-1-60,8s-37,25-54,49c-16,24-31,56-43,94c-12,38-22,83-29,134c-7,51-11,108-11,170 h20c0-60,4-115,10-164c6-49,15-92,26-129c11-37,25-67,40-90c15-23,32-39,50-47c18-8,36-11,54-7c18,4,37,13,57,28 c20,15,41,36,62,62C500,227,527,272,551,324z" transform="translate(250, 100) scale(0.6)" fill="#008100"/></svg>' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const savedLanguage = localStorage.getItem('language') || 'zh-TW';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    it: { translation: it },
    pt: { translation: pt },
    'zh-TW': { translation: zhTW },
    th: { translation: th },
    id: { translation: id },
    vi: { translation: vi },
    tl: { translation: tl },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  document.documentElement.lang = lng;
});

export default i18n;
