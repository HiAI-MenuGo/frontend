'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react';
import { DishItem, LiveOrderCard, TableItem, INITIAL_DISHES, INITIAL_TABLES, INITIAL_LIVE_ORDERS } from './mockData';
import { BillPrintModal } from './BillPrintModal';
import { VietQRModal } from './VietQRModal';

interface CartItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface OrderLineViewProps {
  dishes?: DishItem[];
  tables?: TableItem[];
  liveOrders?: LiveOrderCard[];
  searchQuery?: string;
  onPlaceOrderToBackend?: (orderData: any) => Promise<boolean>;
}

export const OrderLineView: React.FC<OrderLineViewProps> = ({
  dishes = INITIAL_DISHES,
  tables = INITIAL_TABLES,
  liveOrders = INITIAL_LIVE_ORDERS,
  searchQuery = '',
  onPlaceOrderToBackend,
}) => {
  // Filters
  const [activeOrderFilter, setActiveOrderFilter] = useState<'all' | 'dine_in' | 'wait_list' | 'take_away' | 'served'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('Special');

  // Selected Table & Ticket state
  const [selectedTable, setSelectedTable] = useState<string>('Table No #04');
  const [orderNumber, setOrderNumber] = useState<string>('#FO030');
  const [guestCount, setGuestCount] = useState<number>(2);

  // Cart state mirroring Screenshot 1
  const [cart, setCart] = useState<CartItem[]>([
    { dishId: 'd_3', name: 'Pasta with Roast Beef', price: 10.00, quantity: 2, category: 'Pasta' },
    { dishId: 'd_5', name: 'Shrimp Rice Bowl', price: 6.00, quantity: 2, category: 'Rice' },
    { dishId: 'd_6', name: 'Apple Stuffed Pancake', price: 35.00, quantity: 1, category: 'Desserts' },
    { dishId: 'd_8', name: 'Vegetable Shrimp', price: 10.00, quantity: 1, category: 'Salad' },
  ]);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'scan'>('card');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isVietQRModalOpen, setIsVietQRModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessToast, setOrderSuccessToast] = useState(false);

  // Categories with counts for Foodies Menu
  const foodiesCategories = [
    { id: 'All Menu', name: 'All Menu', count: 154, icon: '🍲' },
    { id: 'Special', name: 'Special', count: 19, icon: '🎂' },
    { id: 'Soups', name: 'Soups', count: 3, icon: '🥣' },
    { id: 'Desserts', name: 'Desserts', count: 19, icon: '🍰' },
    { id: 'Chickens', name: 'Chickens', count: 10, icon: '🍗' },
  ];

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal > 0 ? Number((subtotal * 0.08).toFixed(2)) : 0;
  const donation = subtotal > 0 ? 1.00 : 0;
  const totalPayable = subtotal + tax + donation;

  // Cart Handlers
  const handleUpdateQty = (dish: DishItem, delta: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.dishId === dish.id);
      if (!existing) {
        if (delta > 0) {
          return [...prevCart, { dishId: dish.id, name: dish.name, price: dish.price, quantity: 1, category: dish.category }];
        }
        return prevCart;
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prevCart.filter((item) => item.dishId !== dish.id);
      }
      return prevCart.map((item) => (item.dishId === dish.id ? { ...item, quantity: newQty } : item));
    });
  };

  const handleClearCart = () => {
    if (cart.length > 0 && confirm('Bạn có muốn xóa toàn bộ các món trong đơn hiện tại?')) {
      setCart([]);
    }
  };

  const getItemQty = (dishId: string) => {
    return cart.find((item) => item.dishId === dishId)?.quantity || 0;
  };

  // Place Order Action
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Vui lòng chọn ít nhất 1 món ăn trước khi đặt đơn!');
      return;
    }

    if (paymentMethod === 'scan') {
      setIsVietQRModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onPlaceOrderToBackend) {
        await onPlaceOrderToBackend({
          tableNumber: selectedTable,
          items: cart,
          total: totalPayable,
          paymentMethod,
        });
      }
      setOrderSuccessToast(true);
      setTimeout(() => {
        setOrderSuccessToast(false);
        setCart([]);
        setOrderNumber(`#FO0${Math.floor(Math.random() * 89 + 10)}`);
      }, 2000);
    } catch (e) {
      alert('Lỗi đặt đơn. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered dishes
  const filteredDishes = dishes.filter((dish) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = dish.name.toLowerCase().includes(q) || dish.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (activeCategory === 'All Menu') return true;
    if (activeCategory === 'Special') return dish.isPopular || ['Lunch', 'Pasta', 'Beef', 'Salad', 'Rice', 'Desserts'].includes(dish.category);
    if (activeCategory === 'Desserts') return dish.category === 'Desserts';
    if (activeCategory === 'Soups') return dish.category === 'Soups';
    if (activeCategory === 'Chickens') return dish.category === 'Chicken' || dish.name.toLowerCase().includes('chicken');
    return dish.category.toLowerCase().includes(activeCategory.toLowerCase());
  });

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ================= CENTER COLUMN: ORDER LINE & MENU ================= */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7">
        {/* Order Line Header & Status Filter Pills */}
        <div>
          <h2 className="text-[22px] font-black text-[#0F172A] tracking-tight mb-4">
            Order Line
          </h2>

          <div className="flex items-center gap-2.5 flex-wrap">
            {[
              { id: 'all', label: 'All', count: '78' },
              { id: 'dine_in', label: 'Dine in', count: '04' },
              { id: 'wait_list', label: 'Wait List', count: '03' },
              { id: 'take_away', label: 'Take Away', count: '12' },
              { id: 'served', label: 'Served', count: '59' },
            ].map((pill) => {
              const isSelected = activeOrderFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveOrderFilter(pill.id as any)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-extrabold transition-all ${
                    isSelected
                      ? 'bg-white border-2 border-[#00A389] text-[#00A389] shadow-2xs'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-[#00A389] text-white'
                        : pill.id === 'wait_list'
                        ? 'bg-[#FF7A59] text-white'
                        : pill.id === 'take_away'
                        ? 'bg-[#A855F7] text-white'
                        : pill.id === 'served'
                        ? 'bg-[#10B981] text-white'
                        : 'bg-[#00A389] text-white'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Order Queue Cards Carousel (Screenshot 1) */}
        <div className="relative">
          <div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar">
            {liveOrders.map((order) => {
              const isKitchen = order.status === 'IN_KITCHEN';
              const isWait = order.status === 'WAIT_LIST';
              const isReady = order.status === 'READY';

              const cardBg = isKitchen
                ? 'bg-[#E6F7F4] border-[#B6EADF]'
                : isWait
                ? 'bg-[#FFEFE8] border-[#FFD0C0]'
                : 'bg-[#F5EDFD] border-[#DEC6F9]';

              const badgeBg = isKitchen
                ? 'bg-[#00A389] text-white'
                : isWait
                ? 'bg-[#FF7A59] text-white'
                : 'bg-[#A855F7] text-white';

              return (
                <div
                  key={order.id}
                  className={`min-w-[210px] max-w-[220px] p-4 rounded-3xl border ${cardBg} transition-all duration-200 select-none shadow-2xs`}
                >
                  <div className="flex justify-between items-center text-[12.5px] font-bold text-[#0F172A] mb-2">
                    <span>Order {order.orderNumber}</span>
                    <span className="text-[#64748B] font-semibold">{order.tableNumber}</span>
                  </div>

                  <div className="font-extrabold text-[15px] text-[#0F172A] mb-3">
                    Item: {order.itemCount}X
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium text-[#64748B]">
                    <span>{order.timeAgo}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${badgeBg}`}>
                      {order.statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] z-10">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Foodies Menu Section (Screenshot 1) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] font-black text-[#0F172A] tracking-tight">
              Foodies Menu
            </h3>
            <div className="flex items-center gap-2">
              <button className="w-7 h-7 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A]">
                <ChevronLeft size={15} />
              </button>
              <button className="w-7 h-7 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A]">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Category Tabs Cards */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            {foodiesCategories.map((cat) => {
              const isSelected = activeCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`min-w-[130px] p-3 rounded-2xl flex items-center gap-3 text-left transition-all ${
                    isSelected
                      ? 'bg-white border-2 border-[#00A389] shadow-xs'
                      : 'bg-white border border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] flex items-center justify-center text-lg shrink-0">
                    {cat.icon}
                  </div>
                  <div className="overflow-hidden">
                    <span
                      className={`block font-extrabold text-[12.5px] truncate ${
                        isSelected ? 'text-[#00A389]' : 'text-[#0F172A]'
                      }`}
                    >
                      {cat.name}
                    </span>
                    <span className="text-[10px] font-semibold text-[#94A3B8]">
                      {cat.count} items
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 4-Column Dishes Grid (Screenshot 1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {filteredDishes.map((dish) => {
              const qty = getItemQty(dish.id);
              const isInCart = qty > 0;

              return (
                <div
                  key={dish.id}
                  className={`bg-white rounded-3xl p-4 border transition-all duration-200 flex flex-col justify-between group shadow-2xs ${
                    isInCart
                      ? 'border-2 border-[#00A389]'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  {/* Circular Image Container */}
                  <div className="flex justify-center mb-3">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#F1F5F9] shadow-sm group-hover:scale-105 transition-transform duration-200 bg-[#F8FAFC]">
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[#94A3B8] block">
                      {dish.category}
                    </span>
                    <h4 className="font-extrabold text-[13px] text-[#0F172A] line-clamp-1">
                      {dish.name}
                    </h4>
                  </div>

                  {/* Price & Stepper Bar */}
                  <div className="flex items-center justify-between mt-3 pt-2">
                    <span className="font-extrabold text-[14px] text-[#0F172A]">
                      ${dish.price.toFixed(2)}
                    </span>

                    {/* Stepper matching Screenshot 1 (- 0 +) */}
                    <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-1.5 py-0.5">
                      <button
                        onClick={() => handleUpdateQty(dish, -1)}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] active:scale-95 transition-transform"
                      >
                        <Minus size={11} />
                      </button>

                      <span className="w-4 text-center font-extrabold text-[12px] text-[#0F172A]">
                        {qty}
                      </span>

                      <button
                        onClick={() => handleUpdateQty(dish, 1)}
                        className="w-5 h-5 rounded-full bg-[#00A389] text-white flex items-center justify-center hover:bg-[#008f77] active:scale-95 transition-transform shadow-2xs"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= RIGHT COLUMN: ORDER TICKET (Screenshot 1) ================= */}
      <div className="w-[340px] shrink-0 bg-white border-l border-[#F1F5F9] flex flex-col justify-between p-6 select-none h-full overflow-y-auto">
        <div className="space-y-5">
          {/* Ticket Header */}
          <div className="flex items-start justify-between pb-3 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[18px] text-[#0F172A] tracking-tight">
                  {selectedTable}
                </h3>
                <button
                  onClick={() => {
                    const newT = prompt('Nhập số bàn mới:', selectedTable);
                    if (newT) setSelectedTable(newT);
                  }}
                  className="text-[#94A3B8] hover:text-[#0F172A]"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={handleClearCart}
                  className="text-[#FF7A59] hover:text-[#EF4444]"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-[#64748B] mt-0.5 font-medium">
                <span>Order {orderNumber}</span>
                <span>•</span>
                <span>{guestCount} People</span>
              </div>
            </div>
          </div>

          {/* Ordered Items List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-extrabold text-[14px] text-[#0F172A]">
                Ordered Items
              </span>
              <span className="font-mono text-[12px] font-bold text-[#94A3B8]">
                {String(cart.reduce((s, i) => s + i.quantity, 0)).padStart(2, '0')}
              </span>
            </div>

            <div className="divide-y divide-[#F8FAFC] max-h-52 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-[#94A3B8] text-[12px]">
                  Chưa có món nào được chọn. Nhấp dấu &quot;+&quot; tại thực đơn để thêm món.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.dishId} className="py-2.5 flex items-center justify-between text-[12.5px]">
                    <div className="flex items-center gap-2 max-w-[190px]">
                      <span className="font-mono font-bold text-[#64748B]">{item.quantity}x</span>
                      <span className="font-semibold text-[#0F172A] truncate">{item.name}</span>
                    </div>
                    <span className="font-extrabold text-[#0F172A]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-[#F8FAFC] p-4 rounded-3xl border border-[#E2E8F0] space-y-2 text-[12.5px]">
            <h4 className="font-extrabold text-[13px] text-[#0F172A] mb-1">
              Payment Summery
            </h4>
            <div className="flex justify-between text-[#64748B]">
              <span>Subtotal</span>
              <span className="font-bold text-[#0F172A]">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Tax (8%)</span>
              <span className="font-bold text-[#0F172A]">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Donation for Palestine</span>
              <span className="font-bold text-[#0F172A]">${donation.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center text-[15px] font-black text-[#0F172A]">
              <span>Total Payable</span>
              <span className="text-[#00A389]">${totalPayable.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector (Screenshot 1: Cash, Card, Scan) */}
          <div className="space-y-2">
            <span className="font-extrabold text-[13px] text-[#0F172A] block">
              Payment Method
            </span>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'scan', label: 'Scan', icon: QrCode },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`h-11 rounded-2xl flex items-center justify-center gap-1.5 text-[12px] font-extrabold transition-all ${
                      isSelected
                        ? 'bg-white border-2 border-[#00A389] text-[#00A389] shadow-2xs'
                        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions: Print & Place Order */}
        <div className="pt-4 border-t border-[#F1F5F9] space-y-2">
          {orderSuccessToast && (
            <div className="p-2.5 bg-[#E6F7F4] border border-[#00A389]/30 rounded-2xl text-[12px] font-bold text-[#00A389] flex items-center justify-center gap-1.5 animate-in fade-in">
              <Check size={14} />
              <span>Đã tạo đơn #{orderNumber} thành công!</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="h-12 px-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#0F172A] font-extrabold text-[13px] flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || cart.length === 0}
              className="flex-1 h-12 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-black text-[13.5px] flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles size={16} />
              <span>{isSubmitting ? 'Đang tạo đơn...' : 'Place Order'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bill Print Thermal Modal */}
      <BillPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tableNumber={selectedTable}
        orderNumber={orderNumber}
        items={cart}
        subtotal={subtotal}
        tax={tax}
        donation={donation}
        total={totalPayable}
        paymentMethod={paymentMethod}
      />

      {/* VietQR Scan Modal */}
      <VietQRModal
        isOpen={isVietQRModalOpen}
        onClose={() => setIsVietQRModalOpen(false)}
        onSuccess={() => {
          setIsVietQRModalOpen(false);
          setOrderSuccessToast(true);
          setTimeout(() => {
            setOrderSuccessToast(false);
            setCart([]);
          }, 1500);
        }}
        totalUsd={totalPayable}
        orderNumber={orderNumber}
        tableNumber={selectedTable}
      />
    </div>
  );
};

export default OrderLineView;
