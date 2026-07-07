import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../../../storefront/src/i18n/locales/en.json';
import es from '../../../storefront/src/i18n/locales/es.json';
import fr from '../../../storefront/src/i18n/locales/fr.json';
import de from '../../../storefront/src/i18n/locales/de.json';
import it from '../../../storefront/src/i18n/locales/it.json';
import pt from '../../../storefront/src/i18n/locales/pt.json';
import zhTW from '../../../storefront/src/i18n/locales/zh-TW.json';
import th from '../../../storefront/src/i18n/locales/th.json';
import id from '../../../storefront/src/i18n/locales/id.json';
import vi from '../../../storefront/src/i18n/locales/vi.json';
import tl from '../../../storefront/src/i18n/locales/tl.json';
import ja from '../../../storefront/src/i18n/locales/ja.json';
import ko from '../../../storefront/src/i18n/locales/ko.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
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

const LANGUAGE_KEY = 'language';

// Load saved language async, default to 'zh-TW' or 'en'
AsyncStorage.getItem(LANGUAGE_KEY).then((lng) => {
  if (lng && lng !== i18n.language) {
    i18n.changeLanguage(lng);
  }
});

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
    ja: { translation: ja },
    ko: { translation: ko },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  AsyncStorage.setItem(LANGUAGE_KEY, lng);
});

export default i18n;
