'use client';

import React, { useState } from 'react';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import { DishItem, CategoryItem } from './mockData';

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  defaultCategory?: string;
  onAddDish: (newDish: DishItem) => void;
}

export const AddDishModal: React.FC<AddDishModalProps> = ({
  isOpen,
  onClose,
  categories,
  defaultCategory = 'Desserts',
  onAddDish,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [price, setPrice] = useState('10.00');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=350&auto=format&fit=crop&q=80'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newDish: DishItem = {
      id: `d_${Date.now()}`,
      name: name.trim(),
      category: category,
      price: parseFloat(price) || 10.0,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=350&auto=format&fit=crop&q=80',
      isPopular: false,
    };

    onAddDish(newDish);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-full hover:bg-[#F8FAFC]"
        >
          <X size={18} />
        </button>

        <h3 className="font-extrabold text-[18px] text-[#0F172A] mb-1">
          Thêm Món Mới
        </h3>
        <p className="text-[12px] text-[#64748B] mb-5">
          Điền thông tin và hình ảnh đĩa thức ăn cho thực đơn
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">
              Tên Món Ăn *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Chocolate Fondant"
              className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#00A389] focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">
                Danh Mục
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#00A389] focus:bg-white transition-all"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">
                Giá Bán (USD) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#00A389] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">
              URL Hình Ảnh Đĩa Thức Ăn (Top-down)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#00A389] focus:bg-white transition-all"
            />
          </div>

          {/* Image Preview */}
          <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-[#CBD5E1] shrink-0 bg-white shadow-2xs">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=350&auto=format&fit=crop&q=80';
                }}
              />
            </div>
            <div className="text-[11.5px] text-[#64748B]">
              <span className="font-bold text-[#0F172A] block">Xem trước ảnh đĩa tròn</span>
              Ảnh sẽ hiển thị đồng bộ trên POS và bảng quản lý món
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] font-bold text-[#64748B] hover:bg-[#F1F5F9]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Plus size={16} />
              <span>Lưu Món Mới</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDishModal;
