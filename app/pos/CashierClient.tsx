'use client';

import React, { useState } from 'react';
import { MenuItemView } from '../table/hooks/useMenuSoldOut';
import PosItemOptionsModal from './ItemOptionsModal';
import { SelectedModifier } from '../../stores/cart.store';
import apiFetch from '../../lib/api';
import { NoteLinesDark } from '../../lib/format-note';
import { QRCodeSVG } from 'qrcode.react';
import { useI18n } from '../../context/i18nContext';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  QrCode,
  Printer,
  CheckCircle,
  X,
  CreditCard,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

interface PosOrderItem {
  cartItemId: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  note?: string;
}

export function CashierClient() {
  const { t } = useI18n();
  const [categories] = useState([
    { id: 'all', nameKey: 'common.all', fallback: 'Tất cả' },
    { id: 'cat-1', nameKey: 'pos.catFruitTea', fallback: 'Trà Trái Cây' },
    { id: 'cat-2', nameKey: 'pos.catCoffee', fallback: 'Cà Phê' },
    { id: 'cat-3', nameKey: 'pos.catSnacks', fallback: 'Đồ Ăn Nhẹ' },
  ]);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [selectedTable, setSelectedTable] = useState('Bàn 01');

  const [menuItems] = useState<MenuItemView[]>([
    {
      id: 'item-1',
      name: 'Trà Đào Cam Sả',
      basePrice: 45000,
      isSoldOut: false,
      categoryId: 'cat-1',
      modifierGroups: [
        {
          modifierGroup: {
            id: 'm-size',
            name: 'Kích cỡ',
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: [
              { id: 'o-m', name: 'Size M', extraPrice: 0, isDefault: true, isSoldOut: false },
              { id: 'o-l', name: 'Size L', extraPrice: 10000, isDefault: false, isSoldOut: false },
            ],
          },
        },
      ],
    },
    {
      id: 'item-2',
      name: 'Cà Phê Muối Đặc Biệt',
      basePrice: 35000,
      isSoldOut: false,
      categoryId: 'cat-2',
    },
    {
      id: 'item-3',
      name: 'Bạc Xỉu Sài Gòn',
      basePrice: 32000,
      isSoldOut: false,
      categoryId: 'cat-2',
    },
    {
      id: 'item-4',
      name: 'Khoai Tây Chiên Phô Mai',
      basePrice: 39000,
      isSoldOut: false,
      categoryId: 'cat-3',
    },
    {
      id: 'item-5',
      name: 'Bánh Croissant Bơ Pháp',
      basePrice: 42000,
      isSoldOut: false,
      categoryId: 'cat-3',
    },
  ]);

  const [cartItems, setCartItems] = useState<PosOrderItem[]>([
    {
      cartItemId: 'item-1_default',
      menuItemId: 'item-1',
      name: 'Trà Đào Cam Sả',
      basePrice: 45000,
      unitPrice: 45000,
      quantity: 2,
      selectedModifiers: [],
    },
  ]);

  const [modalItem, setModalItem] = useState<MenuItemView | null>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // Payment Modal States
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'CASH' | 'VIETQR'>('CASH');
  const [receivedCash, setReceivedCash] = useState<number>(0);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  const subTotal = cartItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberInfo, setMemberInfo] = useState<{ name?: string; tier?: string; points?: number } | null>(null);

  const discountAmount = voucherDiscount;
  const finalTotal = Math.max(0, subTotal - discountAmount);
  const changeAmount = Math.max(0, receivedCash - finalTotal);

  const handleApplyVoucher = async () => {
    const code = voucherCode.trim();
    if (!code) {
      setVoucherMsg(t('pos.enterVoucherCode', 'Nhập mã voucher trước khi áp dụng'));
      return;
    }
    setVoucherMsg(t('pos.checkingVoucher', 'Đang kiểm tra mã...'));
    const res = await apiFetch('/vouchers/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subTotal }),
    });
    if (res.success && res.data) {
      setVoucherDiscount(Number(res.data.discountAmount) || 0);
      setVoucherMsg(`${t('pos.discountApplied', 'Đã giảm')} ${Number(res.data.discountAmount || 0).toLocaleString('vi-VN')}đ (${res.data.code})`);
    } else {
      setVoucherDiscount(0);
      setVoucherMsg(res.message || t('pos.voucherInvalid', 'Mã voucher không hợp lệ'));
    }
  };

  const handleLookupMember = async () => {
    const phone = memberPhone.trim();
    if (!phone) return;
    const res = await apiFetch(`/customers?phone=${encodeURIComponent(phone)}`);
    if (res.success && res.data) {
      const c = Array.isArray(res.data) ? res.data[0] : res.data;
      setMemberInfo(c ? { name: c.name, tier: c.tier || c.membershipTier, points: c.points } : null);
    } else {
      setMemberInfo(null);
    }
  };

  const handleSelectItem = (item: MenuItemView) => {
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setModalItem(item);
      setIsOptionsOpen(true);
    } else {
      // Direct add
      const existing = cartItems.find((i) => i.menuItemId === item.id && i.selectedModifiers.length === 0);
      if (existing) {
        setCartItems((prev) =>
          prev.map((i) => (i.cartItemId === existing.cartItemId ? { ...i, quantity: i.quantity + 1 } : i))
        );
      } else {
        setCartItems((prev) => [
          ...prev,
          {
            cartItemId: `${item.id}_${Date.now()}`,
            menuItemId: item.id,
            name: item.name,
            basePrice: item.basePrice,
            unitPrice: item.basePrice,
            quantity: 1,
            selectedModifiers: [],
          },
        ]);
      }
    }
  };

  const handleAddWithOptions = (
    item: MenuItemView,
    quantity: number,
    modifiers: SelectedModifier[],
    note: string
  ) => {
    const extra = modifiers.reduce((acc, m) => acc + m.extraPrice, 0);
    const unitPrice = item.basePrice + extra;
    setCartItems((prev) => [
      ...prev,
      {
        cartItemId: `${item.id}_${Date.now()}`,
        menuItemId: item.id,
        name: item.name,
        basePrice: item.basePrice,
        unitPrice,
        quantity,
        selectedModifiers: modifiers,
        note,
      },
    ]);
  };

  const updateQuantity = (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
    } else {
      setCartItems((prev) =>
        prev.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity: qty } : i))
      );
    }
  };

  const openCheckout = () => {
    setReceivedCash(finalTotal);
    setIsPaidSuccess(false);
    setIsPayModalOpen(true);
  };

  const handleCompletePayment = () => {
    setIsPaidSuccess(true);
    setTimeout(() => {
      setIsPayModalOpen(false);
      setCartItems([]);
      setIsPaidSuccess(false);
    }, 1500);
  };

  const filteredItems = menuItems.filter((i) => {
    const matchCat = activeCategory === 'all' || i.categoryId === activeCategory;
    const matchSearch = !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden select-none">
      {/* LEFT: Menu Catalog & Categories */}
      <div className="flex-1 flex flex-col border-r border-zinc-800 bg-zinc-950 overflow-hidden">
        {/* Top Filter Bar */}
        <div className="p-4 border-b border-zinc-800 space-y-3 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('pos.searchQuick', 'Tìm món nhanh...')}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-amber-400 focus:outline-none"
            >
              <option value="Bàn 01">Bàn 01</option>
              <option value="Bàn 02">Bàn 02</option>
              <option value="Bàn 03">Bàn 03</option>
              <option value="Bàn 05">Bàn 05 (Sân vườn)</option>
              <option value="VIP-01">Phòng VIP 01</option>
            </select>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {t(cat.nameKey, cat.fallback)}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectItem(item)}
              className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 rounded-2xl p-3.5 flex flex-col justify-between text-left transition duration-150 active:scale-[0.98] group"
            >
              <div>
                <span className="font-semibold text-xs text-zinc-200 line-clamp-2 group-hover:text-amber-400">
                  {item.name}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-xs text-amber-400">
                  {item.basePrice.toLocaleString('vi-VN')}đ
                </span>
                <span className="w-5 h-5 rounded-md bg-zinc-800 group-hover:bg-amber-500 group-hover:text-zinc-950 text-zinc-400 text-xs flex items-center justify-center font-bold">
                  +
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Order Ticket & Checkout */}
      <div className="w-full md:w-96 bg-zinc-900/90 border-l border-zinc-800 flex flex-col justify-between h-auto md:h-full">
        {/* Ticket Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOrderType('DINE_IN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                orderType === 'DINE_IN'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {t('pos.dineIn', 'Tại bàn')}
            </button>
            <button
              type="button"
              onClick={() => setOrderType('TAKEAWAY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                orderType === 'TAKEAWAY'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {t('pos.takeaway', 'Mang về')}
            </button>
          </div>
          <span className="text-xs font-bold text-amber-400">{selectedTable}</span>
        </div>

        {/* Ticket Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cartItems.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">
              {t('pos.emptyTicket', 'Chưa có món trong đơn')}
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.cartItemId}
                className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-2.5 space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-xs text-zinc-200">{item.name}</span>
                  <span className="font-bold text-xs text-amber-400">
                    {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                  </span>
                </div>

                {item.selectedModifiers.length > 0 && (
                  <p className="text-[10px] text-zinc-400">
                    ↳ {item.selectedModifiers.map((m) => m.optionName).join(', ')}
                  </p>
                )}

                <div className="pl-1">
                  <NoteLinesDark note={item.note} />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <div className="flex items-center gap-2 bg-zinc-900 rounded p-0.5 border border-zinc-700">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="p-1 hover:bg-zinc-800 text-zinc-300 rounded"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-4 text-center text-xs font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="p-1 hover:bg-zinc-800 text-zinc-300 rounded"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.cartItemId, 0)}
                    className="text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 rounded-lg px-2 py-1 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('pos.cancelItem', 'Hủy món')}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing & Checkout Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 space-y-3">
          {/* Voucher + thành viên (C-012) */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder={t('pos.voucherPlaceholder', 'Mã voucher (VD: GIAM10)')}
                className="flex-1 bg-zinc-800/60 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 uppercase"
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                className="px-3 py-2 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl hover:bg-amber-500/25 flex items-center gap-1"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{t('pos.applyVoucher', 'Áp mã')}</span>
              </button>
            </div>
            {voucherMsg && <p className="text-[11px] text-amber-300">{voucherMsg}</p>}
            <div className="flex gap-2">
              <input
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
                placeholder={t('pos.memberPhonePlaceholder', 'SĐT tích điểm (tùy chọn)')}
                inputMode="tel"
                className="flex-1 bg-zinc-800/60 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleLookupMember}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl hover:bg-zinc-700"
              >
                {t('pos.lookupPoints', 'Tra điểm')}
              </button>
            </div>
            {memberInfo && (
              <p className="text-[11px] text-emerald-300">
                {memberInfo.name}
                {memberInfo.tier ? ` • ${t('pos.tier', 'Hạng')} ${memberInfo.tier}` : ''}
                {memberInfo.points !== undefined ? ` • ${memberInfo.points} ${t('pos.points', 'điểm')}` : ''}
              </p>
            )}
          </div>
          <div className="space-y-1 text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>{t('receipt.subTotal', 'Tạm tính')}</span>
              <span className="text-zinc-200">{subTotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between">
              <span>{t('pos.voucherDiscount', 'Giảm voucher')}</span>
              <span className="text-emerald-400">-{discountAmount.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-zinc-100 pt-1 border-t border-zinc-800">
              <span>{t('pos.totalDue', 'Cần thanh toán')}</span>
              <span className="text-amber-400 text-base">
                {finalTotal.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCartItems([])}
              className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-xl transition"
            >
              {t('pos.cancelOrder', 'Hủy đơn')}
            </button>
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={openCheckout}
              className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
            >
              {t('pos.checkout', 'Thanh Toán')}
            </button>
          </div>
        </div>
      </div>

      {/* Item Options Modal */}
      <PosItemOptionsModal
        item={modalItem}
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        onConfirm={handleAddWithOptions}
      />

      {/* Checkout Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-extrabold text-base text-zinc-100">{t('pos.confirmPaymentTitle', 'Xác Nhận Thanh Toán')}</h3>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total due display */}
            <div className="text-center py-2 bg-zinc-950/60 rounded-2xl border border-zinc-800">
              <span className="text-xs text-zinc-400">{t('pos.amountDue', 'Số tiền cần thu')}</span>
              <p className="text-2xl font-black text-amber-400">
                {finalTotal.toLocaleString('vi-VN')}đ
              </p>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayMethod('CASH')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  payMethod === 'CASH'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-800 bg-zinc-800/40 text-zinc-400'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>{t('pos.cash', 'Tiền Mặt')}</span>
              </button>
              <button
                type="button"
                onClick={() => setPayMethod('VIETQR')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  payMethod === 'VIETQR'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-800 bg-zinc-800/40 text-zinc-400'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>{t('pos.vietqrDynamic', 'VietQR Động')}</span>
              </button>
            </div>

            {/* Cash details */}
            {payMethod === 'CASH' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {[50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setReceivedCash(amt)}
                      className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 rounded-lg border border-zinc-700"
                    >
                      {amt / 1000}k
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setReceivedCash(finalTotal)}
                    className="py-1.5 px-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-[11px] font-bold rounded-lg border border-amber-500/40"
                  >
                    {t('pos.exactCash', 'Đủ')}
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">{t('pos.changeDue', 'Tiền thừa trả khách:')}</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {changeAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            )}

            {/* VietQR display */}
            {payMethod === 'VIETQR' && (
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner">
                <QRCodeSVG
                  value={`https://img.vietqr.io/image/MB-0901234567-compact2.png?amount=${finalTotal}&addInfo=POS%20${selectedTable}`}
                  size={160}
                  level="H"
                />
                <span className="text-[10px] text-zinc-600 font-semibold mt-2">
                  {t('pos.scanVietqrInstruction', 'Quét bằng ứng dụng Ngân hàng để thanh toán tự động')}
                </span>
              </div>
            )}

            {isPaidSuccess ? (
              <div className="py-3 text-center text-emerald-400 font-bold text-sm animate-bounce flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>{t('pos.paidSuccessMessage', 'Thanh toán thành công! Đang in hóa đơn...')}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCompletePayment}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 font-bold text-zinc-950 rounded-xl shadow-lg shadow-emerald-500/20 text-xs transition"
              >
                {t('pos.confirmPaidAndPrint', 'Xác Nhận Đã Thu Tiền & In Bill')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CashierClient;
