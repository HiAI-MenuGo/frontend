'use client';

import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  LayoutGrid,
  List,
  MoreHorizontal,
  Check,
  Trash2,
  Edit,
  Ban,
  Sparkles,
} from 'lucide-react';
import { DishItem, CategoryItem, INITIAL_CATEGORIES, INITIAL_DISHES } from './mockData';
import { AddDishModal } from './AddDishModal';
import { AddCategoryModal } from './AddCategoryModal';

interface ManageDishesViewProps {
  categories?: CategoryItem[];
  dishes?: DishItem[];
  searchQuery?: string;
  onAddDish?: (dish: DishItem) => void;
  onAddCategory?: (cat: CategoryItem) => void;
  onDeleteDish?: (id: string) => void;
  onToggleSoldOut?: (id: string) => void;
}

export const ManageDishesView: React.FC<ManageDishesViewProps> = ({
  categories: propCategories,
  dishes: propDishes,
  searchQuery: externalSearchQuery = '',
  onAddDish: propAddDish,
  onAddCategory: propAddCategory,
  onDeleteDish: propDeleteDish,
  onToggleSoldOut: propToggleSoldOut,
}) => {
  const [localCategories, setLocalCategories] = useState<CategoryItem[]>(propCategories || INITIAL_CATEGORIES);
  const [localDishes, setLocalDishes] = useState<DishItem[]>(propDishes || INITIAL_DISHES);
  const [selectedCategory, setSelectedCategory] = useState<string>('Desserts');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);
  const [activeMenuDishId, setActiveMenuDishId] = useState<string | null>(null);

  const activeSearch = externalSearchQuery || localSearchQuery;

  const handleAddDish = (dish: DishItem) => {
    setLocalDishes((prev) => [dish, ...prev]);
    if (propAddDish) propAddDish(dish);
  };

  const handleAddCategory = (cat: CategoryItem) => {
    setLocalCategories((prev) => [...prev, cat]);
    if (propAddCategory) propAddCategory(cat);
  };

  const handleDeleteDish = (id: string) => {
    setLocalDishes((prev) => prev.filter((d) => d.id !== id));
    if (propDeleteDish) propDeleteDish(id);
  };

  const handleToggleSoldOut = (id: string) => {
    setLocalDishes((prev) => prev.map((d) => (d.id === id ? { ...d, isSoldOut: !d.isSoldOut } : d)));
    if (propToggleSoldOut) propToggleSoldOut(id);
  };

  // Filter dishes by category and search
  const filteredDishes = localDishes.filter((dish) => {
    const matchesCategory =
      selectedCategory === 'All Dishes' ||
      dish.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !activeSearch ||
      dish.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      dish.category.toLowerCase().includes(activeSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleSelectDish = (id: string) => {
    setSelectedDishIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const currentCategoryCount =
    selectedCategory === 'All Dishes'
      ? localDishes.length
      : localDishes.filter(
          (d) => d.category.toLowerCase() === selectedCategory.toLowerCase()
        ).length;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ================= LEFT SUB-PANEL: DISHES CATEGORY (Screenshot 3) ================= */}
      <div className="w-[280px] shrink-0 bg-white border-r border-[#F1F5F9] flex flex-col justify-between p-6 select-none h-full overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-[18px] font-black text-[#0F172A] tracking-tight mb-2">
            Dishes Category
          </h3>

          <div className="space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {localCategories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-[13px] font-extrabold transition-all text-left ${
                    isActive
                      ? 'bg-white border-2 border-[#00A389] text-[#00A389] shadow-xs'
                      : 'bg-transparent border border-transparent text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[17px]">{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                      isActive ? 'bg-[#00A389] text-white' : 'text-[#94A3B8]'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA: + Add New Category (Screenshot 3) */}
        <div className="pt-4 border-t border-[#F1F5F9]">
          <button
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="w-full h-12 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-black text-[13px] flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* ================= RIGHT AREA: MANAGE DISHES GRID (Screenshot 3) ================= */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-[22px] font-black text-[#0F172A] tracking-tight">
              Manage Dishes
            </h2>
            <p className="text-[12px] text-[#64748B]">
              Cập nhật giá, thêm công thức và kiểm soát trạng thái món ăn
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Dishes Bar */}
            <div className="relative w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                placeholder="Search dishes"
                className="w-full h-11 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#00A389]"
              />
            </div>

            {/* + Add New Dishes CTA */}
            <button
              onClick={() => setIsAddDishModalOpen(true)}
              className="h-11 px-5 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13.5px] flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Plus size={16} />
              <span>Add New Dishes</span>
            </button>
          </div>
        </div>

        {/* Sub-Header: Category Title & View/Filter Switcher */}
        <div className="flex items-center justify-between">
          <h3 className="font-black text-[18px] text-[#0F172A]">
            {selectedCategory} ({currentCategoryCount})
          </h3>

          <div className="flex items-center gap-2">
            {/* Grid / List Switcher */}
            <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl p-1 shadow-2xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === 'grid' ? 'bg-[#00A389] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === 'list' ? 'bg-[#00A389] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <List size={16} />
              </button>
            </div>

            {/* Filter Button */}
            <button className="h-9 px-3.5 bg-white border border-[#E2E8F0] rounded-2xl text-[12px] font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5 shadow-2xs">
              <SlidersHorizontal size={14} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Dish Cards Grid (Screenshot 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {/* Card 1: Dashed "+ Add New Dish to [Category]" Card */}
          <div
            onClick={() => setIsAddDishModalOpen(true)}
            className="min-h-[220px] rounded-3xl border-2 border-dashed border-[#00A389] bg-[#E6F7F4]/30 hover:bg-[#E6F7F4]/60 cursor-pointer flex flex-col items-center justify-center p-6 text-center transition-all group select-none shadow-2xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#00A389] text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
              <Plus size={22} />
            </div>
            <span className="font-extrabold text-[14px] text-[#00A389]">
              Add New Dish to {selectedCategory}
            </span>
          </div>

          {/* Catalog Dish Cards */}
          {filteredDishes.map((dish) => {
            const isSelected = selectedDishIds.includes(dish.id);
            const isMenuOpen = activeMenuDishId === dish.id;

            return (
              <div
                key={dish.id}
                className={`bg-white rounded-3xl p-4 border transition-all duration-200 relative group shadow-2xs flex flex-col justify-between ${
                  dish.isSoldOut ? 'opacity-60 border-[#CBD5E1]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                {/* Top Row: Checkbox + 3-dots Menu */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleSelectDish(dish.id)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#00A389] border-[#00A389] text-white'
                        : 'border-[#CBD5E1] bg-white hover:border-[#00A389]'
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuDishId(isMenuOpen ? null : dish.id)}
                      className="w-7 h-7 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] hover:border-[#CBD5E1]"
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {/* 3-dots Dropdown Actions */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-8 w-36 bg-white rounded-2xl border border-[#E2E8F0] shadow-lg py-1.5 z-30 animate-in fade-in">
                        <button
                          onClick={() => {
                            handleToggleSoldOut(dish.id);
                            setActiveMenuDishId(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-[12px] font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-2"
                        >
                          <Ban size={13} />
                          <span>{dish.isSoldOut ? 'Bật bán lại' : 'Báo hết món'}</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteDish(dish.id);
                            setActiveMenuDishId(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-[12px] font-bold text-[#EF4444] hover:bg-[#FEF2F2] flex items-center gap-2"
                        >
                          <Trash2 size={13} />
                          <span>Xóa món</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Circular Dish Image */}
                <div className="flex justify-center my-2">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#F1F5F9] shadow-sm bg-[#F8FAFC]">
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                </div>

                {/* Meta & Price */}
                <div className="mt-2 text-left">
                  <span className="text-[11px] font-semibold text-[#94A3B8] block">
                    {dish.category}
                  </span>
                  <h4 className="font-extrabold text-[13px] text-[#0F172A] truncate">
                    {dish.name}
                  </h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[14px] text-[#0F172A]">
                      ${dish.price.toFixed(2)}
                    </span>
                    {dish.isSoldOut && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#EF4444]">
                        Hết hàng
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Dish Modal */}
      <AddDishModal
        isOpen={isAddDishModalOpen}
        onClose={() => setIsAddDishModalOpen(false)}
        categories={localCategories}
        defaultCategory={selectedCategory === 'All Dishes' ? 'Desserts' : selectedCategory}
        onAddDish={handleAddDish}
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onAddCategory={handleAddCategory}
      />
    </div>
  );
};

export default ManageDishesView;
