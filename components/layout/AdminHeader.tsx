'use client';

import React from 'react';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { Building2, Bell, Sparkles } from 'lucide-react';

export function AdminHeader() {
  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Branch & Tenant Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-zinc-200">
          <Building2 className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-semibold">Chi Nhánh Quận 1 (Flagship)</span>
        </div>
        <span className="hidden sm:inline-block px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[10px] rounded-full uppercase tracking-wider">
          Gói PRO (Multi-Branch)
        </span>
      </div>

      {/* Right Header Utilities */}
      <div className="flex items-center gap-3">
        <LanguageSwitcher />

        <button
          type="button"
          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition relative"
          title="Thông báo hệ thống"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
