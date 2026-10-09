'use client';

import React, { useState } from 'react';
import { X, Plus, FolderPlus } from 'lucide-react';
import { CategoryItem } from './mockData';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (newCategory: CategoryItem) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddCategory,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍕');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCategory: CategoryItem = {
      id: `cat_${Date.now()}`,
      name: name.trim(),
      icon: icon.trim() || '🍽️',
      count: 0,
    };

    onAddCategory(newCategory);
    setName('');
    onClose();
  };

  const commonIcons = ['🍕', '🍔', '🍣', '🍜', '☕', '🍷', '🍰', '🥗', '🥩', '🍦', '🍲', '🥑'];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-full hover:bg-[#F8FAFC]"
        >
          <X size={18} />
        </button>

        <h3 className="font-extrabold text-[18px] text-[#0F172A] mb-1">
          Tạo Danh Mục Mới
        </h3>
        <p className="text-[12px] text-[#64748B] mb-5">
          Thêm nhóm món mới vào thực đơn nhà hàng
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">
              Tên Danh Mục *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Pizza & Pasta"
              className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#00A389] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">
              Chọn Biểu Tượng Emoji
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-16 h-11 text-center text-xl bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl focus:outline-none focus:border-[#00A389] focus:bg-white"
              />
              <span className="text-[11.5px] text-[#64748B]">
                Nhấp icon bên dưới hoặc nhập emoji tùy ý
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {commonIcons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`h-9 rounded-xl border flex items-center justify-center text-lg hover:bg-[#E6F7F4] transition-colors ${
                    icon === ic ? 'border-[#00A389] bg-[#E6F7F4]' : 'border-[#E2E8F0] bg-white'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
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
              <span>Thêm Nhóm</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
