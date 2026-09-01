import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import ta from './ta.json';

const LANGUAGE_KEY = '@apl_billing_language';

const resources = {
  en: { translation: en },
  ta: { translation: ta },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'ta', // Default to Tamil
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v3',
});

// Load saved language preference
export const loadSavedLanguage = async () => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLang && (savedLang === 'en' || savedLang === 'ta')) {
      await i18n.changeLanguage(savedLang);
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
};

// Change and persist language
export const switchLanguage = async (lang) => {
  try {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

export default i18n;

