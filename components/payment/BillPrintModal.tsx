'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import { formatVND } from '@/lib/format';

interface BillPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  storeName?: string;
}

export function BillPrintModal({
  isOpen,
  onClose,
  tableNumber,
  orderNumber,
  items,
  subtotal,
  tax,
  total,
  paymentMethod,
  storeName = 'MenuGO',
}: BillPrintModalProps) {
  if (!isOpen) return null;
  const currentDate = new Date().toLocaleString('vi-VN');
  const paymentLabel = paymentMethod === 'cash' ? 'Tiền mặt' : paymentMethod === 'card' ? 'Thẻ' : paymentMethod === 'scan' ? 'Quét QR' : paymentMethod;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-full hover:bg-[#F8FAFC]">
          <X size={18} />
        </button>

        <div id="printable-bill" className="font-mono text-[12px] text-[#0F172A] space-y-4 pt-2">
          <div className="text-center space-y-1 border-b border-dashed border-[#CBD5E1] pb-3">
            <h3 className="font-extrabold text-[16px] tracking-tight">{storeName}</h3>
            <p className="text-[11px] text-[#64748B]">Nhà hàng • Vận hành bởi HiAI</p>
          </div>
          <div className="text-[11px] space-y-0.5 border-b border-dashed border-[#CBD5E1] pb-2">
            <div className="flex justify-between">
              <span>Đơn: <strong>{orderNumber}</strong></span>
              <span>Bàn: <strong>{tableNumber}</strong></span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Thời gian:</span>
              <span>{currentDate}</span>
            </div>
          </div>
          <div className="space-y-1.5 border-b border-dashed border-[#CBD5E1] pb-3 text-[11px]">
            {items.length === 0 && <p className="text-center text-[#94A3B8]">Không có món</p>}
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="truncate max-w-[170px]">{item.name}</span>
                <div className="flex gap-4">
                  <span className="w-5 text-center">{item.quantity}</span>
                  <span className="w-20 text-right">{formatVND(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-1 border-b border-dashed border-[#CBD5E1] pb-3 text-[11px]">
            <div className="flex justify-between text-[#64748B]">
              <span>Tạm tính:</span>
              <span>{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Thuế VAT:</span>
              <span>{formatVND(tax)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-[14px] text-[#0F172A] pt-1">
              <span>TỔNG CỘNG:</span>
              <span className="text-[#00A389]">{formatVND(total)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#64748B] pt-0.5">
              <span>Thanh toán:</span>
              <span className="capitalize font-bold text-[#0F172A]">{paymentLabel}</span>
            </div>
          </div>
          <div className="text-center text-[10px] text-[#94A3B8] pt-1">
            <p>Cảm ơn Quý khách & Hẹn gặp lại!</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-11 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] font-bold text-[#64748B]">
            Đóng
          </button>
          <button onClick={() => window.print()} className="flex-1 h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center justify-center gap-2">
            <Printer size={16} />
            <span>In Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BillPrintModal;
