'use client';

import React, { useState, useEffect, use } from 'react';
import { getSocket } from '../../../../lib/socket';
import { Clock, CheckCircle2, Flame, ArrowLeft, QrCode } from 'lucide-react';
import Link from 'next/link';

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

  const [orderStatus, setOrderStatus] = useState<'PENDING' | 'PREPARING' | 'DONE'>('PREPARING');
  const [estimatedMinutes, setEstimatedMinutes] = useState(12);
  const [orderCode] = useState('#101');
  const [items] = useState<OrderItemLive[]>([
    { id: '1', name: 'Trà Đào Cam Sả', quantity: 2, price: 45000, status: 'PREPARING' },
    { id: '2', name: 'Cà Phê Muối', quantity: 1, price: 35000, status: 'DONE' },
  ]);

  useEffect(() => {
    const socket = getSocket();

    const handleOrderUpdate = (payload: any) => {
      if (payload.status) {
        setOrderStatus(payload.status);
      }
    };

    socket.on('order:updated', handleOrderUpdate);

    return () => {
      socket.off('order:updated', handleOrderUpdate);
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
          <span>Gọi thêm món</span>
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
          Bàn {tableId.toUpperCase()}
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
            {orderStatus === 'PENDING' && 'Đã gửi đơn — Chờ bếp nhận'}
            {orderStatus === 'PREPARING' && 'Bếp đang chế biến món ngon'}
            {orderStatus === 'DONE' && 'Món đã sẵn sàng phục vụ!'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Mã đơn hàng: <strong className="text-zinc-200">{orderCode}</strong>
          </p>
        </div>

        {orderStatus === 'PREPARING' && (
          <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Thời gian dự kiến: ~{estimatedMinutes} phút</span>
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
            <span>Đã nhận đơn</span>
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
                  ? 'bg-amber-500/20 border-amber-500'
                  : 'bg-zinc-800 border-zinc-700'
              }`}
            >
              2
            </div>
            <span>Đang nấu</span>
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
                  ? 'bg-emerald-500/20 border-emerald-500'
                  : 'bg-zinc-800 border-zinc-700'
              }`}
            >
              3
            </div>
            <span>Bưng ra</span>
          </div>
        </div>
      </div>

      {/* Ordered Items Summary */}
      <div className="flex-1 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
        <h4 className="font-semibold text-xs text-zinc-400 uppercase tracking-wider">
          Món đã đặt ({items.length})
        </h4>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs py-2 border-b border-zinc-800/60 last:border-none"
            >
              <div>
                <span className="font-semibold text-zinc-200">
                  {item.quantity}x {item.name}
                </span>
              </div>
              <span className="font-medium text-amber-400">
                {(item.price * item.quantity).toLocaleString('vi-VN')}đ
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm font-bold">
          <span>Tổng tiền</span>
          <span className="text-amber-400">{totalAmount.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {/* Payment Action CTA */}
      <div className="mt-6 space-y-3">
        <Link
          href={`/table/${tableId}/payment`}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 font-bold text-zinc-950 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition"
        >
          <QrCode className="w-5 h-5" />
          <span>Thanh toán ngay bằng VietQR</span>
        </Link>
      </div>
    </div>
  );
}
