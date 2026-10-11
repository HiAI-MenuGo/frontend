'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, X, CheckCircle, RefreshCw } from 'lucide-react';
import { formatVND } from '@/lib/format';
import { createVietQR } from '@/lib/api/sessions.api';

interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  totalVnd: number;
  orderNumber: string;
  tableNumber: string;
  sessionId?: string;
}

export function VietQRModal({ isOpen, onClose, onSuccess, totalVnd, orderNumber, tableNumber, sessionId }: VietQRModalProps) {
  const [countdown, setCountdown] = useState(120);
  const [isVerifying, setIsVerifying] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCountdown(120);
    setError(null);
    setQrImage(null);
    const interval = setInterval(() => setCountdown((p) => (p > 0 ? p - 1 : 0)), 1000);

    // Gọi API thật để sinh QR nếu có sessionId, fallback sang img.vietqr.io nếu lỗi
    if (sessionId) {
      createVietQR(sessionId, totalVnd)
        .then((r) => {
          const url = (r.qrImageUrl || r.imageUrl || r.qrData || null) as string | null;
          if (url) setQrImage(url);
        })
        .catch((e) => setError(e.message));
    }
    return () => clearInterval(interval);
  }, [isOpen, sessionId, totalVnd]);

  if (!isOpen) return null;

  const fallbackQr = `https://img.vietqr.io/image/970436-1028391829-compact2.png?amount=${totalVnd}&addInfo=${encodeURIComponent(
    `MenuGO ${orderNumber} ${tableNumber}`
  )}&accountName=MenuGO`;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full max-h-[92dvh] my-auto p-4 sm:p-6 shadow-2xl border border-[#E2E8F0] relative text-center flex flex-col overflow-hidden modal-panel">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-full hover:bg-[#F8FAFC]">
          <X size={18} />
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E6F7F4] text-[#00A389] rounded-full text-[11px] font-extrabold uppercase mb-3">
          <QrCode size={13} />
          <span>VietQR NAPAS 247</span>
        </div>
        <h3 className="font-extrabold text-[17px] text-[#0F172A]">Quét Mã Thanh Toán</h3>
        <p className="text-[12px] text-[#64748B] mt-1">Đơn <strong>{orderNumber}</strong> ({tableNumber})</p>

        <div className="my-4 p-3 bg-white rounded-2xl border-2 border-dashed border-[#00A389]/40 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrImage ?? fallbackQr} alt="VietQR" className="w-56 h-auto object-contain rounded-xl" />
        </div>

        {error && <p className="text-[11px] text-amber-600 mb-2">QR thật chưa cấu hình ({error}), đang dùng QR fallback.</p>}

        <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0] mb-4 text-[12px] space-y-1 text-left">
          <div className="flex justify-between">
            <span className="text-[#64748B]">Số tiền VND:</span>
            <span className="font-extrabold text-[#00A389] text-[14px]">{formatVND(totalVnd)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#64748B]">Hết hạn sau:</span>
            <span className="font-bold text-[#EA580C]">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
          </div>
        </div>

        <button
          onClick={() => {
            setIsVerifying(true);
            setTimeout(() => {
              setIsVerifying(false);
              onSuccess();
            }, 1000);
          }}
          disabled={isVerifying}
          className="w-full h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isVerifying ? (<><RefreshCw size={16} className="animate-spin" /><span>Đang kiểm tra...</span></>) : (<><CheckCircle size={16} /><span>Xác Nhận Khách Đã Quét Xong</span></>)}
        </button>
      </div>
    </div>
  );
}

export default VietQRModal;
