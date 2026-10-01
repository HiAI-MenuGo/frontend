'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, Sparkles } from 'lucide-react';

interface TableQRCodeProps {
  tableCode: string;
  tableName: string;
  tableId: string;
  restaurantName?: string;
}

export function TableQRCode({
  tableCode,
  tableName,
  tableId,
  restaurantName = 'HiAI-MenuGo Restaurant',
}: TableQRCodeProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const qrUrl = `${origin}/table/${tableId.toLowerCase().replace(/\s+/g, '-')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-zinc-900 rounded-3xl p-6 border-4 border-amber-500 shadow-2xl flex flex-col items-center max-w-xs mx-auto text-center font-sans">
      <div className="space-y-1 mb-3">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full">
          QR GỌI MÓN TẠI BÀN
        </span>
        <h4 className="text-base font-black uppercase tracking-tight text-zinc-900">
          {restaurantName}
        </h4>
      </div>

      {/* QR Code Container */}
      <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 shadow-inner my-2">
        <QRCodeSVG value={qrUrl} size={180} level="H" includeMargin />
      </div>

      <div className="mt-2 space-y-0.5">
        <h3 className="text-xl font-black text-amber-600">{tableCode}</h3>
        <p className="text-xs text-zinc-500">{tableName}</p>
      </div>

      <p className="text-[11px] text-zinc-500 mt-3 italic">
        Quét mã để xem thực đơn và gọi món trực tiếp
      </p>

      {/* Action buttons (hidden on print) */}
      <div className="flex items-center gap-2 mt-4 print:hidden w-full">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>In Standee</span>
        </button>
      </div>
    </div>
  );
}

export default TableQRCode;
