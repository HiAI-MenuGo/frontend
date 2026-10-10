'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Banknote,
  QrCode,
  Clock,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { formatVND } from '@/lib/format';

export interface PaymentDetailItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  items: PaymentDetailItem[];
  subtotal: number;
  tax: number;
  total: number;
  onConfirm: (method: 'cash' | 'scan', cashReceived: number) => Promise<void>;
  isSubmitting: boolean;
}

export function PaymentDetailModal({
  isOpen,
  onClose,
  tableName,
  items,
  subtotal,
  tax,
  total,
  onConfirm,
  isSubmitting,
}: PaymentDetailModalProps) {
  const [method, setMethod] = useState<'cash' | 'scan'>('cash');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMethod('cash');
      setCashReceivedInput(total > 0 ? total.toString() : '');
      setCurrentTime(
        new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const cashReceivedNum = Number(cashReceivedInput.replace(/\D/g, '')) || 0;
  const change = cashReceivedNum - total;

  const handleQuickAdd = (amount: number) => {
    const current = Number(cashReceivedInput.replace(/\D/g, '')) || total;
    setCashReceivedInput((current + amount).toString());
  };

  const handleSetExact = () => {
    setCashReceivedInput(total.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(method, cashReceivedNum);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-[#E2E8F0] relative flex flex-col max-h-[92vh] overflow-hidden">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
          aria-label="Đóng"
        >
          <X size={19} />
        </button>

        {/* Header Modal */}
        <div className="pb-3.5 border-b border-[#F1F5F9] pr-10 shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              CHI TIẾT THANH TOÁN
            </span>
            <span className="text-[11.5px] font-bold text-[#64748B]">
              • {totalQuantity} món
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-[21px] font-black text-[#0F172A] tracking-tight">
              {tableName || 'Chưa chọn bàn'}
            </h3>
            <span className="text-[12px] text-[#64748B] flex items-center gap-1 font-medium">
              <Clock size={13} className="text-[#94A3B8]" /> {currentTime}
            </span>
          </div>
        </div>

        {/* Nội dung cuộn được: Món + Bảng tính + Phương thức */}
        <div className="flex-1 overflow-y-auto py-3.5 space-y-4 pr-1">
          {/* 1. Danh sách món trong đơn */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
              <span>Món đã chọn ({items.length})</span>
              <span>Thành tiền</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto divide-y divide-[#F1F5F9] bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
              {items.map((item, idx) => (
                <div
                  key={`${item.dishId}-${idx}`}
                  className="pt-2 first:pt-0 flex items-start justify-between text-[13px] gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#00A389] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md text-[11.5px] shrink-0">
                        {item.quantity}x
                      </span>
                      <span className="font-bold text-[#0F172A] truncate">
                        {item.name}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-[11px] text-amber-700 italic mt-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md inline-block">
                        Ghi chú: {item.note}
                      </p>
                    )}
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      Đơn giá: {formatVND(item.price)}
                    </p>
                  </div>
                  <span className="font-extrabold text-[#0F172A] shrink-0 text-[13.5px]">
                    {formatVND(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Tổng kết tài chính */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] space-y-2 text-[12.5px]">
            <div className="flex justify-between text-[#64748B]">
              <span>Tạm tính tiền món</span>
              <span className="font-bold text-[#0F172A]">{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Thuế giá trị gia tăng (VAT 8%)</span>
              <span className="font-bold text-[#0F172A]">{formatVND(tax)}</span>
            </div>
            <div className="pt-2 border-t border-dashed border-[#CBD5E1] flex justify-between items-baseline">
              <span className="text-[14px] font-black text-[#0F172A] uppercase">
                TỔNG CỘNG THANH TOÁN:
              </span>
              <span className="text-[22px] font-black text-[#00A389] tracking-tight">
                {formatVND(total)}
              </span>
            </div>
          </div>

          {/* 3. Lựa chọn Phương thức thanh toán */}
          <div className="space-y-2.5">
            <span className="text-[11.5px] font-extrabold text-[#64748B] uppercase tracking-wider block">
              Phương thức thanh toán
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Nút Tiền mặt */}
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                  method === 'cash'
                    ? 'bg-[#E6F7F4] border-2 border-[#00A389] shadow-xs ring-1 ring-[#00A389]/20'
                    : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    method === 'cash'
                      ? 'bg-[#00A389] text-white'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <Banknote size={19} />
                </div>
                <div>
                  <div className="text-[13px] font-black text-[#0F172A]">Tiền mặt</div>
                  <div className="text-[11px] text-[#64748B]">Thu tiền trực tiếp</div>
                </div>
              </button>

              {/* Nút Quét VietQR */}
              <button
                type="button"
                onClick={() => setMethod('scan')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                  method === 'scan'
                    ? 'bg-[#EFF6FF] border-2 border-blue-600 shadow-xs ring-1 ring-blue-600/20'
                    : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    method === 'scan'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  <QrCode size={19} />
                </div>
                <div>
                  <div className="text-[13px] font-black text-[#0F172A]">Quét VietQR</div>
                  <div className="text-[11px] text-[#64748B]">Napas 247 chuyển khoản</div>
                </div>
              </button>
            </div>

            {/* Chi tiết cho Tiền mặt */}
            {method === 'cash' && (
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="text-[11.5px] font-bold text-slate-700 block mb-1">
                    Tiền khách đưa (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={
                        cashReceivedInput
                          ? Number(cashReceivedInput.replace(/\D/g, '')).toLocaleString('vi-VN')
                          : ''
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setCashReceivedInput(raw);
                      }}
                      placeholder="Nhập số tiền..."
                      className="w-full h-11 px-3.5 rounded-xl bg-white border-2 border-[#CBD5E1] text-[18px] font-black text-[#0F172A] focus:outline-hidden focus:border-[#00A389] transition-all text-right pr-9"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#64748B]">
                      ₫
                    </span>
                  </div>
                </div>

                {/* Chọn nhanh mệnh giá */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#64748B]">Chọn nhanh:</span>
                    <button
                      type="button"
                      onClick={handleSetExact}
                      className="font-bold text-[#00A389] hover:underline cursor-pointer"
                    >
                      Đúng {formatVND(total)}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[10000, 20000, 50000, 100000].map((add) => (
                      <button
                        key={add}
                        type="button"
                        onClick={() => handleQuickAdd(add)}
                        className="h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-[#334155] transition-all cursor-pointer"
                      >
                        +{add / 1000}k
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tính tiền thừa */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-[12.5px] ${
                    change >= 0
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50/70 border-rose-200 text-rose-800'
                  }`}
                >
                  <span className="font-bold">
                    {change >= 0 ? 'Tiền thối lại khách:' : 'Khách đưa còn thiếu:'}
                  </span>
                  <span className="font-black text-[15px]">
                    {change >= 0 ? formatVND(change) : formatVND(Math.abs(change))}
                  </span>
                </div>
              </div>
            )}

            {/* Chi tiết cho VietQR */}
            {method === 'scan' && (
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 text-[12px] text-blue-900 space-y-1 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 font-bold text-blue-800">
                  <QrCode size={16} />
                  <span>Cổng thanh toán tự động VietQR Napas 247</span>
                </div>
                <p className="text-[11.5px] text-blue-700 leading-relaxed">
                  Khi bấm &quot;Xác nhận&quot;, hệ thống sẽ sinh mã QR chuẩn hoá với đúng số tiền{' '}
                  <strong>{formatVND(total)}</strong> để khách quét trực tiếp từ bất kỳ app ngân hàng nào.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#F1F5F9] flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] transition-all cursor-pointer"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (method === 'cash' && change < 0)}
            className="flex-2 h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-black text-[13.5px] flex items-center justify-center gap-2 shadow-md shadow-[#00A389]/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : method === 'scan' ? (
              <>
                <QrCode size={16} />
                <span>Xác nhận & Mở mã QR</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Xác nhận thanh toán ({formatVND(total)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
