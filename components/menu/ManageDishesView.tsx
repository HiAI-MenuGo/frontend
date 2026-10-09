'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, LayoutGrid, List, MoreHorizontal, Trash2, Ban, Sparkles } from 'lucide-react';
import { fetchMenuItems, toggleSoldOut, deriveCategories, createMenuItem, renameCategory } from '@/lib/api/menu.api';
import type { MenuItemDTO } from '@/lib/api/types';
import { useSearchStore } from '@/stores/search.store';
import { useHeaderStore } from '@/stores/header.store';
import { formatVND } from '@/lib/format';
import { AddDishModal } from './AddDishModal';

export default function ManageDishesView() {
  const globalSearch = useSearchStore((s) => s.query);
  const [dishes, setDishes] = useState<MenuItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả món');
  const [localSearch, setLocalSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdd, setShowAdd] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setDishes(await fetchMenuItems());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được món');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const setCustomAction = useHeaderStore((s) => s.setCustomAction);

  useEffect(() => {
    setCustomAction(
      <div className="flex items-center gap-2.5">
        <div className="relative w-44 sm:w-60">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm món..."
            className="w-full h-10 pl-9 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[12.5px] font-medium focus:bg-white focus:outline-none focus:border-[#00A389] transition-all"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="h-10 px-4 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center gap-1.5 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98] shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Thêm món mới</span>
        </button>
        <div className="flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#00A389] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            title="Dạng lưới"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[#00A389] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            title="Dạng danh sách"
          >
            <List size={15} />
          </button>
        </div>
      </div>
    );
    return () => setCustomAction(null);
  }, [setCustomAction, localSearch, viewMode]);

  const categories = useMemo(() => deriveCategories(dishes), [dishes]);
  const q = globalSearch || localSearch;
  const filtered = dishes.filter((d) => {
    const okCat = selectedCategory === 'Tất cả món' || d.category === selectedCategory;
    const okQ = !q || d.name.toLowerCase().includes(q.toLowerCase()) || d.category.toLowerCase().includes(q.toLowerCase());
    return okCat && okQ;
  });

  const handleToggle = async (dish: MenuItemDTO) => {
    try {
      const updated = await toggleSoldOut(dish.id, !dish.isSoldOut);
      setDishes((prev) => prev.map((d) => (d.id === dish.id ? updated : d)));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Cập nhật thất bại');
    } finally {
      setMenuOpen(null);
    }
  };

  const handleDeleteLocal = (id: string) => {
    if (!confirm('Xóa món này khỏi màn hình thực đơn?')) return;
    setDishes((prev) => prev.filter((d) => d.id !== id));
    setMenuOpen(null);
  };

  const handleSaveNewDish = async (newDish: {
    name: string;
    category: string;
    price: number;
    imageUrl: string;
    description?: string;
    isPopular: boolean;
    prepTimeMinutes: number;
  }) => {
    try {
      const created = await createMenuItem(newDish);
      setDishes((prev) => [created, ...prev]);
    } catch {
      const fallback: MenuItemDTO = {
        id: `local_${Date.now()}`,
        name: newDish.name,
        category: newDish.category,
        price: newDish.price,
        imageUrl: newDish.imageUrl,
        isPopular: newDish.isPopular,
        isSoldOut: false,
        branchId: 'default-branch',
      };
      setDishes((prev) => [fallback, ...prev]);
    }
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    setDishes((prev) =>
      prev.map((d) => (d.category === oldName ? { ...d, category: newName } : d))
    );
    if (selectedCategory === oldName) {
      setSelectedCategory(newName);
    }
    await renameCategory(oldName, newName);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-sm text-slate-500">Đang tải thực đơn...</div>;
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="font-bold">Không tải được món: {error}</p>
        <button onClick={load} className="px-5 py-2.5 bg-[#00A389] text-white rounded-xl text-sm font-semibold">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-[280px] shrink-0 bg-white border-r border-[#F1F5F9] flex flex-col justify-between p-6 h-full overflow-y-auto">
        <div className="space-y-2">
          <h3 className="text-[18px] font-black mb-2">Nhóm món</h3>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-[13px] font-extrabold cursor-pointer transition-colors ${selectedCategory === cat.name ? 'bg-white border-2 border-[#00A389] text-[#00A389]' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}
            >
              <span className="truncate">{cat.name}</span>
              <span className="text-[10.5px]">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 bg-white border rounded-3xl p-10 text-center">Không có món nào trong danh mục này.</p>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((dish) => (
              <div
                key={dish.id}
                className={`bg-white rounded-[22px] p-3.5 border relative flex flex-col justify-between shadow-xs hover:shadow-md transition-all group ${
                  dish.isSoldOut ? 'opacity-60 border-[#E2E8F0]' : 'border-[#E2E8F0]'
                }`}
              >
                <div className="relative w-full h-[140px] rounded-[16px] overflow-hidden bg-[#F8FAFC] mb-2.5">
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
                      <span className="text-white text-[9.5px] font-black tracking-wide">Bán chạy</span>
                    </div>
                  )}
                  {dish.isSoldOut && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
                        Hết hàng
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={() => setMenuOpen(menuOpen === dish.id ? null : dish.id)}
                      className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-xs border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white shadow-xs"
                      title="Thao tác"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {menuOpen === dish.id && (
                      <div className="absolute right-0 top-8 w-40 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-30">
                        <button
                          onClick={() => handleToggle(dish)}
                          className="w-full px-3 py-1.5 text-left text-[12px] font-bold text-[#64748B] hover:bg-[#F8FAFC] flex gap-2 items-center"
                        >
                          <Ban size={13} />
                          <span>{dish.isSoldOut ? 'Bật bán lại' : 'Báo hết món'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteLocal(dish.id)}
                          className="w-full px-3 py-1.5 text-left text-[12px] font-bold text-[#EF4444] hover:bg-[#FEF2F2] flex gap-2 items-center"
                        >
                          <Trash2 size={13} />
                          <span>Xóa món</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <span className="text-[11.5px] font-medium text-[#94A3B8]">{dish.category}</span>
                  <h4 className="font-bold text-[14px] text-[#0F172A] line-clamp-1 leading-snug mt-0.5" title={dish.name}>
                    {dish.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between mt-3 pt-1 border-t border-slate-100">
                  <span className="font-extrabold text-[15px] text-[#00A389]">{formatVND(dish.price)}</span>
                  <span
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${
                      dish.isSoldOut ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {dish.isSoldOut ? 'Hết hàng' : 'Đang bán'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border divide-y">
            {filtered.map((dish) => (
              <div key={dish.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dish.imageUrl} alt={dish.name} className="w-11 h-11 rounded-full object-cover border" />
                  <div>
                    <div className="font-bold text-sm">{dish.name}</div>
                    <div className="text-xs text-slate-400">{dish.category} • {formatVND(dish.price)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dish.isSoldOut && <span className="text-[10px] font-bold text-red-500">Hết hàng</span>}
                  <button onClick={() => handleToggle(dish)} className="px-3 py-1.5 rounded-xl border text-[12px] font-bold">{dish.isSoldOut ? 'Bật bán' : 'Báo hết'}</button>
                  <button onClick={() => handleDeleteLocal(dish.id)} className="p-2 text-red-500"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddDishModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        categories={categories.filter((c) => c.name !== 'Tất cả món').map((c) => c.name)}
        onSave={handleSaveNewDish}
        onRenameCategory={handleRenameCategory}
      />
    </div>
  );
}
