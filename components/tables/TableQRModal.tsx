'use client';

import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  Users,
  Sparkles,
} from 'lucide-react';
import type { UiTable } from '@/lib/api/types';
import { useAuthStore } from '@/stores/auth.store';

interface TableQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: UiTable | null;
  restaurantName?: string;
  tenantId?: string | null;
  branchId?: string | null;
}

export default function TableQRModal({
  isOpen,
  onClose,
  table,
  restaurantName = 'HiAI MenuGO',
  tenantId,
  branchId,
}: TableQRModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const user = useAuthStore((s) => s.user);

  if (!isOpen || !table) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const effectiveTenantId = table.tenantId || tenantId || user?.tenantId || 'default-tenant';
  const effectiveBranchId = table.branchId || branchId || user?.branchId || 'default-branch';
  // Luôn dùng ID duy nhất của bàn (UUID) để đảm bảo không bị trùng lặp giữa các chi nhánh hoặc công ty
  const tableSlug = table.backendId || table.id;
  const qrUrl = `${origin}/${effectiveTenantId}/${effectiveBranchId}/table/${tableSlug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = qrUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

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
      canvas.width = 900;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `qr-ban-${table.tableNumber || table.id}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  };

  const handleOpenCustomerMenu = () => {
    window.open(qrUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 relative shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors"
          aria-label="Đóng"
        >
          <X size={16} />
        </button>

        {/* Header Modal */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#F1F5F9]">
          <div className="w-11 h-11 rounded-2xl bg-[#E6F7F4] text-[#00A389] flex items-center justify-center font-black shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-[#00A389] bg-[#E6F7F4] px-2.5 py-0.5 rounded-full inline-block mb-1">
              QR GỌI MÓN TỪ XA
            </span>
            <h3 className="text-[17px] font-black text-[#0F172A]">
              Mã QR Bàn #{table.tableNumber}
            </h3>
          </div>
        </div>

        {/* Khung Standee Thẻ Bàn */}
        <div
          id="qr-standee-card"
          className="bg-gradient-to-b from-[#F8FAFC] to-white rounded-3xl p-6 border-2 border-[#E2E8F0] shadow-inner text-center flex flex-col items-center relative overflow-hidden"
        >
          {/* Tên nhà hàng & Tiêu đề bàn */}
          <div className="space-y-1 mb-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#64748B]">
              {restaurantName}
            </p>
            <h2 className="text-[22px] font-black text-[#0F172A] tracking-tight">
              {table.tableName.replace(/\s*\([^)]*\)/g, '').trim()}
            </h2>
            <div className="flex items-center justify-center gap-2 text-[12px] font-semibold text-[#64748B]">
              <span className="inline-flex items-center gap-1">
                <Users size={13} /> Sức chứa: {table.capacity} khách
              </span>
            </div>
          </div>

          {/* QR Code Container */}
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-3xl border border-[#CBD5E1] shadow-md relative group transition-all"
          >
            <QRCodeSVG
              value={qrUrl}
              size={190}
              level="H"
              includeMargin
              className="rounded-xl"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-xl bg-white shadow-md border border-[#E2E8F0] flex items-center justify-center font-black text-[13px] text-[#00A389]">
                GO
              </div>
            </div>
          </div>

          {/* Hướng dẫn khách quét */}
          <p className="text-[12px] text-[#475569] font-bold mt-4">
            Quét mã để xem thực đơn & tự gọi món ngay tại bàn
          </p>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">
            Không cần chờ nhân viên đến quầy • Đơn tự đồng bộ vào bếp
          </p>

          {/* Hộp hiển thị URL */}
          <div className="mt-4 w-full bg-[#F1F5F9] rounded-xl px-3 py-2 flex items-center justify-between text-[11.5px] text-[#475569] border border-[#E2E8F0]">
            <span className="font-mono truncate mr-2 select-all text-left">
              {qrUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="text-[#00A389] hover:text-[#008f77] font-bold inline-flex items-center gap-1 shrink-0 transition-colors"
              title="Sao chép liên kết"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-600 text-[11px]">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span className="text-[11px]">Chép link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nút tác vụ (Mở menu khách / In / Tải PNG) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5">
          {/* Mở menu khách */}
          <button
            onClick={handleOpenCustomerMenu}
            className="h-11 px-3 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white text-[12.5px] font-black flex items-center justify-center gap-1.5 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98]"
            title="Mở giao diện khách hàng quét QR để xem và đặt món thử"
          >
            <ExternalLink size={15} />
            <span>Mở Menu thử</span>
          </button>

          {/* In Standee */}
          <button
            onClick={handlePrint}
            className="h-11 px-3 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            title="In standee đặt lên bàn cho khách"
          >
            <Printer size={15} />
            <span>In Standee</span>
          </button>

          {/* Tải PNG */}
          <button
            onClick={handleDownloadPng}
            className="h-11 px-3 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            title="Tải ảnh PNG mã QR độ phân giải cao"
          >
            <Download size={15} />
            <span>Tải PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
