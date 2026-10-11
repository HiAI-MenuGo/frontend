'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  MoreHorizontal,
  Trash2,
  Ban,
  Sparkles,
  Pencil,
  UtensilsCrossed,
  CheckCircle2,
  Layers,
  Flame,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  AlertTriangle,
  ArrowUpDown,
  Check,
  X,
} from 'lucide-react';
import {
  fetchMenuItems,
  toggleSoldOut,
  deriveCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  renameCategory,
} from '@/lib/api/menu.api';
import type { MenuItemDTO } from '@/lib/api/types';
import { useSearchStore } from '@/stores/search.store';
import { useHeaderStore } from '@/stores/header.store';
import { useBranchStore } from '@/stores/branch.store';
import { formatVND } from '@/lib/format';
import { AddDishModal } from './AddDishModal';

type StatusFilter = 'ALL' | 'ACTIVE' | 'SOLD_OUT' | 'POPULAR';
type SortOption = 'DEFAULT' | 'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC';

function getCategoryEmoji(catName: string): string {
  const lower = catName.toLowerCase();
  if (lower.includes('dessert') || lower.includes('tráng miệng') || lower.includes('bánh')) return '🍰';
  if (lower.includes('salad') || lower.includes('rau')) return '🥗';
  if (lower.includes('beef') || lower.includes('bò')) return '🥩';
  if (lower.includes('chicken') || lower.includes('gà')) return '🍗';
  if (lower.includes('pork') || lower.includes('heo')) return '🥓';
  if (lower.includes('seafood') || lower.includes('hải sản') || lower.includes('tôm') || lower.includes('cá')) return '🦐';
  if (lower.includes('pasta') || lower.includes('mì') || lower.includes('nui')) return '🍝';
  if (lower.includes('rice') || lower.includes('cơm')) return '🍚';
  if (lower.includes('soup') || lower.includes('canh') || lower.includes('cháo')) return '🍲';
  if (lower.includes('drink') || lower.includes('nước') || lower.includes('trà') || lower.includes('cà phê') || lower.includes('coffee')) return '🥤';
  if (lower.includes('pizza')) return '🍕';
  if (lower.includes('burger')) return '🍔';
  if (lower.includes('lunch') || lower.includes('trưa') || lower.includes('chính')) return '🍱';
  return '🍽️';
}

export default function ManageDishesView() {
  const globalSearch = useSearchStore((s) => s.query);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [dishes, setDishes] = useState<MenuItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('Tất cả món');
  const [categorySearch, setCategorySearch] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const [showAdd, setShowAdd] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItemDTO | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Toast thông báo tương tác
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3000);
  };

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const branchParam = selectedBranchId === 'ALL' ? 'ALL' : selectedBranchId;
      const data = await fetchMenuItems(branchParam);
      setDishes(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được thực đơn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Cấu hình Top Action Header
  const setCustomAction = useHeaderStore((s) => s.setCustomAction);

  useEffect(() => {
    setCustomAction(
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="relative w-40 sm:w-56 md:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="tìm kiếm..."
            className="w-full h-10 pl-9 pr-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[12.5px] font-medium focus:bg-white focus:outline-hidden focus:border-[#00A389] transition-all"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="h-10 px-4 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center gap-1.5 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98] shrink-0 cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Thêm món mới</span>
        </button>

        <div className="flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-1 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'grid' ? 'bg-[#00A389] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            title="Dạng lưới"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-[#00A389] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
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

  // Thống kê tổng hợp số liệu
  const stats = useMemo(() => {
    const total = dishes.length;
    const active = dishes.filter((d) => !d.isSoldOut).length;
    const soldOut = dishes.filter((d) => d.isSoldOut).length;
    const popular = dishes.filter((d) => d.isPopular).length;
    return { total, active, soldOut, popular };
  }, [dishes]);

  // Lọc danh mục theo từ khóa tìm kiếm trong sidebar
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase().trim();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  // Lọc & Sắp xếp danh sách món ăn
  const filteredDishes = useMemo(() => {
    const q = (globalSearch || localSearch).trim().toLowerCase();

    let list = dishes.filter((d) => {
      const catName = typeof d.category === 'string' ? d.category : (d.category as any)?.name || '';

      // 1. Lọc theo nhóm danh mục
      const matchCategory = selectedCategory === 'Tất cả món' || catName === selectedCategory;
      if (!matchCategory) return false;

      // 2. Lọc theo trạng thái
      if (statusFilter === 'ACTIVE' && d.isSoldOut) return false;
      if (statusFilter === 'SOLD_OUT' && !d.isSoldOut) return false;
      if (statusFilter === 'POPULAR' && !d.isPopular) return false;

      // 3. Lọc theo từ khóa tìm kiếm
      if (q) {
        const matchName = d.name.toLowerCase().includes(q);
        const matchCat = catName.toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }

      return true;
    });

    // Sắp xếp
    if (sortBy === 'NAME_ASC') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else if (sortBy === 'PRICE_ASC') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'PRICE_DESC') {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [dishes, selectedCategory, statusFilter, globalSearch, localSearch, sortBy]);

  const handleToggle = async (dish: MenuItemDTO) => {
    const newStatus = !dish.isSoldOut;
    try {
      const updated = await toggleSoldOut(dish.id, newStatus);
      setDishes((prev) => prev.map((d) => (d.id === dish.id ? updated : d)));
      showToast(
        newStatus ? `Đã báo hết món: "${dish.name}"` : `Đã mở bán lại món: "${dish.name}"`,
        newStatus ? 'info' : 'success'
      );
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Cập nhật trạng thái thất bại', 'error');
    } finally {
      setMenuOpen(null);
    }
  };

  const handleDeleteLocal = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa món "${name}" khỏi thực đơn?`)) return;
    try {
      await deleteMenuItem(id).catch(() => {});
      setDishes((prev) => prev.filter((d) => d.id !== id));
      showToast(`Đã xóa món "${name}" thành công`, 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Xóa món thất bại', 'error');
    } finally {
      setMenuOpen(null);
    }
  };

  const handleSaveDish = async (dishData: {
    name: string;
    category: string;
    price: number;
    imageUrl: string;
    description?: string;
    isPopular: boolean;
    prepTimeMinutes: number;
  }) => {
    if (editingDish) {
      try {
        const updated = await updateMenuItem(editingDish.id, {
          name: dishData.name,
          category: dishData.category,
          price: dishData.price,
          imageUrl: dishData.imageUrl,
          description: dishData.description,
          isPopular: dishData.isPopular,
        });
        setDishes((prev) => prev.map((d) => (d.id === editingDish.id ? updated : d)));
        showToast(`Đã cập nhật thông tin món "${dishData.name}"`, 'success');
      } catch {
        setDishes((prev) =>
          prev.map((d) =>
            d.id === editingDish.id
              ? {
                  ...d,
                  name: dishData.name,
                  category: dishData.category,
                  price: dishData.price,
                  imageUrl: dishData.imageUrl,
                  description: dishData.description,
                  isPopular: dishData.isPopular,
                }
              : d
          )
        );
        showToast(`Đã lưu cục bộ món "${dishData.name}"`, 'success');
      } finally {
        setEditingDish(null);
      }
    } else {
      try {
        const created = await createMenuItem(dishData);
        setDishes((prev) => [created, ...prev]);
        showToast(`Thêm mới món "${dishData.name}" thành công`, 'success');
      } catch {
        const fallback: MenuItemDTO = {
          id: `local_${Date.now()}`,
          name: dishData.name,
          category: dishData.category,
          price: dishData.price,
          imageUrl: dishData.imageUrl,
          isPopular: dishData.isPopular,
          isSoldOut: false,
          branchId: 'default-branch',
        };
        setDishes((prev) => [fallback, ...prev]);
        showToast(`Đã thêm món "${dishData.name}" (chế độ cục bộ)`, 'success');
      } finally {
        setShowAdd(false);
      }
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
    showToast(`Đã đổi tên nhóm "${oldName}" sang "${newName}"`, 'success');
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
        <RefreshCw size={24} className="animate-spin text-[#00A389]" />
        <span className="text-[13px] font-semibold">Đang tải danh sách thực đơn...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3.5 p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="font-bold text-[16px] text-slate-800">Không thể tải danh sách món</h3>
          <p className="text-[13px] text-slate-500 mt-1">{error}</p>
        </div>
        <button
          onClick={() => load(false)}
          className="px-5 py-2.5 bg-[#00A389] hover:bg-[#008f77] text-white rounded-xl text-[13px] font-bold transition-all shadow-sm cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F8FAFC] min-h-0 min-w-0">
      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-[13px] font-semibold animate-in slide-in-from-bottom duration-200">
          {toast.type === 'success' && <CheckCircle2 size={16} className="text-[#00A389]" />}
          {toast.type === 'info' && <Ban size={16} className="text-amber-400" />}
          {toast.type === 'error' && <AlertTriangle size={16} className="text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* CỘT TRÁI: DANH MỤC NHÓM MÓN                              */}
      {/* ======================================================== */}
      <div className="w-52 lg:w-64 xl:w-72 shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col h-full min-h-0 overflow-hidden select-none">
        {/* Header nhóm món */}
        <div className="p-4 sm:p-5 pb-3 border-b border-[#F1F5F9] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#E6F7F4] text-[#00A389] flex items-center justify-center">
                <Layers size={15} />
              </div>
              <h3 className="text-[15px] font-extrabold text-[#0F172A]">Nhóm món</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {categories.length - 1} nhóm
            </span>
          </div>

          {/* Ô tìm kiếm danh mục nhanh */}
          {categories.length > 6 && (
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="tìm kiếm..."
                className="w-full h-8 pl-8 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium focus:bg-white focus:outline-hidden focus:border-[#00A389] transition-all"
              />
            </div>
          )}
        </div>

        {/* Danh sách danh mục */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredCategories.map((cat) => {
            const isAll = cat.name === 'Tất cả món';
            const isSelected = selectedCategory === cat.name;
            const emoji = isAll ? '🍽️' : getCategoryEmoji(cat.name);

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-[#E6F7F4] text-[#00A389] shadow-2xs font-extrabold'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[15px] shrink-0">{emoji}</span>
                  <span className="truncate">{cat.name}</span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#00A389] text-white'
                      : 'bg-slate-100 text-[#64748B] group-hover:bg-slate-200'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}

          {filteredCategories.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-6">Không tìm thấy nhóm món</p>
          )}
        </div>

        {/* Nút thêm món nhanh ở footer sidebar */}
        <div className="p-3 border-t border-[#F1F5F9] bg-[#F8FAFC] shrink-0">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#00A389]/60 text-[#00A389] hover:bg-[#E6F7F4] text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Thêm món vào thực đơn</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CỘT PHẢI: KHU VỰC CHÍNH (STATS + BỘ LỌC + DANH SÁCH MÓN) */}
      {/* ======================================================== */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-5">
        {/* ======================================================== */}
        {/* 1. THẺ THỐNG KÊ TỔNG QUAN THỰC ĐƠN (KPI SUMMARY)          */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4 min-w-0">
          {/* Card: Tổng số món */}
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11.5px] font-bold text-[#64748B] uppercase tracking-wider">Tổng thực đơn</p>
              <h4 className="text-[22px] font-black text-[#0F172A] mt-0.5">{stats.total}</h4>
              <span className="text-[11px] text-[#94A3B8]">món trong thực đơn</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 flex items-center justify-center">
              <UtensilsCrossed size={20} />
            </div>
          </div>

          {/* Card: Đang phục vụ */}
          <div
            onClick={() => setStatusFilter((p) => (p === 'ACTIVE' ? 'ALL' : 'ACTIVE'))}
            className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
              statusFilter === 'ACTIVE'
                ? 'border-[#00A389] ring-2 ring-[#00A389]/20'
                : 'border-[#E2E8F0] hover:border-slate-300'
            }`}
          >
            <div>
              <p className="text-[11.5px] font-bold text-[#00A389] uppercase tracking-wider">Đang phục vụ</p>
              <h4 className="text-[22px] font-black text-[#0F172A] mt-0.5">{stats.active}</h4>
              <span className="text-[11px] text-emerald-600 font-semibold">Sẵn sàng gọi món</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>

          {/* Card: Tạm hết hàng */}
          <div
            onClick={() => setStatusFilter((p) => (p === 'SOLD_OUT' ? 'ALL' : 'SOLD_OUT'))}
            className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
              statusFilter === 'SOLD_OUT'
                ? 'border-rose-500 ring-2 ring-rose-500/20'
                : 'border-[#E2E8F0] hover:border-slate-300'
            }`}
          >
            <div>
              <p className="text-[11.5px] font-bold text-rose-600 uppercase tracking-wider">Tạm hết món</p>
              <h4 className="text-[22px] font-black text-[#0F172A] mt-0.5">{stats.soldOut}</h4>
              <span className="text-[11px] text-rose-500 font-semibold">Cần bổ sung kho</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <Ban size={20} />
            </div>
          </div>

          {/* Card: Món bán chạy */}
          <div
            onClick={() => setStatusFilter((p) => (p === 'POPULAR' ? 'ALL' : 'POPULAR'))}
            className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
              statusFilter === 'POPULAR'
                ? 'border-amber-500 ring-2 ring-amber-500/20'
                : 'border-[#E2E8F0] hover:border-slate-300'
            }`}
          >
            <div>
              <p className="text-[11.5px] font-bold text-amber-600 uppercase tracking-wider">Món bán chạy</p>
              <h4 className="text-[22px] font-black text-[#0F172A] mt-0.5">{stats.popular}</h4>
              <span className="text-[11px] text-amber-600 font-semibold">Món Hot yêu thích</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center">
              <Flame size={20} />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. THANH CÔNG CỤ: TABS LỌC TRẠNG THÁI & SẮP XẾP            */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl p-3 border border-[#E2E8F0] shadow-2xs flex flex-wrap items-center justify-between gap-3">
          {/* Tabs lọc trạng thái */}
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`h-9 px-3.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
              }`}
            >
              Tất cả ({dishes.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`h-9 px-3.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Đang bán ({stats.active})</span>
            </button>
            <button
              onClick={() => setStatusFilter('SOLD_OUT')}
              className={`h-9 px-3.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'SOLD_OUT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Tạm hết ({stats.soldOut})</span>
            </button>
            <button
              onClick={() => setStatusFilter('POPULAR')}
              className={`h-9 px-3.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'POPULAR'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
              }`}
            >
              <Flame size={13} className={statusFilter === 'POPULAR' ? 'text-white' : 'text-amber-500'} />
              <span>Bán chạy ({stats.popular})</span>
            </button>
          </div>

          {/* Sắp xếp & Làm mới */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2.5 h-9 text-[12px]">
              <ArrowUpDown size={13} className="text-[#64748B]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent border-none text-[#0F172A] font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="DEFAULT">Sắp xếp: Mặc định</option>
                <option value="NAME_ASC">Tên: A → Z</option>
                <option value="PRICE_ASC">Giá: Thấp → Cao</option>
                <option value="PRICE_DESC">Giá: Cao → Thấp</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="h-9 w-9 rounded-xl border border-[#E2E8F0] bg-white text-slate-600 hover:text-[#00A389] hover:border-[#00A389] flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
              title="Làm mới thực đơn"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. NỘI DUNG HIỂN THỊ DANH SÁCH MÓN ĂN                     */}
        {/* ======================================================== */}
        {filteredDishes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-12 text-center space-y-3 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] border border-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <UtensilsCrossed size={24} />
            </div>
            <div>
              <h4 className="font-bold text-[15px] text-[#0F172A]">Không tìm thấy món ăn nào</h4>
              <p className="text-[12.5px] text-[#94A3B8] mt-1 max-w-sm mx-auto">
                Không có món nào phù hợp với bộ lọc danh mục & trạng thái hiện tại.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('Tất cả món');
                setStatusFilter('ALL');
                setLocalSearch('');
              }}
              className="px-4 py-2 rounded-xl bg-[#E6F7F4] text-[#00A389] font-bold text-[12.5px] hover:bg-[#d0f2ec] transition-all cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* ======================================================== */
          /* 3A. GIAO DIỆN DẠNG BẢNG DANH SÁCH (LIST VIEW HIỆN ĐẠI)     */
          /* ======================================================== */
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xs overflow-hidden min-w-0">
            {/* Header Table */}
            <div className="hidden lg:grid grid-cols-12 gap-3 xl:gap-4 px-4 xl:px-6 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider items-center min-w-[720px]">
              <div className="col-span-5">Món ăn & Thực đơn</div>
              <div className="col-span-2 text-center">Danh mục</div>
              <div className="col-span-2 text-right">Đơn giá</div>
              <div className="col-span-1 text-center">Trạng thái</div>
              <div className="col-span-2 text-right pr-2">Thao tác</div>
            </div>

            {/* Danh sách các hàng món ăn */}
            <div className="divide-y divide-[#F1F5F9]">
              {filteredDishes.map((dish) => {
                const isSoldOut = dish.isSoldOut;
                const catName = typeof dish.category === 'string' ? dish.category : (dish.category as any)?.name || 'Món khác';

                return (
                  <div
                    key={dish.id}
                    className={`p-4 lg:px-5 xl:px-6 lg:py-4 flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-3 xl:gap-4 items-start lg:items-center hover:bg-[#F8FAFC]/80 transition-colors group min-w-0 ${
                      isSoldOut ? 'bg-slate-50/50 opacity-80' : ''
                    }`}
                  >
                    {/* Cột 1: Ảnh món + Tên món + Badges */}
                    <div className="col-span-5 flex items-center gap-3.5 min-w-0 w-full">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] shrink-0 shadow-2xs group-hover:shadow-xs transition-shadow">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        {isSoldOut && (
                          <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px] flex items-center justify-center">
                            <span className="text-[9.5px] font-black text-white uppercase px-1 py-0.5 bg-red-600 rounded">
                              Hết
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-[14.5px] text-[#0F172A] leading-snug group-hover:text-[#00A389] transition-colors truncate">
                            {dish.name}
                          </h4>
                          {dish.isPopular && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 text-[9.5px] font-black shrink-0">
                              <Flame size={10} className="fill-amber-400 text-amber-500" />
                              <span>Bán chạy</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-[#94A3B8] font-medium mt-0.5 truncate">
                          Mã món: <span className="font-mono text-slate-600">{dish.id.slice(0, 8)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Cột 2: Nhóm danh mục */}
                    <div className="col-span-2 text-left md:text-center w-full md:w-auto">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[12px] font-bold bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
                        <span>{getCategoryEmoji(catName)}</span>
                        <span>{catName}</span>
                      </span>
                    </div>

                    {/* Cột 3: Giá bán */}
                    <div className="col-span-2 text-left md:text-right w-full md:w-auto">
                      <span className="font-black text-[15.5px] text-[#00A389] font-mono tracking-tight">
                        {formatVND(dish.price)}
                      </span>
                    </div>

                    {/* Cột 4: Trạng thái (Đang bán / Hết hàng) */}
                    <div className="col-span-1 text-left md:text-center w-full md:w-auto">
                      {isSoldOut ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Hết món</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Đang bán</span>
                        </span>
                      )}
                    </div>

                    {/* Cột 5: Hành động nhanh (Báo hết, Sửa, Xóa) */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {/* Nút Báo hết / Bật bán */}
                      <button
                        type="button"
                        onClick={() => handleToggle(dish)}
                        className={`h-8.5 px-3 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                          isSoldOut
                            ? 'bg-[#00A389] hover:bg-[#008f77] text-white shadow-[#00A389]/20'
                            : 'bg-white hover:bg-rose-50 border border-[#E2E8F0] hover:border-rose-200 text-[#475569] hover:text-rose-600'
                        }`}
                        title={isSoldOut ? 'Mở bán lại món này' : 'Báo tạm hết món này'}
                      >
                        {isSoldOut ? (
                          <>
                            <CheckCircle2 size={13} strokeWidth={2.5} />
                            <span>Mở bán lại</span>
                          </>
                        ) : (
                          <>
                            <Ban size={13} />
                            <span>Báo hết</span>
                          </>
                        )}
                      </button>

                      {/* Nút Sửa */}
                      <button
                        type="button"
                        onClick={() => setEditingDish(dish)}
                        className="w-8.5 h-8.5 rounded-xl border border-[#E2E8F0] hover:border-[#00A389] hover:bg-[#E6F7F4] text-[#64748B] hover:text-[#00A389] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Chỉnh sửa thông tin món"
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Nút Xóa */}
                      <button
                        type="button"
                        onClick={() => handleDeleteLocal(dish.id, dish.name)}
                        className="w-8.5 h-8.5 rounded-xl border border-[#E2E8F0] hover:border-rose-200 hover:bg-rose-50 text-[#64748B] hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Xóa món khỏi thực đơn"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* 3B. GIAO DIỆN DẠNG LƯỚI CARD (GRID VIEW HIỆN ĐẠI)          */
          /* ======================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredDishes.map((dish) => {
              const isSoldOut = dish.isSoldOut;
              const catName = typeof dish.category === 'string' ? dish.category : (dish.category as any)?.name || 'Món khác';

              return (
                <div
                  key={dish.id}
                  className={`bg-white rounded-3xl p-3.5 border relative flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group ${
                    isSoldOut ? 'border-slate-200 opacity-80' : 'border-[#E2E8F0] hover:border-[#00A389]/40'
                  }`}
                >
                  {/* Container Ảnh & Badge */}
                  <div className="relative w-full h-[145px] sm:h-[155px] rounded-2xl overflow-hidden bg-[#F8FAFC] mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Badge Hot */}
                    {dish.isPopular && (
                      <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-1 px-2 py-0.5 rounded-lg z-10 shadow-xs">
                        <Flame size={11} className="fill-white" />
                        <span className="text-[10px] font-black tracking-wide uppercase">Bán chạy</span>
                      </div>
                    )}

                    {/* Overlay Hết món */}
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="px-3 py-1 bg-red-600 text-white text-[11.5px] font-black rounded-xl shadow-md uppercase tracking-wider">
                          Tạm hết món
                        </span>
                      </div>
                    )}

                    {/* Menu thao tác nhanh góc trên */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <button
                        onClick={() => setMenuOpen(menuOpen === dish.id ? null : dish.id)}
                        className="w-7.5 h-7.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white shadow-xs cursor-pointer"
                        title="Tùy chọn"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {menuOpen === dish.id && (
                        <div className="absolute right-0 top-9 w-40 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDish(dish);
                              setMenuOpen(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-[12.5px] font-bold text-[#0F172A] hover:bg-[#F8FAFC] flex gap-2 items-center cursor-pointer"
                          >
                            <Pencil size={13} className="text-[#00A389]" />
                            <span>Sửa thông tin</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(dish)}
                            className="w-full px-3.5 py-2 text-left text-[12.5px] font-bold text-[#64748B] hover:bg-[#F8FAFC] flex gap-2 items-center cursor-pointer"
                          >
                            <Ban size={13} />
                            <span>{isSoldOut ? 'Mở bán lại' : 'Báo hết món'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLocal(dish.id, dish.name)}
                            className="w-full px-3.5 py-2 text-left text-[12.5px] font-bold text-rose-600 hover:bg-rose-50 flex gap-2 items-center cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Xóa món</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thông tin món */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1">
                      <span>{getCategoryEmoji(catName)}</span>
                      <span>{catName}</span>
                    </span>
                    <h4 className="font-extrabold text-[14.5px] text-[#0F172A] line-clamp-1 leading-snug mt-1 group-hover:text-[#00A389] transition-colors" title={dish.name}>
                      {dish.name}
                    </h4>
                  </div>

                  {/* Footer card: Giá tiền & Toggle Báo hết */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                    <span className="font-black text-[15.5px] text-[#00A389] font-mono">
                      {formatVND(dish.price)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggle(dish)}
                      className={`h-8 px-2.5 rounded-xl text-[11.5px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                        isSoldOut
                          ? 'bg-[#00A389] hover:bg-[#008f77] text-white shadow-xs shadow-[#00A389]/20'
                          : 'bg-[#F8FAFC] hover:bg-rose-50 border border-[#E2E8F0] hover:border-rose-200 text-[#64748B] hover:text-rose-600'
                      }`}
                    >
                      {isSoldOut ? (
                        <>
                          <CheckCircle2 size={12} strokeWidth={2.5} />
                          <span>Bật bán</span>
                        </>
                      ) : (
                        <>
                          <Ban size={12} />
                          <span>Báo hết</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL THÊM / CHỈNH SỬA MÓN ĂN                             */}
      {/* ======================================================== */}
      <AddDishModal
        isOpen={showAdd || Boolean(editingDish)}
        initialDish={editingDish}
        onClose={() => {
          setShowAdd(false);
          setEditingDish(null);
        }}
        categories={categories.filter((c) => c.name !== 'Tất cả món').map((c) => c.name)}
        onSave={handleSaveDish}
        onRenameCategory={handleRenameCategory}
      />
    </div>
  );
}
