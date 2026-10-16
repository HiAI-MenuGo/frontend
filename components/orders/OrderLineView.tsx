'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus, Minus, Trash2, Banknote, QrCode, Sparkles, Check, X, ChevronDown } from 'lucide-react';
import { fetchMenuItems } from '@/lib/api/menu.api';
import { fetchTables } from '@/lib/api/tables.api';
import { createSessionOrder, payCash } from '@/lib/api/sessions.api';
import type { MenuItemDTO, UiTable } from '@/lib/api/types';
import { useSearchStore } from '@/stores/search.store';
import { useBranchStore } from '@/stores/branch.store';
import { formatVND } from '@/lib/format';
import { BillPrintModal } from '@/components/payment/BillPrintModal';
import { VietQRModal } from '@/components/payment/VietQRModal';
import { ItemOptionsModal } from '@/components/orders/ItemOptionsModal';
import { createTaggedLogger } from '@/lib/logger';
import { PaymentDetailModal, type PaymentDiscountInfo } from './PaymentDetailModal';

interface CartItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

const log = createTaggedLogger('ORDERS');
export default function OrderLineView() {
  const router = useRouter();
  const globalSearch = useSearchStore((s) => s.query);
  const [dishes, setDishes] = useState<MenuItemDTO[]>([]);
  const [tables, setTables] = useState<UiTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState('Tất cả món');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'scan'>('cash');
  const [isPaymentDetailOpen, setIsPaymentDetailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isQRopen, setIsQRopen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | undefined>(undefined);
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  const [customizingDish, setCustomizingDish] = useState<MenuItemDTO | null>(null);

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const load = useCallback(async () => {
    setError(null);
    try {
      const branchId = selectedBranchId === 'ALL' ? 'ALL' : selectedBranchId;
      const [m, t] = await Promise.all([fetchMenuItems(branchId), fetchTables(branchId)]);
      setDishes(m);
      setTables(t);
      if (t.length > 0) {
        setSelectedTableId((prev) => {
          if (prev && t.some((x) => x.id === prev)) return prev;
          const empty = t.find((x) => x.status === 'AVAILABLE') ?? t[0];
          return empty.id;
        });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of dishes) {
      const catName = typeof d.category === 'string' ? d.category : (d.category as any)?.name || 'Món khác';
      map.set(catName, (map.get(catName) ?? 0) + 1);
    }
    return [{ name: 'Tất cả món', count: dishes.length }, ...Array.from(map.entries()).map(([name, count]) => ({ name, count }))];
  }, [dishes]);

  const filtered = dishes.filter((d) => {
    const catName = typeof d.category === 'string' ? d.category : (d.category as any)?.name || '';
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      if (!d.name.toLowerCase().includes(q) && !catName.toLowerCase().includes(q)) return false;
    }
    if (activeCategory === 'Tất cả món') return true;
    return catName === activeCategory;
  });

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + tax;
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const handleAddToCartWithOptions = (
    dish: MenuItemDTO,
    quantity: number,
    note: string
  ) => {
    setCart((prev) => {
      const trimmed = note.trim();
      const existingIndex = prev.findIndex(
        (item) => item.dishId === dish.id && (item.note ?? '') === trimmed
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }
      return [
        ...prev,
        {
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          quantity,
          note: trimmed || undefined,
        },
      ];
    });
  };

  const handleDecreaseDish = (dish: MenuItemDTO) => {
    setCart((prev) => {
      const matchingIndices = prev
        .map((item, idx) => (item.dishId === dish.id ? idx : -1))
        .filter((idx) => idx !== -1);
      if (matchingIndices.length === 0) return prev;
      const lastIdx = matchingIndices[matchingIndices.length - 1];
      const target = prev[lastIdx];
      if (target.quantity <= 1) {
        return prev.filter((_, idx) => idx !== lastIdx);
      }
      const next = [...prev];
      next[lastIdx] = { ...target, quantity: target.quantity - 1 };
      return next;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOpenPaymentModal = () => {
    if (cart.length === 0) {
      alert('Vui lòng chọn ít nhất 1 món vào giỏ hàng trước khi xác nhận!');
      return;
    }
    if (!selectedTableId) {
      alert('Vui lòng chọn bàn phục vụ!');
      return;
    }
    setIsPaymentDetailOpen(true);
  };

  const handleConfirmFromPaymentModal = async (
    method: 'cash' | 'scan',
    cashReceived: number,
    discountInfo?: PaymentDiscountInfo
  ) => {
    if (cart.length === 0 || !selectedTableId) return;
    setIsSubmitting(true);
    setPaymentMethod(method);
    const payTotal = discountInfo?.finalTotal ?? total;
    const discountAmount = discountInfo?.amount ?? 0;
    setConfirmedTotal(payTotal);
    setAppliedDiscount(discountAmount);

    try {
      log.info('[OrderLineView] Creating session order...', { selectedTableId, cartItems: cart.length, payTotal, discountAmount });
      const orderNote = `Đặt món - ${selectedTable?.tableName ?? ''}${
        discountInfo?.reason ? ` (CK: ${discountInfo.reason})` : ''
      }`;
      const result = await createSessionOrder(
        selectedTableId,
        cart.map((c) => ({ menuItemId: c.dishId, quantity: c.quantity, note: c.note })),
        orderNote
      );
      const sessionId = result?.session?.id;
      log.info('[OrderLineView] Session order created:', { sessionId, result });

      const effectiveBranchId = selectedBranchId === 'ALL' ? selectedTable?.branchId : selectedBranchId;

      if (method === 'cash') {
        if (sessionId) {
          try {
            log.info('[OrderLineView] Processing cash payment...', { sessionId, cashReceived, branchId: effectiveBranchId });
            await payCash(
              sessionId,
              cashReceived > 0 ? cashReceived : payTotal,
              effectiveBranchId,
              'CASH',
              discountAmount,
              discountInfo?.reason
            );
            log.info('[OrderLineView] Cash payment success');
          } catch (payErr) {
            log.error('[OrderLineView] Cash payment failed:', payErr);
            alert(payErr instanceof Error ? payErr.message : 'Thanh toán tiền mặt thất bại. Vui lòng kiểm tra lại!');
            return;
          }
        }
        setIsPaymentDetailOpen(false);
        setCart([]);
        setLastSessionId(sessionId);
        log.info('[OrderLineView] Navigating to /order-management...');
        router.push('/order-management');
      } else {
        // Phương thức Quét VietQR
        setIsPaymentDetailOpen(false);
        setLastSessionId(sessionId);
        setIsQRopen(true);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Lỗi đặt đơn món';
      log.error('[OrderLineView] Order creation failed:', e);
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-slate-500">Đang tải thực đơn và sơ đồ bàn...</div>;
  }
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
        <p className="font-bold text-slate-800">Không tải được dữ liệu đặt món</p>
        <p className="text-sm text-slate-500">{error}</p>
        <button onClick={load} className="px-5 py-2.5 bg-[#00A389] text-white rounded-xl text-sm font-semibold">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col xl:flex-row overflow-hidden bg-[#F8FAFC] h-full min-h-0 min-w-0">
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 space-y-5 sm:space-y-7">
        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden no-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`h-9 px-3.5 rounded-full text-[12.5px] font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#00A389] text-white shadow-xs'
                      : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:text-[#0F172A]'
                  }`}
                >
                  <span className="whitespace-nowrap">{cat.name}</span>
                  <span
                    className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">Không có món nào. Kiểm tra backend /api/menu/items.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4 pt-2 min-w-0">
              {filtered.map((dish) => {
                const dishCartItems = cart.filter((i) => i.dishId === dish.id);
                const qty = dishCartItems.reduce((s, i) => s + i.quantity, 0);
                return (
                  <div
                    key={dish.id}
                    onClick={() => {
                      if (!dish.isSoldOut) setCustomizingDish(dish);
                    }}
                    className={`bg-white rounded-[22px] p-3 border relative flex flex-col justify-between shadow-xs hover:shadow-md transition-all group cursor-pointer ${
                      qty > 0 ? 'border-2 border-[#00A389]' : 'border-[#E2E8F0]'
                    } ${dish.isSoldOut ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="relative w-full h-[125px] sm:h-[135px] rounded-[16px] overflow-hidden bg-[#F8FAFC] mb-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {dish.isPopular && (
                        <div className="absolute top-2 left-2 bg-[#EF4444] text-white flex items-center gap-1 px-2 py-0.5 rounded-[6px] z-10 shadow-xs">
                          <Sparkles size={10} className="text-white" />
                          <span className="text-white text-[9.5px] font-black tracking-wide">Nổi bật</span>
                        </div>
                      )}
                      {dish.isSoldOut && (
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center backdrop-blur-[1px]">
                          <span className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
                            Hết món
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                      <h4 className="font-bold text-[14px] text-[#0F172A] line-clamp-1 leading-snug">
                        {dish.name}
                      </h4>
                      <p className="text-[11.5px] text-[#94A3B8] font-medium mt-0.5 mb-2.5 truncate">
                        {typeof dish.category === 'string' ? dish.category : (dish.category as any)?.name || ''}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 mt-auto pt-1 min-w-0">
                      <span className="font-extrabold text-[13.5px] sm:text-[15px] text-[#00A389] whitespace-nowrap shrink-0">
                        {formatVND(dish.price)}
                      </span>

                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomizingDish(dish);
                          }}
                          disabled={dish.isSoldOut}
                          className="w-[34px] h-[34px] rounded-full bg-[#00A389] hover:bg-[#008f77] text-white flex items-center justify-center active:scale-90 transition-transform shadow-xs disabled:opacity-40 shrink-0"
                          aria-label="Thêm vào giỏ"
                        >
                          <Plus size={18} strokeWidth={2.5} />
                        </button>
                      ) : (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center bg-[#00A389] text-white rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 gap-1 shadow-xs shrink-0"
                        >
                          <button
                            type="button"
                            onClick={() => handleDecreaseDish(dish)}
                            className="w-5 h-5 flex items-center justify-center text-white hover:opacity-80 active:scale-90"
                            aria-label="Giảm"
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="text-white text-[12px] font-extrabold min-w-[14px] text-center select-none">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomizingDish(dish)}
                            disabled={dish.isSoldOut}
                            className="w-5 h-5 flex items-center justify-center text-white hover:opacity-80 active:scale-90 disabled:opacity-40"
                            aria-label="Thêm"
                          >
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-full xl:w-[340px] 2xl:w-[370px] shrink-0 bg-white border-t xl:border-t-0 xl:border-l border-[#E2E8F0] flex flex-col h-full min-h-0 overflow-hidden">
        {/* Phần trên: Bàn phục vụ & Danh sách món đã chọn (Cuộn độc lập) */}
        <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-5 overflow-hidden">
          <div className="pb-3 border-b border-[#F1F5F9] shrink-0">
            <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Bàn phục vụ</label>
            <div className="relative mt-1">
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full h-11 pl-3.5 pr-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] font-bold focus:outline-hidden focus:border-[#00A389] appearance-none cursor-pointer"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tableName} — {t.status === 'AVAILABLE' ? 'Trống' : t.status === 'ON_DINE' ? 'Đang dùng' : 'Đã đặt'}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="text-[#64748B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="font-extrabold text-[14px] text-[#0F172A]">Món đã chọn</span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-[#FF7A59] hover:text-rose-600 flex items-center gap-1 text-[11.5px] font-bold transition-colors cursor-pointer"
                  title="Xoá tất cả món"
                >
                  <Trash2 size={13} />
                  <span>Xoá hết</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9] pr-1 py-1">
            {cart.length === 0 ? (
              <div className="h-full min-h-[120px] flex items-center justify-center text-center text-[#94A3B8] text-[12.5px] font-medium">
                Chưa có món nào. Nhấn + tại thực đơn.
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={`${item.dishId}-${idx}`} className="py-2.5 flex items-start justify-between text-[12.5px] gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-[#0F172A] truncate block">{item.quantity}x {item.name}</span>
                    {item.note && (
                      <span className="text-[11px] text-[#00A389] italic block truncate mt-0.5">
                        {item.note}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-[#0F172A]">{formatVND(item.price * item.quantity)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCartItem(idx)}
                      className="text-[#94A3B8] hover:text-[#EF4444] p-0.5 transition-colors cursor-pointer"
                      aria-label="Xoá món"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Phần dưới: Cố định đứng cứng ở dưới (Tạm tính, Nút Xác nhận) */}
        <div className="shrink-0 p-4 sm:p-5 pt-3 border-t border-[#F1F5F9] bg-white space-y-3">
          {/* Khối Tạm tính */}
          <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] space-y-2 text-[12.5px]">
            <div className="flex justify-between text-[#64748B]">
              <span>Tạm tính</span>
              <span className="font-bold text-[#0F172A]">{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Thuế (8%)</span>
              <span className="font-bold text-[#0F172A]">{formatVND(tax)}</span>
            </div>
            <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center text-[15px] font-black">
              <span>Tổng</span>
              <span className="text-[#00A389] text-[16px]">{formatVND(total)}</span>
            </div>
          </div>

          {/* Nút Xác nhận: Bấm mở popup Form Chi tiết thanh toán */}
          <button
            type="button"
            onClick={handleOpenPaymentModal}
            disabled={isSubmitting || cart.length === 0}
            className="w-full h-12 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-black text-[14px] flex items-center justify-center shadow-md shadow-[#00A389]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none cursor-pointer"
          >
            <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}</span>
          </button>
        </div>
      </div>

      <PaymentDetailModal
        isOpen={isPaymentDetailOpen}
        onClose={() => setIsPaymentDetailOpen(false)}
        tableName={selectedTable?.tableName ?? ''}
        items={cart}
        subtotal={subtotal}
        tax={tax}
        total={total}
        onConfirm={handleConfirmFromPaymentModal}
        isSubmitting={isSubmitting}
      />
      <BillPrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        tableNumber={selectedTable?.tableName ?? ''}
        orderNumber="Mới"
        items={cart}
        subtotal={subtotal}
        tax={tax}
        total={confirmedTotal ?? total}
        discount={appliedDiscount}
        paymentMethod={paymentMethod}
      />
      <VietQRModal
        isOpen={isQRopen}
        onClose={() => {
          setIsQRopen(false);
          setConfirmedTotal(null);
          setAppliedDiscount(0);
        }}
        onSuccess={async () => {
          const sessId = lastSessionId;
          const effectiveBranchId = selectedBranchId === 'ALL' ? selectedTable?.branchId : selectedBranchId;
          if (sessId) {
            try {
              log.info('[OrderLineView] Settle VietQR payment in backend...', { sessId, total: confirmedTotal ?? total });
              await payCash(
                sessId,
                confirmedTotal ?? total,
                effectiveBranchId,
                'VIETQR',
                appliedDiscount
              );
              log.info('[OrderLineView] VietQR payment settled successfully');
            } catch (payErr) {
              log.error('[OrderLineView] VietQR settlement failed:', payErr);
              alert(payErr instanceof Error ? payErr.message : 'Lỗi cập nhật thanh toán VietQR');
              return;
            }
          }
          log.info('[OrderLineView] QR payment success, navigating to /order-management');
          setIsQRopen(false);
          setConfirmedTotal(null);
          setAppliedDiscount(0);
          setCart([]);
          setPaymentMethod('cash');
          router.push('/order-management');
        }}
        totalVnd={confirmedTotal ?? total}
        orderNumber="Mới"
        tableNumber={selectedTable?.tableName ?? ''}
        sessionId={lastSessionId}
      />
      <ItemOptionsModal
        key={customizingDish?.id ?? 'none'}
        isOpen={!!customizingDish}
        dish={customizingDish}
        onClose={() => setCustomizingDish(null)}
        onConfirm={handleAddToCartWithOptions}
      />
      <button className="hidden"><ChevronRight size={1} /></button>
    </div>
  );
}
