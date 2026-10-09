'use client';

import React, { useState, useMemo } from 'react';
import { MenuItemView } from '../hooks/useMenuSoldOut';
import { Plus, Search, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useI18n } from '../../../context/i18nContext';

interface MenuItemListProps {
  items: MenuItemView[];
  categories: Array<{ id: string; name: string }>;
  onSelectItem: (item: MenuItemView) => void;
  primaryColor?: string;
}

export function MenuItemList({
  items,
  categories,
  onSelectItem,
  primaryColor = '#00A389',
}: MenuItemListProps) {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.categoryId === selectedCategory;
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  return (
    <div className="space-y-3.5">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('menu.searchPlaceholder', 'Tìm món ngon, đồ uống...')}
          className="w-full bg-white border border-[#E2E8F0] rounded-2xl pl-10 pr-4 py-2.5 text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#00A389] shadow-2xs transition"
        />
      </div>

      {/* Horizontal Category Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-[#00A389] text-white shadow-xs'
              : 'bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]'
          }`}
        >
          {t('common.all', 'Tất cả')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-[#00A389] text-white shadow-xs'
                : 'bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items Grid: 2-col on mobile, 3-4 on tablet/desktop */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-[#94A3B8] flex flex-col items-center justify-center bg-white rounded-2xl border border-[#E2E8F0]">
          <AlertCircle className="w-8 h-8 mb-2 opacity-50 text-[#94A3B8]" />
          <p className="text-[13px] font-bold">{t('menu.noMatch', 'Không tìm thấy món phù hợp')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {filteredItems.map((item, index) => {
            const isPriority = index < 4;
            return (
              <div
                key={item.id}
                className="group relative bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:border-[#00A389]/40 hover:shadow-xs shadow-2xs"
              >
                {/* Image Container */}
                <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      priority={isPriority}
                      fetchPriority={isPriority ? 'high' : undefined}
                      loading={isPriority ? undefined : 'lazy'}
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className={`object-cover transition duration-300 group-hover:scale-105 ${
                        item.isSoldOut ? 'grayscale contrast-125 opacity-40' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#94A3B8] text-xs font-bold">
                      MenuGO
                    </div>
                  )}

                  {/* Sold Out Overlay Badge */}
                  {item.isSoldOut && (
                    <div className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-2xs flex items-center justify-center">
                      <span className="px-2.5 py-1 bg-rose-500 text-white font-extrabold text-[10.5px] tracking-wider rounded-md uppercase shadow-xs">
                        {t('menu.soldOutUpper', 'HẾT HÀNG')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Container */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-[13px] text-[#0F172A] line-clamp-1 group-hover:text-[#00A389] transition-colors">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-[11px] text-[#64748B] line-clamp-2 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                    <span className="font-black text-[13.5px] text-[#00A389] font-mono">
                      {item.basePrice.toLocaleString('vi-VN')}đ
                    </span>

                    <button
                      type="button"
                      disabled={item.isSoldOut}
                      onClick={() => onSelectItem(item)}
                      style={{
                        backgroundColor: item.isSoldOut ? '#E2E8F0' : primaryColor,
                      }}
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all ${
                        item.isSoldOut
                          ? 'text-[#94A3B8] cursor-not-allowed'
                          : 'text-white hover:brightness-105 active:scale-95'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>
                        {item.modifierGroups && item.modifierGroups.length > 0
                          ? t('menu.customize', 'Tùy chọn')
                          : t('menu.add', 'Thêm')}
                      </span>
                    </button>
                  </div>
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
