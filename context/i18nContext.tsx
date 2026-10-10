'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import vi from '../lib/i18n/locales/vi.json';
import en from '../lib/i18n/locales/en.json';

type Locale = 'vi' | 'en';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, fallback?: string) => string;
}

const translations: Record<Locale, any> = { vi, en };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('vi');

  useEffect(() => {
    const saved = localStorage.getItem('menugo_locale') as Locale;
    if (saved && (saved === 'vi' || saved === 'en')) {
      setLocaleState(saved);
    } else {
      setLocaleState('vi');
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('menugo_locale', newLocale);
  };

  const t = (path: string, fallback: string = ''): string => {
    const keys = path.split('.');
    let current = translations[locale];
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return fallback || path;
      }
    }
    return typeof current === 'string' ? current : fallback || path;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export default I18nProvider;
