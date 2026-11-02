import legacyEn from '@/locales/legacy.en.json';
import legacyVi from '@/locales/legacy.vi.json';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createInstance } from 'i18next';
import en from '@/locales/en.json';
import vi from '@/locales/vi.json';
import articlesEn from '@/locales/articles.en.json';
import articlesVi from '@/locales/articles.vi.json';

type Language = 'en' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const i18n = createInstance();
void i18n.init({
  resources: {
    en: { translation: { ...legacyEn, ...en, ...articlesEn } },
    vi: { translation: { ...legacyVi, ...vi, ...articlesVi } },
  },
  lng: 'vi',
  fallbackLng: 'en',
  supportedLngs: ['vi', 'en'],
  keySeparator: false,
  initImmediate: false,
  interpolation: { escapeValue: false },
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('vi');

  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage === 'en' || savedLanguage === 'vi') setLanguage(savedLanguage);
    } catch {
      /* The page also works when browser storage is disabled. */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('language', lang);
    } catch {
      /* Keep the in-memory preference. */
    }
  };

  const t = (key: string): string => {
    return i18n.t(key, { lng: language });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
