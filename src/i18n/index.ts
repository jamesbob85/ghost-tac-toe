import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'intl-pluralrules';

// Import all locale files statically
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import hi from './locales/hi.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';
import ru from './locales/ru.json';
import ar from './locales/ar.json';
import tr from './locales/tr.json';
import it from './locales/it.json';
import id from './locales/id.json';
import th from './locales/th.json';

const LANGUAGE_KEY = '@ghost_tac_toe_language';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  hi: 'हिन्दी',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  ru: 'Русский',
  ar: 'العربية',
  tr: 'Türkçe',
  it: 'Italiano',
  id: 'Bahasa Indonesia',
  th: 'ไทย',
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  fr: { translation: fr },
  de: { translation: de },
  hi: { translation: hi },
  ja: { translation: ja },
  ko: { translation: ko },
  zh: { translation: zh },
  ru: { translation: ru },
  ar: { translation: ar },
  tr: { translation: tr },
  it: { translation: it },
  id: { translation: id },
  th: { translation: th },
};

function getDeviceLanguage(): string {
  const locales = Localization.getLocales();
  const deviceLang = locales[0]?.languageCode ?? 'en';
  // Use the language if we support it, otherwise fall back to English
  return deviceLang in resources ? deviceLang : 'en';
}

/** Load stored language preference, or use device language */
export async function getStoredLanguage(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored && stored in resources) return stored;
  } catch {}
  return getDeviceLanguage();
}

/** Save language preference */
export async function setStoredLanguage(lang: string): Promise<void> {
  if (lang === 'system') {
    await AsyncStorage.removeItem(LANGUAGE_KEY);
    const deviceLang = getDeviceLanguage();
    await i18next.changeLanguage(deviceLang);
  } else {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await i18next.changeLanguage(lang);
  }
}

// Initialize with device language (will be overridden if stored preference exists)
i18next.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false,
  },
});

// Load stored preference asynchronously
getStoredLanguage().then((lang) => {
  if (lang !== i18next.language) {
    i18next.changeLanguage(lang);
  }
});

export default i18next;
