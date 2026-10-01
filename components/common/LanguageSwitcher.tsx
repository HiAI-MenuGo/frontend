'use client';

import React from 'react';
import { useI18n } from '../../context/i18nContext';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-2.5 py-1 text-xs text-zinc-300">
      <Globe className="w-3.5 h-3.5 text-zinc-400" />
      <button
        type="button"
        onClick={() => setLocale('vi')}
        className={`px-1.5 py-0.5 rounded transition font-medium ${
          locale === 'vi' ? 'bg-amber-500 text-zinc-950 font-bold' : 'hover:text-white'
        }`}
      >
        VI
      </button>
      <span className="text-zinc-600">|</span>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-1.5 py-0.5 rounded transition font-medium ${
          locale === 'en' ? 'bg-amber-500 text-zinc-950 font-bold' : 'hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}

export default LanguageSwitcher;
