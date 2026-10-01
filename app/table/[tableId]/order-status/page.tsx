'use client';

import React, { useState, useEffect, use } from 'react';
import { getSocket } from '../../../../lib/socket';
import { Clock, CheckCircle2, Flame, ArrowLeft, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '../../../../context/i18nContext';

interface OrderItemLive {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: 'PENDING' | 'PREPARING' | 'DONE';
}

interface PageProps {
  params: Promise<{ tableId: string }>;
}

export default function OrderStatusPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const tableId = resolvedParams.tableId;
  const { t } = useI18n();

  const [orderStatus, setOrderStatus] = useState<'PENDING' | 'PREPARING' | 'DONE'>('PREPARING');
  const [estimatedMinutes, setEstimatedMinutes] = useState(12);
  const [orderCode] = useState('#101');
  const [items] = useState<OrderItemLive[]>([
    { id: '1', name: 'Trà Đào Cam Sả', quantity: 2, price: 45000, status: 'PREPARING' },
    { id: '2', name: 'Cà Phê Muối', quantity: 1, price: 35000, status: 'DONE' },
  ]);

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const socket = getSocket();

    const markSynced = () => setIsInitializing(false);
    const handleOrderUpdate = (payload: any) => {
      if (payload.status) {
        setOrderStatus(payload.status);
      }
      markSynced();
    };
    const handleItemUpdate = () => {
      // Cập nhật trạng thái từng món realtime (C-007).
      markSynced();
    };

    socket.on('order:updated', handleOrderUpdate);
    socket.on('order:item:status', handleItemUpdate);
    // Fallback: tránh kẹt skeleton khi socket không trả event.
    const tTimer = setTimeout(markSynced, 3000);

    return () => {
      clearTimeout(tTimer);
      socket.off('order:updated', handleOrderUpdate);
      socket.off('order:item:status', handleItemUpdate);
    };
  }, []);

  const totalAmount = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 sm:p-6 max-w-lg mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <Link
          href={`/table/${tableId}`}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('payment.addMore', 'Gọi thêm món')}</span>
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
          {t('table.table', 'Bàn')} {tableId.toUpperCase()}
        </span>
      </div>

      {/* Main Status Hero */}
      <div className="my-6 text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
          {orderStatus === 'PENDING' && <Clock className="w-8 h-8" />}
          {orderStatus === 'PREPARING' && <Flame className="w-8 h-8 text-amber-500" />}
          {orderStatus === 'DONE' && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-100">
            {orderStatus === 'PENDING' && t('payment.orderSent', 'Đã gửi đơn — Chờ bếp nhận')}
            {orderStatus === 'PREPARING' && t('payment.cooking', 'Bếp đang chế biến món ngon')}
            {orderStatus === 'DONE' && t('payment.ready', 'Món đã sẵn sàng phục vụ!')}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {t('kds.orderCode', 'Đơn')}: <strong className="text-zinc-200">{orderCode}</strong>
          </p>
        </div>

        {orderStatus === 'PREPARING' && (
          <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>~{estimatedMinutes} {t('kds.time', 'phút')}</span>
          </div>
        )}
      </div>

      {/* Status Progress Stepper */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between text-xs font-medium">
          <div className="flex flex-col items-center gap-1.5 flex-1 text-emerald-400">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
              ✓
            </div>
            <span>{t('kds.pending', 'Đã nhận đơn')}</span>
          </div>
          <div
            className={`h-0.5 flex-1 transition ${
              orderStatus !== 'PENDING' ? 'bg-amber-500' : 'bg-zinc-700'
            }`}
          />
          <div
            className={`flex flex-col items-center gap-1.5 flex-1 ${
              orderStatus === 'PREPARING' || orderStatus === 'DONE'
                ? 'text-amber-400'
                : 'text-zinc-500'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                orderStatus === 'PREPARING' || orderStatus === 'DONE'
                  ? 'border-amber-500 bg-amber-500/20'
                  : 'border-zinc-700 bg-zinc-800'
              }`}
            >
              2
            </div>
            <span>{t('kds.preparing', 'Đang nấu')}</span>
          </div>
          <div
            className={`h-0.5 flex-1 transition ${
              orderStatus === 'DONE' ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          />
          <div
            className={`flex flex-col items-center gap-1.5 flex-1 ${
              orderStatus === 'DONE' ? 'text-emerald-400' : 'text-zinc-500'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                orderStatus === 'DONE'
                  ? 'border-emerald-500 bg-emerald-500/20'
                  : 'border-zinc-700 bg-zinc-800'
              }`}
            >
              3
            </div>
            <span>{t('kds.ready', 'Sẵn sàng')}</span>
          </div>
        </div>
      </div>

      {/* Ordered Items List */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex-1 space-y-3">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {t('receipt.items', 'Chi tiết món đã gọi')}
        </h4>
        <div className="divide-y divide-zinc-800">
          {items.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400">{item.quantity}x</span>
                <span className="text-zinc-200">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 font-mono">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    item.status === 'DONE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {item.status === 'DONE' ? t('kds.ready', 'Xong') : t('kds.preparing', 'Đang nấu')}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between font-bold text-sm">
          <span className="text-zinc-400">{t('cart.subTotal', 'Tạm tính:')}</span>
          <span className="text-amber-400 text-base">{totalAmount.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {/* Bottom Payment Button */}
      {!isInitializing && (
        <div className="mt-6">
          <Link
            href={`/table/${tableId}/payment`}
            className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition active:scale-[0.98]"
          >
            <QrCode className="w-5 h-5" />
            <span>{t('payment.payNow', 'Yêu Cầu Thanh Toán VietQR')}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
