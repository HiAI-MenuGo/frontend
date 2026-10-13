'use client';

import React, { useState, useMemo } from 'react';
import { MenuItemView } from '../hooks/useMenuSoldOut';
import { Plus, Minus, Search, AlertCircle, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import { useI18n } from '../../../context/i18nContext';
import useCartStore from '../../../stores/cart.store';

interface MenuItemListProps {
  items: MenuItemView[];
  categories: Array<{ id: string; name: string }>;
  onSelectItem: (item: MenuItemView) => void;
  primaryColor?: string;
  isLoading?: boolean;
}

export function MenuItemList({
  items,
  categories,
  onSelectItem,
  primaryColor = '#00A389',
  isLoading = false,
}: MenuItemListProps) {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { items: cartItems, addItem, updateQuantity, removeItem } = useCartStore();

  const getItemQuantity = (itemId: string) => {
    return cartItems
      .filter((c) => c.menuItemId === itemId)
      .reduce((sum, c) => sum + c.quantity, 0);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat =
        selectedCategory === 'all' ||
        item.categoryId === selectedCategory ||
        item.category?.name === selectedCategory ||
        item.category?.id === selectedCategory;

      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleQuickAdd = (e: React.MouseEvent, item: MenuItemView) => {
    e.stopPropagation();
    if (item.isSoldOut) return;

    // Nếu món có modifier groups -> mở modal tuỳ biến
    const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;
    if (hasModifiers) {
      onSelectItem(item);
      return;
    }

    // Nếu không có modifier -> thêm trực tiếp 1 món vào giỏ
    addItem({
      menuItemId: item.id,
      name: item.name,
      basePrice: item.basePrice,
      quantity: 1,
      selectedModifiers: [],
      imageUrl: item.imageUrl,
    });
  };

  const handleDecrease = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const target = cartItems.find((c) => c.menuItemId === itemId);
    if (!target) return;

    if (target.quantity > 1) {
      updateQuantity(target.cartItemId, target.quantity - 1);
    } else {
      removeItem(target.cartItemId);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Search Bar chuẩn Mobile */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-xl px-3.5 h-[42px] border border-[#E2E8F0] shadow-xs gap-2 focus-within:border-[#00A389] transition-all">
          <Search size={16} className="text-[#94A3B8] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('menu.searchPlaceholder', 'tìm kiếm...')}
            className="flex-1 bg-transparent text-[13.5px] text-[#0F172A] placeholder-[#94A3B8] font-medium outline-hidden"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Category Filter Pills chuẩn Mobile - Cân đối thẳng hàng */}
      <div className="overflow-x-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
        <div className="flex items-center gap-2 w-max">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`h-8 px-3.5 rounded-full text-[12.5px] transition-all whitespace-nowrap active:scale-95 inline-flex items-center justify-center shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#00A389] text-white font-bold shadow-xs'
                : 'bg-[#F1F5F9] hover:bg-slate-200 text-[#475569] font-semibold'
            }`}
          >
            {t('common.all', 'Tất cả')}
          </button>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id || selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`h-8 px-3.5 rounded-full text-[12.5px] transition-all whitespace-nowrap active:scale-95 inline-flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-[#00A389] text-white font-bold shadow-xs'
                    : 'bg-[#F1F5F9] hover:bg-slate-200 text-[#475569] font-semibold'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Item Grid (2-col Mobile) */}
      {isLoading && items.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-[18px] p-3 border border-[#E2E8F0] shadow-2xs space-y-2.5"
            >
              <div className="aspect-[4/3] w-full bg-slate-100 rounded-[13px]" />
              <div className="h-4 bg-slate-100 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
              <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                <div className="h-4 bg-slate-100 rounded-md w-1/3" />
                <div className="w-7 h-7 bg-slate-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-14 text-center text-[#94A3B8] flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-[#E2E8F0]">
          <AlertCircle className="w-9 h-9 mb-2 opacity-40 text-[#94A3B8]" />
          <p className="text-[13.5px] font-bold text-[#0F172A]">{t('menu.noMatch', 'Không tìm thấy món phù hợp')}</p>
          <p className="text-[12px] text-[#94A3B8] mt-1">Vui lòng thử tìm từ khoá khác hoặc chọn danh mục khác</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {filteredItems.map((item, index) => {
            const qty = getItemQuantity(item.id);
            const isPriority = index < 4;
            const hasModifiers = Boolean(item.modifierGroups && item.modifierGroups.length > 0);

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group bg-white rounded-[18px] p-3 border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between cursor-pointer active:scale-[0.98]"
              >
                {/* Badge Bán chạy */}
                {Boolean(item.isPopular) && !item.isSoldOut && (
                  <div className="absolute top-4.5 left-4.5 bg-[#EF4444] text-white flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] z-10 shadow-xs">
                    <Sparkles size={10} color="#FFFFFF" />
                    <span className="text-[9px] font-extrabold uppercase tracking-wide">Nổi bật</span>
                  </div>
                )}

                {/* Image Container */}
                <div>
                  <div className="relative aspect-[4/3] w-full bg-[#F1F5F9] rounded-[13px] overflow-hidden mb-2">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        priority={isPriority}
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                          item.isSoldOut ? 'grayscale contrast-125 opacity-40' : ''
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#94A3B8] text-xs font-bold font-mono">
                        HiAI
                      </div>
                    )}

                    {/* Badge Hết hàng */}
                    {item.isSoldOut && (
                      <div className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-2xs flex items-center justify-center">
                        <span className="px-2.5 py-1 bg-rose-500 text-white font-black text-[10px] tracking-wider rounded-md uppercase shadow-xs">
                          {t('menu.soldOutUpper', 'HẾT HÀNG')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Category */}
                  <h3 className="text-[13.5px] font-bold text-[#0F172A] line-clamp-2 min-h-[36px] leading-tight group-hover:text-[#00A389] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5 mb-1.5 truncate">
                    {typeof item.category === 'object' && item.category !== null
                      ? item.category.name
                      : 'Món chính'}
                  </p>
                </div>

                {/* Footer: Giá & Nút Thêm / Stepper chuẩn Mobile */}
                <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-[#F8FAFC]">
                  <span className="text-[13.5px] font-extrabold text-[#008770] font-mono">
                    {item.basePrice.toLocaleString('vi-VN')}đ
                  </span>

                  {item.isSoldOut ? (
                    <span className="text-[10px] font-bold text-[#94A3B8] px-2 py-1 bg-slate-100 rounded-lg">
                      Tạm hết
                    </span>
                  ) : qty === 0 ? (
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, item)}
                      style={{ backgroundColor: primaryColor }}
                      className="w-[30px] h-[30px] rounded-full text-white flex items-center justify-center hover:brightness-105 active:scale-90 transition-all shadow-xs"
                      title={hasModifiers ? 'Tuỳ chọn món' : 'Thêm vào giỏ'}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  ) : (
                    <div
                      style={{ backgroundColor: primaryColor }}
                      className="flex items-center rounded-full px-1.5 py-[3px] gap-1.5 text-white shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleDecrease(e, item.id)}
                        className="p-0.5 active:scale-90 transition-transform"
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="text-[12px] font-extrabold min-w-[14px] text-center">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, item)}
                        className="p-0.5 active:scale-90 transition-transform"
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
  );
}

export default MenuItemList;
