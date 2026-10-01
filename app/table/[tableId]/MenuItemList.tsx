'use client';

import React, { useState, useMemo } from 'react';
import { MenuItemView } from '../hooks/useMenuSoldOut';
import { Plus, Search, AlertCircle } from 'lucide-react';
import Image from 'next/image';

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
  primaryColor = '#f59e0b',
}: MenuItemListProps) {
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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm món ngon, đồ uống..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition"
        />
      </div>

      {/* Horizontal Category Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items Grid: 2-col on mobile, 3-4 on tablet/desktop */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">Không tìm thấy món phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredItems.map((item) => {
            return (
              <div
                key={item.id}
                className="group relative bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col transition hover:border-zinc-700 shadow-sm"
              >
                {/* Image Container */}
                <div className="relative aspect-square w-full bg-zinc-800 overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className={`object-cover transition duration-300 group-hover:scale-105 ${
                        item.isSoldOut ? 'grayscale contrast-125 opacity-40' : ''
                      }`}
                      sizes="(max-width: 640px) 50vw, 250px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                      No Image
                    </div>
                  )}

                  {/* Sold Out Overlay */}
                  {item.isSoldOut && (
                    <div className="absolute inset-0 bg-red-950/70 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-red-600 text-white font-bold text-xs uppercase px-2.5 py-1 rounded-md tracking-wider shadow">
                        Hết Hàng
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Container */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-zinc-100 line-clamp-1 group-hover:text-amber-400 transition">
                      {item.name}
                    </h4>
                    {item.description && (
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-sm text-amber-400">
                      {item.basePrice.toLocaleString('vi-VN')}đ
                    </span>
                    <button
                      type="button"
                      disabled={item.isSoldOut}
                      onClick={() => onSelectItem(item)}
                      style={{ backgroundColor: item.isSoldOut ? undefined : primaryColor }}
                      className={`p-1.5 rounded-xl transition ${
                        item.isSoldOut
                          ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                          : 'text-zinc-950 font-bold active:scale-90 hover:brightness-110 shadow-sm'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
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
