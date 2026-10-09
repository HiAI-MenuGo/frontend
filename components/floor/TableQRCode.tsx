'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, Sparkles } from 'lucide-react';

interface TableQRCodeProps {
  tableCode: string;
  tableName: string;
  tableId: string;
  restaurantName?: string;
  logoUrl?: string;
  /** Token JWT mã hóa (C-023). Ưu tiên hơn tableId thô khi có. */
  qrToken?: string;
}

export function TableQRCode({
  tableCode,
  tableName,
  tableId,
  restaurantName = 'HiAI-MenuGo Restaurant',
  logoUrl,
  qrToken,
}: TableQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  // Standee dùng token JWT mã hóa khi có, fallback id thô cho môi trường dev.
  const qrPath = qrToken || tableId.toLowerCase().replace(/\s+/g, '-');
  const qrUrl = `${origin}/table/${qrPath}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `qr-${tableCode}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
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

      {/* QR Code Container (level H để chèn logo giữa vẫn quét được) */}
      <div ref={qrRef} className="relative p-3 bg-zinc-50 rounded-2xl border border-zinc-200 shadow-inner my-2">
        <QRCodeSVG value={qrUrl} size={180} level="H" includeMargin />
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="logo"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-lg object-cover bg-white p-0.5 border border-zinc-200"
          />
        )}
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
        <button
          type="button"
          onClick={handleDownloadPng}
          className="flex-1 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 font-bold text-zinc-100 text-xs rounded-xl flex items-center justify-center gap-1.5 border border-zinc-700 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Tải PNG</span>
        </button>
      </div>
      <p className="hidden print:block text-[10px] text-zinc-500 mt-2">
        <Sparkles className="w-3 h-3 inline" /> {qrUrl}
      </p>
    </div>
  );
}

export default TableQRCode;
