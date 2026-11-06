import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  APP_LANGUAGE_KEY,
  getAppLanguage,
  loadSavedLanguage,
  setAppLanguage,
} from '../src/i18n';
import taTranslation from '../src/locales/ta/translation.json';
import enTranslation from '../src/locales/en/translation.json';

describe('i18n Localization Engine', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await setAppLanguage('ta');
  });

  afterAll(async () => {
    await setAppLanguage('ta');
  });

  it('defaults to Tamil (ta)', () => {
    expect(getAppLanguage()).toBe('ta');
  });

  it('switches to English and persists in AsyncStorage', async () => {
    await setAppLanguage('en');
    expect(getAppLanguage()).toBe('en');

    const saved = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
    expect(saved).toBe('en');
  });

  it('restores saved language preference from AsyncStorage', async () => {
    await AsyncStorage.setItem(APP_LANGUAGE_KEY, 'en');
    const restored = await loadSavedLanguage();
    expect(restored).toBe('en');
    expect(getAppLanguage()).toBe('en');
  });

  it('has identical top-level and nested key structures between Tamil and English dictionaries', () => {
    const getKeys = (obj: any, prefix = ''): string[] => {
      let keys: string[] = [];
      for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          keys = keys.concat(getKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys.sort();
    };

    const taKeys = getKeys(taTranslation);
    const enKeys = getKeys(enTranslation);

    expect(taKeys).toEqual(enKeys);
    expect(taKeys.length).toBeGreaterThan(50);
  });
});
