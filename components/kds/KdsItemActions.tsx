'use client';

import React from 'react';
import { Check, Clock, Flame } from 'lucide-react';

interface KdsItemActionsProps {
  itemId: string;
  status: 'PENDING' | 'PREPARING' | 'DONE';
  onStatusChange: (itemId: string, newStatus: 'PENDING' | 'PREPARING' | 'DONE') => void;
}

export function KdsItemActions({ itemId, status, onStatusChange }: KdsItemActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {status === 'PENDING' && (
        <button
          type="button"
          onClick={() => onStatusChange(itemId, 'PREPARING')}
          className="p-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition text-[11px] flex items-center gap-1 px-2"
          title="Chuyển sang đang nấu"
        >
          <Flame className="w-3 h-3 text-amber-500" />
          <span>Nấu</span>
        </button>
      )}

      {status === 'PREPARING' && (
        <button
          type="button"
          onClick={() => onStatusChange(itemId, 'DONE')}
          className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition text-[11px] flex items-center gap-1 px-2"
          title="Hoàn tất món này"
        >
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Xong</span>
        </button>
      )}

      {status === 'DONE' && (
        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
          <Check className="w-3 h-3" />
          <span>Sẵn sàng</span>
        </span>
      )}
    </div>
  );
}

export default KdsItemActions;
