'use client';

import React, { useState, useEffect } from 'react';
import KdsItemActions from './KdsItemActions';
import { Clock, CheckCircle, Flame, AlertTriangle } from 'lucide-react';

export interface KdsOrderItem {
  id: string;
  name: string;
  quantity: number;
  note?: string;
  modifiers?: Array<{ optionName: string }>;
  status?: 'PENDING' | 'PREPARING' | 'DONE';
}

export interface KdsOrder {
  id: string;
  orderCode: string;
  tableName: string;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  status: 'PENDING' | 'PREPARING' | 'DONE';
  createdAt: string;
  items: KdsOrderItem[];
  note?: string;
}

interface OrderKanbanCardProps {
  order: KdsOrder;
  onUpdateOrderStatus: (orderId: string, status: 'PENDING' | 'PREPARING' | 'DONE') => void;
  onUpdateItemStatus: (orderId: string, itemId: string, status: 'PENDING' | 'PREPARING' | 'DONE') => void;
}

export function OrderKanbanCard({
  order,
  onUpdateOrderStatus,
  onUpdateItemStatus,
}: OrderKanbanCardProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const start = new Date(order.createdAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const isUrgent = elapsedMinutes >= 15;
  const isWarning = elapsedMinutes >= 8 && elapsedMinutes < 15;

  return (
    <div
      className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-lg transition duration-200 ${
        isUrgent
          ? 'bg-red-950/20 border-red-500/80 shadow-red-500/10'
          : order.status === 'PREPARING'
          ? 'bg-zinc-900 border-amber-500/40 shadow-amber-500/5'
          : order.status === 'DONE'
          ? 'bg-zinc-900 border-emerald-500/40'
          : 'bg-zinc-900 border-zinc-800'
      }`}
    >
      {/* Top Header */}
      <div className="p-3.5 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-zinc-100">{order.orderCode}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 border border-zinc-700">
              {order.tableName}
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
            {order.orderType === 'DINE_IN' ? 'Tại bàn' : 'Mang về'}
          </span>
        </div>

        {/* Elapsed Timer */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-xs font-bold ${
            isUrgent
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
              : isWarning
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-zinc-800 text-zinc-300'
          }`}
        >
          {isUrgent ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          <span>
            {elapsedMinutes}:{elapsedSeconds % 60 < 10 ? `0${elapsedSeconds % 60}` : elapsedSeconds % 60}
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="p-3.5 space-y-2.5 flex-1">
        {order.items.map((item) => (
          <div
            key={item.id}
            className={`p-2.5 rounded-xl border transition ${
              item.status === 'DONE'
                ? 'bg-zinc-950/50 border-emerald-500/20 opacity-60'
                : 'bg-zinc-800/40 border-zinc-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {item.quantity}
                </span>
                <span className="font-semibold text-sm text-zinc-100">{item.name}</span>
              </div>
              <KdsItemActions
                itemId={item.id}
                status={item.status || 'PENDING'}
                onStatusChange={(itemId, newStatus) =>
                  onUpdateItemStatus(order.id, itemId, newStatus)
                }
              />
            </div>

            {/* Modifiers Pill Info */}
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="text-[11px] text-amber-300 font-medium pl-8 pt-1">
                {item.modifiers.map((m) => m.optionName).join(' • ')}
              </div>
            )}

            {/* Note */}
            {item.note && (
              <p className="text-[11px] text-red-400 font-medium italic pl-8 pt-0.5">
                ★ {item.note}
              </p>
            )}
          </div>
        ))}

        {order.note && (
          <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 p-2 rounded-xl">
            <strong>Ghi chú đơn:</strong> {order.note}
          </div>
        )}
      </div>

      {/* Order Level CTA */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center gap-2">
        {order.status === 'PENDING' && (
          <button
            type="button"
            onClick={() => onUpdateOrderStatus(order.id, 'PREPARING')}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
          >
            <Flame className="w-4 h-4" />
            <span>Nhận Nấu Toàn Bộ</span>
          </button>
        )}

        {order.status === 'PREPARING' && (
          <button
            type="button"
            onClick={() => onUpdateOrderStatus(order.id, 'DONE')}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Hoàn Tất Ra Món</span>
          </button>
        )}

        {order.status === 'DONE' && (
          <div className="w-full py-2 text-center text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>Đã hoàn thành</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderKanbanCard;
