'use client';

import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface BillPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  tax: number;
  donation: number;
  total: number;
  paymentMethod: string;
}

export const BillPrintModal: React.FC<BillPrintModalProps> = ({
  isOpen,
  onClose,
  tableNumber,
  orderNumber,
  items,
  subtotal,
  tax,
  donation,
  total,
  paymentMethod,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleString('vi-VN');

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-full hover:bg-[#F8FAFC]"
        >
          <X size={18} />
        </button>

        {/* Printable 80mm Bill Preview */}
        <div id="printable-bill" className="font-mono text-[12px] text-[#0F172A] space-y-4 pt-2">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-dashed border-[#CBD5E1] pb-3">
            <h3 className="font-extrabold text-[16px] tracking-tight">TASTY STATION</h3>
            <p className="text-[11px] text-[#64748B]">HiAI-MenuGo Restaurant System</p>
            <p className="text-[10px] text-[#94A3B8]">123 Võ Văn Ngân, TP. Thủ Đức, TP.HCM</p>
            <p className="text-[10px] text-[#94A3B8]">Tel: (028) 3896 7890</p>
          </div>

          {/* Meta Info */}
          <div className="text-[11px] space-y-0.5 border-b border-dashed border-[#CBD5E1] pb-2">
            <div className="flex justify-between">
              <span>Đơn: <strong>{orderNumber}</strong></span>
              <span>Bàn: <strong>{tableNumber}</strong></span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Thời gian:</span>
              <span>{currentDate}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Thu ngân:</span>
              <span>Ibrahim Kadri</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1.5 border-b border-dashed border-[#CBD5E1] pb-3 text-[11px]">
            <div className="flex justify-between font-bold text-[#64748B] pb-1">
              <span>Món</span>
              <div className="flex gap-4">
                <span>SL</span>
                <span>T.Tiền</span>
              </div>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="truncate max-w-[170px]">{item.name}</span>
                <div className="flex gap-4">
                  <span className="w-5 text-center">{item.quantity}</span>
                  <span className="w-14 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Calculations */}
          <div className="space-y-1 border-b border-dashed border-[#CBD5E1] pb-3 text-[11px]">
            <div className="flex justify-between text-[#64748B]">
              <span>Tạm tính (Subtotal):</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Thuế VAT (8%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Ủng hộ quỹ từ thiện:</span>
              <span>${donation.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-[14px] text-[#0F172A] pt-1">
              <span>TỔNG CỘNG:</span>
              <span className="text-[#00A389]">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#64748B] pt-0.5">
              <span>Thanh toán bằng:</span>
              <span className="capitalize font-bold text-[#0F172A]">{paymentMethod}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-[#94A3B8] space-y-1 pt-1">
            <p>Cảm ơn Quý khách & Hẹn gặp lại!</p>
            <p>Powered by HiAI-MenuGo Multi-Tenant</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] font-bold text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Printer size={16} />
            <span>In Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillPrintModal;
