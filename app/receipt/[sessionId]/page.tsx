'use client';

import React, { use } from 'react';
import { Printer, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default function ReceiptPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;

  const receiptData = {
    restaurantName: 'HiAI-MenuGo Flagship Store',
    address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    phone: '028 3812 3456',
    table: 'BÀN 02',
    receiptNo: sessionId || 'HD-20261001-001',
    date: new Date().toLocaleDateString('vi-VN'),
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    cashier: 'Nguyễn Thị Mai',
    items: [
      { name: 'Trà Đào Cam Sả (Size L)', quantity: 2, price: 55000, modifiers: '50% đường | 50% đá • Trân châu trắng' },
      { name: 'Cà Phê Muối Đặc Biệt', quantity: 1, price: 35000, modifiers: 'Ít đá' },
      { name: 'Bánh Croissant Bơ Pháp', quantity: 1, price: 42000, modifiers: '' },
    ],
    subTotal: 187000,
    discount: 20000,
    voucherCode: 'CHAO2026',
    finalTotal: 167000,
    paymentMethod: 'VietQR (Napas 247)',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 print:p-0 print:bg-white print:text-black">
      {/* Action buttons (hidden on print) */}
      <div className="w-full max-w-sm flex items-center justify-between mb-4 print:hidden">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trang chủ</span>
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition"
        >
          <Printer className="w-4 h-4" />
          <span>In Hóa Đơn</span>
        </button>
      </div>

      {/* Thermal Receipt Card */}
      <div className="w-full max-w-sm bg-white text-zinc-900 rounded-3xl p-6 sm:p-7 shadow-2xl font-mono text-xs border border-zinc-200 print:border-none print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="text-center space-y-1 pb-4 border-b border-dashed border-zinc-300">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 mb-1">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h2 className="text-base font-extrabold uppercase font-sans tracking-wide">
            {receiptData.restaurantName}
          </h2>
          <p className="text-[11px] text-zinc-600">{receiptData.address}</p>
          <p className="text-[11px] text-zinc-600">Hotline: {receiptData.phone}</p>
        </div>

        {/* Metadata */}
        <div className="py-3 border-b border-dashed border-zinc-300 space-y-1 text-[11px] text-zinc-600">
          <div className="flex justify-between">
            <span>Số HĐ:</span>
            <span className="font-bold text-zinc-900">{receiptData.receiptNo}</span>
          </div>
          <div className="flex justify-between">
            <span>Vị trí:</span>
            <span className="font-bold text-zinc-900">{receiptData.table}</span>
          </div>
          <div className="flex justify-between">
            <span>Thời gian:</span>
            <span>{receiptData.time} - {receiptData.date}</span>
          </div>
          <div className="flex justify-between">
            <span>Thu ngân:</span>
            <span>{receiptData.cashier}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="py-3 border-b border-dashed border-zinc-300 space-y-2.5">
          {receiptData.items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between font-semibold text-zinc-900">
                <span>{item.quantity}x {item.name}</span>
                <span>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
              </div>
              {item.modifiers && (
                <p className="text-[10px] text-zinc-500 pl-2">↳ {item.modifiers}</p>
              )}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="py-3 border-b-2 border-zinc-900 space-y-1.5">
          <div className="flex justify-between text-zinc-600">
            <span>Tạm tính:</span>
            <span>{receiptData.subTotal.toLocaleString('vi-VN')}đ</span>
          </div>
          {receiptData.discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Khuyến mãi ({receiptData.voucherCode}):</span>
              <span>-{receiptData.discount.toLocaleString('vi-VN')}đ</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-extrabold text-zinc-900 pt-1">
            <span>TỔNG CỘNG:</span>
            <span className="text-base">{receiptData.finalTotal.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between text-[11px] text-zinc-600 pt-1">
            <span>Hình thức:</span>
            <span className="font-medium text-zinc-900">{receiptData.paymentMethod}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 text-center space-y-1 text-[11px] text-zinc-500">
          <p className="font-semibold text-zinc-800">Cảm ơn Quý Khách & Hẹn Gặp Lại!</p>
          <p className="text-[10px]">Powered by HiAI-MenuGo SaaS</p>
        </div>
      </div>
    </div>
  );
}
