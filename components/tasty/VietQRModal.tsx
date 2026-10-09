'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, X, CheckCircle, RefreshCw } from 'lucide-react';

interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  totalUsd: number;
  orderNumber: string;
  tableNumber: string;
}

export const VietQRModal: React.FC<VietQRModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  totalUsd,
  orderNumber,
  tableNumber,
}) => {
  const [countdown, setCountdown] = useState(120);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(120);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Approximate VND exchange rate: 1 USD = 25,400 VND
  const totalVnd = Math.round(totalUsd * 25400);

  // Dynamic VietQR generator URL via standard public quicklink format
  const qrUrl = `https://img.vietqr.io/image/970436-1028391829-compact2.png?amount=${totalVnd}&addInfo=${encodeURIComponent(
    `TASTY ${orderNumber} ${tableNumber}`
  )}&accountName=IBRAHIM%20KADRI`;

  const handleSimulatePayment = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] relative text-center animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-full hover:bg-[#F8FAFC]"
        >
          <X size={18} />
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E6F7F4] text-[#00A389] rounded-full text-[11px] font-extrabold uppercase mb-3">
          <QrCode size={13} />
          <span>VietQR NAPAS 247</span>
        </div>

        <h3 className="font-extrabold text-[17px] text-[#0F172A]">Quét Mã Thanh Toán</h3>
        <p className="text-[12px] text-[#64748B] mt-1">
          Đơn <strong>{orderNumber}</strong> ({tableNumber})
        </p>

        {/* Dynamic QR Code Frame */}
        <div className="my-4 p-3 bg-white rounded-2xl border-2 border-dashed border-[#00A389]/40 flex items-center justify-center shadow-xs">
          <img
            src={qrUrl}
            alt="VietQR Dynamic Payment"
            className="w-56 h-auto object-contain rounded-xl"
          />
        </div>

        <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0] mb-4 text-[12px] space-y-1 text-left">
          <div className="flex justify-between">
            <span className="text-[#64748B]">Số tiền VND:</span>
            <span className="font-extrabold text-[#00A389] text-[14px]">
              {totalVnd.toLocaleString('vi-VN')} ₫
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">Tương đương USD:</span>
            <span className="font-bold text-[#0F172A]">${totalUsd.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#64748B]">Hết hạn sau:</span>
            <span className="font-bold text-[#EA580C]">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Action Simulate / Cashier confirm */}
        <button
          onClick={handleSimulatePayment}
          disabled={isVerifying}
          className="w-full h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
        >
          {isVerifying ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Đang kiểm tra giao dịch...</span>
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              <span>Xác Nhận Khách Đã Quét Xong</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VietQRModal;
