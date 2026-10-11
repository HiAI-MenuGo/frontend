'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Banknote,
  QrCode,
  Clock,
  Receipt,
  CheckCircle2,
  Tag,
  Percent,
  AlertCircle,
} from 'lucide-react';
import { formatVND } from '@/lib/format';

export interface PaymentDetailItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface PaymentDiscountInfo {
  type: 'percent' | 'amount';
  value: number;
  amount: number;
  reason?: string;
  finalTotal: number;
}

export interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  items: PaymentDetailItem[];
  subtotal: number;
  tax: number;
  total: number;
  onConfirm: (
    method: 'cash' | 'scan',
    cashReceived: number,
    discountInfo?: PaymentDiscountInfo
  ) => Promise<void>;
  isSubmitting: boolean;
}

export function PaymentDetailModal({
  isOpen,
  onClose,
  tableName,
  items,
  subtotal,
  total,
  onConfirm,
  isSubmitting,
}: PaymentDetailModalProps) {
  const [method, setMethod] = useState<'cash' | 'scan'>('cash');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [currentTime, setCurrentTime] = useState('');

  // Trạng thái chiết khấu (Discount)
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');

  // Tính toán số tiền chiết khấu thực tế
  const discountAmount =
    discountType === 'percent'
      ? Math.min(subtotal, Math.round((subtotal * Math.max(0, discountValue || 0)) / 100))
      : Math.min(subtotal, Math.max(0, discountValue || 0));

  // Tạm tính sau chiết khấu
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  // Thuế VAT (8%) tính trên số tiền thực tế sau chiết khấu
  const calculatedTax = Math.round(discountedSubtotal * 0.08);

  // Tổng cộng cuối cùng phải trả
  const finalTotal = discountedSubtotal + calculatedTax;

  // Khởi tạo & reset khi mở modal
  useEffect(() => {
    if (isOpen) {
      setMethod('cash');
      setDiscountType('percent');
      setDiscountValue(0);
      setDiscountReason('');
      setCashReceivedInput(total > 0 ? total.toString() : '');
      setCurrentTime(
        new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }
  }, [isOpen, total]);

  // Tự động đồng bộ số tiền khách đưa khi mức chiết khấu thay đổi
  useEffect(() => {
    if (isOpen) {
      setCashReceivedInput(finalTotal.toString());
    }
  }, [finalTotal, isOpen]);

  if (!isOpen) return null;

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const cashReceivedNum = Number(cashReceivedInput.replace(/\D/g, '')) || 0;
  const change = cashReceivedNum - finalTotal;

  const handleQuickAdd = (amount: number) => {
    const current = Number(cashReceivedInput.replace(/\D/g, '')) || finalTotal;
    setCashReceivedInput((current + amount).toString());
  };

  const handleSetExact = () => {
    setCashReceivedInput(finalTotal.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(method, cashReceivedNum, {
      type: discountType,
      value: discountValue,
      amount: discountAmount,
      reason: discountReason || undefined,
      finalTotal,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-5 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl xl:max-w-5xl w-full max-h-[92dvh] my-auto p-4 sm:p-5 lg:p-7 shadow-2xl border border-[#E2E8F0] relative flex flex-col overflow-hidden modal-panel">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer z-10"
          aria-label="Đóng"
        >
          <X size={19} />
        </button>

        {/* Header Modal */}
        <div className="pb-3.5 border-b border-[#F1F5F9] pr-10 shrink-0">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[21px] font-black text-[#0F172A] tracking-tight">
              {tableName || 'Chưa chọn bàn'}
            </h3>
            <span className="text-[12px] text-[#64748B] flex items-center gap-1 font-medium">
              <Clock size={13} className="text-[#94A3B8]" /> {currentTime}
            </span>
          </div>
        </div>

        {/* Nội dung 2 cột: Cột trái (Món, Chiết khấu & Hoá đơn) - Cột phải (Phương thức & Thu tiền) */}
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-7 items-start">
            {/* ======================================================== */}
            {/* CỘT TRÁI (md:col-span-5): Danh sách món, Chiết khấu & Bảng tính tiền */}
            {/* ======================================================== */}
            <div className="md:col-span-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <Receipt size={13} className="text-[#00A389]" />
                  Món đã chọn ({items.length})
                </span>
                <span>Thành tiền</span>
              </div>

              {/* Danh sách món cuộn mượt mà */}
              <div className="space-y-1.5 max-h-[190px] md:max-h-[220px] overflow-y-auto divide-y divide-[#F1F5F9] bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
                {items.map((item, idx) => (
                  <div
                    key={`${item.dishId}-${idx}`}
                    className="pt-2 first:pt-0 flex items-start justify-between text-[13px] gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#00A389] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md text-[11px] shrink-0">
                          {item.quantity}x
                        </span>
                        <span className="font-bold text-[#0F172A] truncate">
                          {item.name}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-[11px] text-amber-700 italic mt-0.5 bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200/60">
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

              {/* ======================================================== */}
              {/* KHỐI TÍNH NĂNG CHIẾT KHẤU / GIẢM GIÁ (Discount) */}
              {/* ======================================================== */}
              <div className="bg-[#FAF5FF] p-3.5 rounded-2xl border border-purple-200/80 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-purple-900 uppercase tracking-wider">
                    <Tag size={13} className="text-purple-600" />
                    <span>Chiết khấu đơn hàng</span>
                  </div>

                  {/* Switch chọn % hoặc VNĐ */}
                  <div className="inline-flex p-0.5 rounded-lg bg-purple-100 text-[10.5px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('percent');
                        setDiscountValue(0);
                      }}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        discountType === 'percent'
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'text-purple-700 hover:text-purple-900'
                      }`}
                    >
                      % Tỷ lệ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('amount');
                        setDiscountValue(0);
                      }}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        discountType === 'amount'
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'text-purple-700 hover:text-purple-900'
                      }`}
                    >
                      ₫ Số tiền
                    </button>
                  </div>
                </div>

                {/* Chế độ nhập % */}
                {discountType === 'percent' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-1.5">
                      {[0, 5, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountValue(pct)}
                          className={`h-7.5 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${
                            discountValue === pct
                              ? 'bg-purple-700 border-purple-700 text-white shadow-xs scale-[1.02]'
                              : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50 hover:border-purple-300'
                          }`}
                        >
                          {pct === 0 ? '0%' : `${pct}%`}
                        </button>
                      ))}
                    </div>

                    <div className="relative flex items-center bg-white border border-purple-300 rounded-xl px-3 h-10 shadow-2xs focus-within:border-purple-600 focus-within:ring-3 focus-within:ring-purple-600/15 transition-all">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mr-2.5">
                        <Percent size={13} strokeWidth={2.5} />
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={discountValue > 0 ? discountValue : ''}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setDiscountValue(val);
                        }}
                        className="flex-1 h-full bg-transparent text-[13px] font-bold text-[#0F172A] placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden"
                      />
                      {discountValue > 0 && (
                        <button
                          type="button"
                          onClick={() => setDiscountValue(0)}
                          className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center mr-1.5 transition-colors cursor-pointer shrink-0"
                          title="Xóa"
                        >
                          <X size={11} strokeWidth={2.5} />
                        </button>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-black shrink-0 font-mono">
                        %
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Chế độ nhập VNĐ */
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0, 10000, 20000, 50000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDiscountValue(amt)}
                          className={`h-7.5 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${
                            discountValue === amt
                              ? 'bg-purple-700 border-purple-700 text-white shadow-xs scale-[1.02]'
                              : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50 hover:border-purple-300'
                          }`}
                        >
                          {amt === 0 ? '0đ' : `${amt / 1000}k`}
                        </button>
                      ))}
                    </div>

                    <div className="relative flex items-center bg-white border border-purple-300 rounded-xl px-3 h-10 shadow-2xs focus-within:border-purple-600 focus-within:ring-3 focus-within:ring-purple-600/15 transition-all">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mr-2.5">
                        <Tag size={13} strokeWidth={2.5} />
                      </div>
                      <input
                        type="text"
                        value={
                          discountValue > 0
                            ? Number(discountValue).toLocaleString('vi-VN')
                            : ''
                        }
                        onChange={(e) => {
                          const raw = Number(e.target.value.replace(/\D/g, '')) || 0;
                          setDiscountValue(raw);
                        }}
                        className="flex-1 h-full bg-transparent text-[13px] font-bold text-[#0F172A] placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden"
                      />
                      {discountValue > 0 && (
                        <button
                          type="button"
                          onClick={() => setDiscountValue(0)}
                          className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center mr-1.5 transition-colors cursor-pointer shrink-0"
                          title="Xóa"
                        >
                          <X size={11} strokeWidth={2.5} />
                        </button>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-black shrink-0 font-mono">
                        ₫
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Khung tổng kết tài chính */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] space-y-2 text-[12.5px] shadow-2xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Tạm tính tiền món</span>
                  <span className="font-bold text-[#0F172A]">{formatVND(subtotal)}</span>
                </div>

                {/* Dòng chiết khấu */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-purple-700 animate-in fade-in duration-150">
                    <span className="flex items-center gap-1 font-bold">
                      <Tag size={12} className="text-purple-600" />
                      Chiết khấu {discountType === 'percent' ? `(${discountValue}%)` : ''}
                      {discountReason ? ` • ${discountReason}` : ''}
                    </span>
                    <span className="font-black text-purple-800">
                      -{formatVND(discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-[#64748B]">
                  <span>Thuế giá trị gia tăng (VAT 8%)</span>
                  <span className="font-bold text-[#0F172A]">{formatVND(calculatedTax)}</span>
                </div>

                <div className="pt-2 border-t border-dashed border-[#CBD5E1] flex justify-between items-baseline">
                  <span className="text-[13px] font-black text-[#0F172A] uppercase">
                    TỔNG CỘNG:
                  </span>
                  <span className="text-[22px] font-black text-[#00A389] tracking-tight">
                    {formatVND(finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* CỘT PHẢI (md:col-span-7): Phương thức thanh toán & Thu tiền */}
            {/* ======================================================== */}
            <div className="md:col-span-7 flex flex-col gap-3.5">
              <span className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider block px-1">
                Phương thức thanh toán
              </span>

              {/* 2 tab lớn chọn phương thức */}
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
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      method === 'cash'
                        ? 'bg-[#00A389] text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    <Banknote size={20} />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-black text-[#0F172A]">Tiền mặt</div>
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
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      method === 'scan'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    <QrCode size={20} />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-black text-[#0F172A]">Quét VietQR</div>
                    <div className="text-[11px] text-[#64748B]">Napas 247 chuyển khoản</div>
                  </div>
                </button>
              </div>

              {/* Chi tiết cho Tiền mặt */}
              {method === 'cash' && (
                <div className="p-4 bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]/60 rounded-2xl border border-slate-200/90 space-y-3.5 shadow-2xs animate-in fade-in duration-150">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[12px] font-extrabold text-[#0F172A] flex items-center gap-1.5">
                        <span>Tiền khách đưa</span>
                        <span className="text-[11px] font-medium text-[#64748B]">(Thu tiền mặt)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSetExact}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E6F7F4] hover:bg-[#d2f2ec] text-[#00A389] text-[11px] font-black border border-[#00A389]/25 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        title="Điền đúng số tiền thanh toán"
                      >
                        <CheckCircle2 size={13} strokeWidth={2.5} />
                        <span>Đúng số tiền ({formatVND(finalTotal)})</span>
                      </button>
                    </div>

                    {/* Ô INPUT TIỀN KHÁCH ĐƯA CHUẨN POS */}
                    <div className="relative flex items-center bg-white border-2 border-[#CBD5E1] rounded-2xl px-3.5 h-[56px] shadow-xs focus-within:border-[#00A389] focus-within:ring-4 focus-within:ring-[#00A389]/15 transition-all group">
                      {/* Badge Icon Bên Trái */}
                      <div className="w-9 h-9 rounded-xl bg-[#E6F7F4] text-[#00A389] flex items-center justify-center shrink-0 mr-2.5 shadow-2xs transition-transform group-focus-within:scale-105">
                        <Banknote size={19} strokeWidth={2.5} />
                      </div>

                      {/* Ô Input Số Tiền */}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          cashReceivedInput
                            ? Number(cashReceivedInput.replace(/\D/g, '')).toLocaleString('vi-VN')
                            : ''
                        }
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setCashReceivedInput(raw);
                        }}
                        className="flex-1 h-full bg-transparent text-[22px] sm:text-[24px] font-black text-[#0F172A] tracking-tight text-right pr-2 focus:outline-hidden placeholder:text-slate-300"
                      />

                      {/* Nút xóa nhanh nếu đã nhập tiền */}
                      {cashReceivedInput && cashReceivedInput !== '0' && (
                        <button
                          type="button"
                          onClick={() => setCashReceivedInput('')}
                          className="w-5.5 h-5.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center mr-2 transition-colors cursor-pointer shrink-0"
                          title="Xóa số tiền"
                        >
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      )}

                      {/* Ký hiệu đơn vị tiền tệ */}
                      <div className="px-2 py-0.5 rounded-lg bg-[#E6F7F4] text-[#00A389] font-black text-[13px] font-mono shrink-0 select-none">
                        ₫
                      </div>
                    </div>
                  </div>

                  {/* Chọn nhanh mệnh giá cộng thêm */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-[#64748B] block">
                      Cộng nhanh mệnh giá:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {[10000, 20000, 50000, 100000].map((add) => (
                        <button
                          key={add}
                          type="button"
                          onClick={() => handleQuickAdd(add)}
                          className="h-8.5 rounded-xl bg-white hover:bg-[#F8FAFC] hover:border-[#00A389]/40 border border-[#E2E8F0] text-[12px] font-black text-[#1E293B] font-mono transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.97] flex items-center justify-center gap-0.5"
                        >
                          <span className="text-[#00A389] text-[10.5px]">+</span>
                          <span>{add >= 1000 ? `${add / 1000}k` : add}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Tính tiền thừa / Tiền thối */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between shadow-2xs ${
                      change >= 0
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50/70 border-emerald-200/90 text-emerald-900'
                        : 'bg-gradient-to-r from-rose-50 to-red-50/70 border-rose-200/90 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                          change >= 0
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {change >= 0 ? (
                          <CheckCircle2 size={18} strokeWidth={2.5} />
                        ) : (
                          <AlertCircle size={18} strokeWidth={2.5} />
                        )}
                      </div>
                      <div>
                        <div className="font-extrabold text-[12px] leading-tight">
                          {change >= 0 ? 'Tiền thối lại khách' : 'Khách đưa còn thiếu'}
                        </div>
                        <div className="text-[10.5px] opacity-75 mt-0.5">
                          {change >= 0 ? 'Trả lại tiền thừa cho khách' : 'Vui lòng thu thêm từ khách'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-[20px] sm:text-[22px] font-black font-mono tracking-tight leading-none ${
                          change >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {change >= 0 ? formatVND(change) : formatVND(Math.abs(change))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chi tiết cho VietQR */}
              {method === 'scan' && (
                <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 text-[12.5px] text-blue-900 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 font-bold text-blue-800">
                    <QrCode size={18} />
                    <span>Cổng thanh toán tự động VietQR Napas 247</span>
                  </div>
                  <p className="text-[12px] text-blue-700 leading-relaxed">
                    Khi bấm &quot;Xác nhận&quot;, hệ thống sẽ sinh mã QR chuẩn hoá với đúng số tiền{' '}
                    <strong className="text-blue-900 font-extrabold">{formatVND(finalTotal)}</strong>{' '}
                    {discountAmount > 0 ? `(Đã trừ chiết khấu ${formatVND(discountAmount)})` : ''} để khách quét trực tiếp từ bất kỳ ứng dụng ngân hàng nào.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-[#F1F5F9] flex items-center gap-3 shrink-0">
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
                <span>Xác nhận & Mở mã QR ({formatVND(finalTotal)})</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Xác nhận thanh toán ({formatVND(finalTotal)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentDetailModal;
