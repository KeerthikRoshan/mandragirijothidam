/**
 * i18n Localization Engine for Mandhragiri Jothidam
 *
 * Configured with:
 * - i18next & react-i18next
 * - Default language: Tamil ('ta')
 * - Secondary language: English ('en')
 * - Persistent language storage with @react-native-async-storage/async-storage
 * - Immediate UI language updates without app restart
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ta from './locales/ta/translation.json';
import en from './locales/en/translation.json';

export const APP_LANGUAGE_KEY = '@mandragiri_app_lang';
export const LEGACY_LANGUAGE_KEY = 'user_selected_language';
export type SupportedLanguage = 'ta' | 'en';

export const resources = {
  ta: {
    translation: ta,
  },
  en: {
    translation: en,
  },
} as const;

// Synchronous initialization with default 'ta' (Tamil)
i18n.use(initReactI18next).init({
  resources,
  lng: 'ta',
  fallbackLng: 'ta',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  compatibilityJSON: 'v4',
});

// Restore saved language preference asynchronously on app launch
export const loadSavedLanguage = async (): Promise<SupportedLanguage> => {
  try {
    const saved =
      (await AsyncStorage.getItem(APP_LANGUAGE_KEY)) ||
      (await AsyncStorage.getItem(LEGACY_LANGUAGE_KEY));
    if (saved === 'ta' || saved === 'en') {
      if (i18n.language !== saved) {
        await i18n.changeLanguage(saved);
      }
      return saved;
    }
  } catch {
    // Fall back to default 'ta'
  }
  return 'ta';
};

// Immediately invoke restoration on module import
loadSavedLanguage().catch(() => {});

/**
 * Changes language immediately across all screens and persists user selection.
 */
export const setAppLanguage = async (lang: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(lang);
  try {
    await Promise.all([
      AsyncStorage.setItem(APP_LANGUAGE_KEY, lang),
      AsyncStorage.setItem(LEGACY_LANGUAGE_KEY, lang),
    ]);
  } catch {
    // Non-fatal if storage fails
  }
};

/**
 * Returns current language code ('ta' or 'en')
 */
export const getAppLanguage = (): SupportedLanguage => {
  return (i18n.language as SupportedLanguage) || 'ta';
};

export default i18n;
