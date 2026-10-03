'use client';

import React, { useState } from 'react';
import useCartStore from '../../../stores/cart.store';
import { X, Trash2, Plus, Minus, Tag, Send, AlertCircle } from 'lucide-react';
import apiFetch from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../../context/i18nContext';
import { NoteLinesDark } from '../../../lib/format-note';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  tableName?: string;
  tenantId?: string;
  branchId?: string;
  primaryColor?: string;
}

export function CartDrawer({
  isOpen,
  onClose,
  tableId,
  tableName = 'Bàn',
  tenantId = 'default-tenant',
  branchId = 'default-branch',
  primaryColor = '#f59e0b',
}: CartDrawerProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { items, updateQuantity, removeItem, clearCart, getTotalAmount, getTotalCount } = useCartStore();

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
      const res = await apiFetch<any>('/vouchers/apply', {
        method: 'POST',
        body: JSON.stringify({
          tenantId,
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
        branchId,
        tenantId,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.unitPrice,
          quantity: i.quantity,
          note: i.note,
          modifiers: i.selectedModifiers,
        })),
        voucherCode: discountAmount > 0 ? voucherCode : undefined,
        discountAmount,
        totalAmount: totalDue,
      };

      const res = await apiFetch<any>(`/sessions/${tableId}/order`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res?.success || res?.data) {
        clearCart();
        onClose();
        router.push(`/table/${tableId}/order-status`);
      } else {
        setErrorMsg(res?.message || t('errors.generic', 'Không thể gửi đơn đến bếp'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || t('errors.network', 'Lỗi gửi đơn'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">{tableName}</h3>
            <p className="text-xs text-zinc-400">
              {getTotalCount()} {t('kds.items', 'món')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
              <AlertCircle className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">{t('cart.empty', 'Giỏ hàng của bạn đang trống')}</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cartItemId}
                className="bg-zinc-800/50 border border-zinc-800 rounded-2xl p-3.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-semibold text-sm text-zinc-100">{item.name}</h5>
                    <span className="text-xs font-bold text-amber-400">
                      {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.cartItemId)}
                    className="p-1 text-zinc-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Modifiers List */}
                {item.selectedModifiers.length > 0 && (
                  <div className="text-[11px] text-zinc-400 space-y-0.5 border-l-2 border-amber-500/40 pl-2">
                    {item.selectedModifiers.map((mod, idx) => (
                      <p key={idx}>
                        • {mod.optionName}
                        {mod.extraPrice > 0 && ` (+${mod.extraPrice.toLocaleString('vi-VN')}đ)`}
                      </p>
                    ))}
                  </div>
                )}

                {/* Note */}
                {item.note && (
                  <div className="bg-zinc-900/60 rounded px-2 py-1 space-y-0.5">
                    <span className="text-[11px] text-zinc-500 italic block">
                      {t('menu.note', 'Ghi chú')}:
                    </span>
                    <NoteLinesDark note={item.note} />
                  </div>
                )}

                {/* Quantity Controls */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1 border border-zinc-700">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="p-1 hover:bg-zinc-800 text-zinc-300 rounded"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-zinc-200">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="p-1 hover:bg-zinc-800 text-zinc-300 rounded"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Voucher & Pricing Section */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/80 space-y-3">
            {/* Voucher input */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder={t('cart.voucherPlaceholder', 'Nhập mã giảm giá...')}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  disabled={isApplyingVoucher || !voucherCode.trim()}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl disabled:opacity-40 transition"
                >
                  {isApplyingVoucher ? t('common.loading', 'Đang kiểm tra...') : t('cart.applyVoucher', 'Áp dụng')}
                </button>
              </div>
              {voucherError && <p className="text-[11px] text-red-400 pl-1">{voucherError}</p>}
              {discountAmount > 0 && (
                <p className="text-[11px] text-emerald-400 pl-1">
                  {t('cart.appliedVoucher', 'Đã áp dụng giảm')} -{discountAmount.toLocaleString('vi-VN')}đ!
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs text-zinc-400 pt-1">
              <div className="flex justify-between">
                <span>{t('cart.subTotal', 'Tạm tính')}</span>
                <span className="text-zinc-200 font-medium">
                  {subTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{t('cart.discount', 'Giảm giá')}</span>
                  <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-zinc-100 pt-1 border-t border-zinc-800">
                <span>{t('cart.totalAmount', 'Tổng cộng')}</span>
                <span className="text-amber-400 text-base">
                  {totalDue.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 p-2 rounded-lg">
                {errorMsg}
              </p>
            )}

            {/* Send to Kitchen CTA */}
            <button
              type="button"
              onClick={handleSendOrder}
              disabled={isSubmitting}
              style={{ backgroundColor: primaryColor }}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-zinc-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition hover:brightness-105 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? t('cart.sending', 'Đang gửi...')
                  : t('cart.sendOrder', 'Gửi Đơn Đến Bếp')}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
