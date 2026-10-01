'use client';

import React from 'react';
import CashierClient from './CashierClient';
import { Store, FileText, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '../../context/i18nContext';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';

export default function PosPage() {
  const { t } = useI18n();

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
            title={t('pos.backToAdmin', 'Quay lại Admin')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-zinc-100">{t('pos.title', 'POS THU NGÂN')}</h1>
              <p className="text-[10px] text-amber-400 font-medium">{t('pos.branchShift', 'Chi nhánh Q.1 • Ca Sáng')}</p>
            </div>
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <Link
            href="/admin/z-report"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl transition border border-zinc-700"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('pos.zReport', 'Chốt Ca (Z-Report)')}</span>
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800 text-xs text-zinc-300">
            <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline font-semibold">{t('pos.cashierName', 'Thu Ngân (Mai)')}</span>
          </div>
        </div>
      </header>

      {/* POS Interactive Workspace */}
      <main className="flex-1 overflow-hidden">
        <CashierClient />
      </main>
    </div>
  );
}
