'use client';

import React, { useState } from 'react';
import useCartStore from '../../../stores/cart.store';
import { X, Trash2, Plus, Minus, Tag, ShoppingBag } from 'lucide-react';
import apiFetch from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../../context/i18nContext';
import Image from 'next/image';
import { addOrderToCookie } from '@/lib/orderHistoryCookie';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  tableName?: string;
  tenantId?: string;
  branchId?: string;
  primaryColor?: string;
  onOrderSuccess?: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  tableId,
  tableName = 'Bàn',
  tenantId = 'default-tenant',
  branchId = 'default-branch',
  primaryColor = '#00A389',
  onOrderSuccess,
}: CartDrawerProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { items, updateQuantity, removeItem, clearCart, getTotalAmount, getTotalCount } = useCartStore();

  const [orderNote, setOrderNote] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherError, setVoucherError] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const subTotal = getTotalAmount();
  const totalDue = Math.max(0, subTotal - discountAmount);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsApplyingVoucher(true);
    setVoucherError('');
    try {
      const res = await apiFetch<{ discountAmount: number }>('/vouchers/apply', {
        method: 'POST',
        body: JSON.stringify({
          tableId,
          tenantId: tenantId || 'default-tenant',
          code: voucherCode.trim(),
          subTotal,
        }),
      });

      if (res?.success && res.data) {
        setDiscountAmount(res.data.discountAmount);
        setVoucherError('');
      } else {
        setVoucherError(res?.message || t('errors.validation', 'Mã giảm giá không hợp lệ'));
        setDiscountAmount(0);
      }
    } catch {
      setVoucherError(t('errors.network', 'Lỗi kiểm tra voucher'));
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleSendOrder = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        tableId,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          note: i.note,
          modifiers: i.selectedModifiers,
        })),
        voucherCode: discountAmount > 0 ? voucherCode : undefined,
        discountAmount,
        note: orderNote.trim() || undefined,
      };

      // Gọi API tạo đơn — THẤT BẠI thì báo lỗi rõ ràng, GIỮ NGUYÊN giỏ hàng,
      // không điều hướng sang trang trạng thái (tránh "đặt món ảo").
      const res = await apiFetch<{ order?: { orderCode: string } }>(
        `/sessions/${encodeURIComponent(tableId)}/order`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      if (!res.success || !res.data?.order?.orderCode) {
        throw new Error(res.message || 'Không gửi được đơn tới bếp, vui lòng thử lại');
      }
      const createdOrderCode = res.data.order.orderCode;

      // Lưu đơn hàng vào cookie của trình duyệt để theo dõi lịch sử món đã gọi
      try {
        addOrderToCookie({
          orderCode: createdOrderCode,
          tableId,
          tableName,
          totalAmount: totalDue,
          note: orderNote.trim() || undefined,
          createdAt: new Date().toISOString(),
          status: 'PREPARING',
          items: items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            selectedModifiers: i.selectedModifiers,
            note: i.note,
            imageUrl: i.imageUrl,
          })),
        });
      } catch (err) {
        console.warn('Lỗi lưu đơn vào cookie:', err);
      }

      // Lưu đơn hàng vào localStorage để trang theo dõi trạng thái hiển thị đúng món vừa gọi
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            `menugo_order_${tableId}`,
            JSON.stringify({
              items,
              totalAmount: totalDue,
              orderCode: createdOrderCode,
              note: orderNote.trim() || undefined,
              createdAt: new Date().toISOString(),
            })
          );
        } catch {}
      }

      clearCart();
      onClose();

      // Bắn sự kiện cập nhật lịch sử món và tự động mở modal lịch sử món đã gọi
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('menugo:order_history_changed'));
        window.dispatchEvent(new CustomEvent('menugo:open_order_history'));
      }
      if (onOrderSuccess) {
        onOrderSuccess();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('errors.network', 'Lỗi gửi đơn'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[rgba(15,23,42,0.5)] backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white border border-[#E2E8F0] rounded-t-[28px] sm:rounded-3xl flex flex-col max-h-[88vh] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Header Bar chuẩn Mobile */}
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="text-[18px] font-extrabold text-[#0F172A]">Tuỳ chọn</h3>
            <p className="text-[12px] text-[#64748B] mt-0.5 font-medium">
              {tableName} • <strong className="text-[#00A389]">{getTotalCount()} món</strong> đã chọn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200 flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ghi chú đơn hàng (chuẩn mobile OrderScreen) */}
        <div className="px-4 pt-3 pb-1 shrink-0">
          <input
            type="text"
            className="w-full bg-[#F8FAFC] rounded-xl px-3.5 py-2.5 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] border border-[#E2E8F0] focus:outline-hidden focus:border-[#00A389] focus:bg-white font-medium transition"
            placeholder="Ghi chú"
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
          />
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {items.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-[#94A3B8]">
              <ShoppingBag size={40} className="mb-2 opacity-30 text-[#94A3B8]" />
              <p className="text-[13.5px] font-bold text-[#0F172A]">{t('cart.empty', 'Giỏ hàng của bạn đang trống')}</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cartItemId}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3 flex gap-3 items-center justify-between"
              >
                {/* Thumbnail */}
                <div className="relative w-12 h-12 bg-white rounded-xl overflow-hidden shrink-0 border border-[#E2E8F0]">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#94A3B8] text-[10px] font-mono">
                      HiAI
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="font-bold text-[13.5px] text-[#0F172A] truncate">
                      {item.name}
                    </h5>
                    <button
                      type="button"
                      onClick={() => removeItem(item.cartItemId)}
                      className="p-1 text-[#94A3B8] hover:text-red-500 transition-colors"
                      title="Xoá món"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Modifiers List */}
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <p className="text-[11px] text-[#00A389] font-medium truncate mt-0.5">
                      {item.selectedModifiers.map((m) => m.optionName).join(', ')}
                    </p>
                  )}

                  {/* Note */}
                  {item.note && (
                    <p className="text-[11px] text-[#64748B] italic truncate mt-0.5">
                      Ghi chú: {item.note}
                    </p>
                  )}

                  {/* Price & Stepper */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60">
                    <span className="text-[13px] font-black text-[#008770] font-mono">
                      {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                    </span>

                    {/* Stepper chuẩn Mobile */}
                    <div className="flex items-center bg-white rounded-lg px-1.5 py-0.5 border border-[#E2E8F0] gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="p-1 text-[#475569] hover:text-[#0F172A] active:scale-90"
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="w-4 text-center text-[12px] font-extrabold text-[#0F172A]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="p-1 text-[#475569] hover:text-[#0F172A] active:scale-90"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Voucher & Pricing Section */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[#F1F5F9] bg-white space-y-3 shrink-0">
            {/* Voucher input */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-[12px] text-[#0F172A] placeholder-[#94A3B8] uppercase font-mono font-bold focus:outline-hidden focus:border-[#00A389]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  disabled={isApplyingVoucher || !voucherCode.trim()}
                  className="px-3.5 py-2 bg-[#00A389] hover:bg-[#008770] text-xs font-bold text-white rounded-xl disabled:opacity-40 transition"
                >
                  {isApplyingVoucher ? t('common.loading', 'Kiểm tra...') : t('cart.applyVoucher', 'Áp dụng')}
                </button>
              </div>
              {voucherError && <p className="text-[11px] text-red-500 font-bold">{voucherError}</p>}
            </div>

            {/* Total Pricing Details */}
            <div className="space-y-1 text-[12.5px] border-t border-[#F1F5F9] pt-2">
              <div className="flex justify-between text-[#64748B]">
                <span>Tạm tính ({getTotalCount()} món)</span>
                <span className="font-mono font-bold">{subTotal.toLocaleString('vi-VN')}đ</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#00A389] font-bold">
                  <span>Giảm giá khuyến mãi</span>
                  <span className="font-mono">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[15px] pt-1 border-t border-slate-100 font-extrabold text-[#0F172A]">
                <span>Tổng thanh toán</span>
                <span className="text-[#008770] font-black font-mono text-[17px]">
                  {totalDue.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-xl border border-red-200">
                {errorMsg}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={isSubmitting || items.length === 0}
              onClick={handleSendOrder}
              style={{ backgroundColor: primaryColor }}
              className="w-full py-3.5 rounded-2xl font-extrabold text-white hover:brightness-105 flex items-center justify-center shadow-xl shadow-[#00A389]/25 active:scale-[0.98] transition-all disabled:opacity-50 text-[14px]"
            >
              <span>{isSubmitting ? 'Đang gửi...' : 'Xác nhận'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
