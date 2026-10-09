'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  X,
  Flame,
  ImageIcon,
  Link as LinkIcon,
  Pencil,
  Check,
} from 'lucide-react';
import { formatVND } from '@/lib/format';

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onSave: (item: {
    name: string;
    category: string;
    price: number;
    imageUrl: string;
    description?: string;
    isPopular: boolean;
    prepTimeMinutes: number;
  }) => Promise<void> | void;
  onRenameCategory?: (oldName: string, newName: string) => Promise<void> | void;
}

const PRESET_IMAGES = [
  { label: 'Pancake', url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&q=80' },
  { label: 'Salad bơ', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80' },
  { label: 'Bạc xỉu', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80' },
  { label: 'Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80' },
  { label: 'Trà đào', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80' },
  { label: 'Cà phê muối', url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&q=80' },
  { label: 'Trà sữa', url: 'https://images.unsplash.com/photo-1558857563-b37df2d2b512?w=500&q=80' },
];

export function AddDishModal({ isOpen, onClose, categories, onSave, onRenameCategory }: AddDishModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [localCategories, setLocalCategories] = useState<string[]>(categories);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[2].url);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showCustomUrl, setShowCustomUrl] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [prepTime, setPrepTime] = useState<number>(10);
  const [modifiers, setModifiers] = useState<string[]>([]);
  const [newModifier, setNewModifier] = useState('');
  const [showAddModifier, setShowAddModifier] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalCategories((prev) => Array.from(new Set([...categories, ...prev])));
  }, [categories]);

  useEffect(() => {
    if (isOpen) {
      setCategory('');
      setIsEditingCategory(false);
      setIsAddingCategory(false);
    }
  }, [isOpen]);

  const handleSelectCategory = (cat: string) => {
    if (category === cat) {
      // Bấm thêm 1 lần nữa để huỷ chọn
      setCategory('');
      setIsEditingCategory(false);
      setIsAddingCategory(false);
    } else {
      setCategory(cat);
      setIsEditingCategory(false);
      setIsAddingCategory(false);
    }
  };

  const handleStartEdit = () => {
    if (!category) return;
    setEditCategoryName(category);
    setIsEditingCategory(true);
    setIsAddingCategory(false);
  };

  const handleSaveEdit = async () => {
    const trimmed = editCategoryName.trim();
    if (!trimmed || !category) return;
    const oldName = category;
    if (trimmed !== oldName) {
      setLocalCategories((prev) => prev.map((c) => (c === oldName ? trimmed : c)));
      setCategory(trimmed);
      if (onRenameCategory) {
        await onRenameCategory(oldName, trimmed);
      }
    }
    setIsEditingCategory(false);
  };

  const handleStartAdd = () => {
    setNewCategoryName('');
    setIsAddingCategory(true);
    setIsEditingCategory(false);
  };

  const handleSaveAdd = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!localCategories.includes(trimmed)) {
      setLocalCategories((prev) => [...prev, trimmed]);
    }
    setCategory(trimmed);
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  if (!isOpen) return null;

  const parsedPrice = parseInt(price.replace(/[^0-9]/g, '') || '0', 10);

  const addQuickPrice = (amount: number) => {
    const current = parseInt(price.replace(/[^0-9]/g, '') || '0', 10);
    setPrice((current + amount).toString());
  };

  const handleAddModifier = () => {
    if (!newModifier.trim()) return;
    setModifiers((prev) => [...prev, newModifier.trim()]);
    setNewModifier('');
    setShowAddModifier(false);
  };

  const handleRemoveModifier = (index: number) => {
    setModifiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên món ăn');
      return;
    }
    if (parsedPrice <= 0) {
      alert('Vui lòng nhập giá bán lớn hơn 0đ');
      return;
    }

    const finalCategory = category.trim();
    if (!finalCategory) {
      alert('Vui lòng chọn hoặc thêm danh mục món ăn');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category: finalCategory,
        price: parsedPrice,
        imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
        description: description.trim() || undefined,
        isPopular,
        prepTimeMinutes: prepTime,
      });
      // reset
      setName('');
      setPrice('');
      setDescription('');
      setIsPopular(false);
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi lưu món ăn');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-2xl sm:max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-white border-b border-[#F1F5F9] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 hover:bg-slate-200 transition-colors"
              title="Quay lại"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-[19px] font-black text-[#0F172A] tracking-tight">
              Thêm Món Ăn Mới
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-7 py-5 space-y-5 text-left">
          {/* Tên món ăn & Giá bán (2 cột trên màn hình vừa và lớn) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tên món ăn */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 block">
                Tên món ăn <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center bg-white rounded-2xl border border-slate-300 px-3.5 py-2.5 focus-within:border-[#00A389] focus-within:ring-2 focus-within:ring-[#00A389]/20 transition-all shadow-2xs">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Cà Phê Muối Hoàng Gia, Trà Đào..."
                  className="flex-1 text-[13.5px] text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                />
                {name.length > 0 && (
                  <button onClick={() => setName('')} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Giá bán (VND) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-slate-700">
                  Giá bán (VND) <span className="text-rose-500">*</span>
                </label>
                {parsedPrice > 0 && (
                  <span className="text-[13px] font-extrabold text-[#00A389]">
                    {formatVND(parsedPrice)}
                  </span>
                )}
              </div>

              <div className="flex items-center bg-white rounded-2xl border border-slate-300 px-3.5 py-2.5 focus-within:border-[#00A389] focus-within:ring-2 focus-within:ring-[#00A389]/20 transition-all shadow-2xs">
                <span className="text-[15px] font-black text-[#00A389] mr-2">₫</span>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="VD: 35000"
                  className="flex-1 text-[13.5px] text-slate-900 placeholder:text-slate-400 bg-transparent outline-none font-medium"
                />
              </div>

              {/* Nút cộng nhanh */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                {[5000, 10000, 20000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => addQuickPrice(amt)}
                    className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[#00A389] font-bold text-[11px] hover:bg-emerald-100 transition-colors"
                  >
                    +{amt.toLocaleString('vi-VN')}đ
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Danh mục món */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-slate-700">
                Danh mục món <span className="text-rose-500">*</span>
              </label>
              {isEditingCategory || isAddingCategory ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCategory(false);
                    setIsAddingCategory(false);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  ← Hủy thao tác
                </button>
              ) : category ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="text-xs font-bold text-[#00A389] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Chỉnh sửa tên danh mục đang chọn"
                >
                  <Pencil size={12} />
                  <span>Sửa</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="text-xs font-bold text-[#00A389] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Thêm</span>
                </button>
              )}
            </div>

            {/* Khung sửa tên danh mục */}
            {isEditingCategory && (
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2 animate-in fade-in duration-150">
                <div className="text-[12px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <Pencil size={13} className="text-[#00A389]" />
                  <span>Đổi tên danh mục:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-white rounded-xl border border-slate-300 px-3 py-2 focus-within:border-[#00A389] focus-within:ring-2 focus-within:ring-[#00A389]/20 transition-all">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      placeholder="Nhập tên mới cho danh mục..."
                      className="flex-1 text-[13px] text-slate-900 bg-transparent outline-none font-bold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleSaveEdit();
                        } else if (e.key === 'Escape') {
                          setIsEditingCategory(false);
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSaveEdit()}
                    disabled={!editCategoryName.trim() || editCategoryName.trim() === category}
                    className="h-9 px-3.5 rounded-xl bg-[#00A389] hover:bg-[#008f77] disabled:opacity-40 text-white text-[12px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  >
                    <Check size={14} />
                    <span>Lưu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCategory(false)}
                    className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[12px] font-bold transition-all cursor-pointer shrink-0"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Khung thêm danh mục mới */}
            {isAddingCategory && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
                <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Plus size={13} className="text-[#00A389]" />
                  <span>Thêm danh mục mới:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-white rounded-xl border border-slate-300 px-3 py-2 focus-within:border-[#00A389] focus-within:ring-2 focus-within:ring-[#00A389]/20 transition-all">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="VD: Trà Trái Cây, Sinh Tố..."
                      className="flex-1 text-[13px] text-slate-900 bg-transparent outline-none font-bold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveAdd();
                        } else if (e.key === 'Escape') {
                          setIsAddingCategory(false);
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveAdd}
                    disabled={!newCategoryName.trim()}
                    className="h-9 px-3.5 rounded-xl bg-[#00A389] hover:bg-[#008f77] disabled:opacity-40 text-white text-[12px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  >
                    <Check size={14} />
                    <span>Thêm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[12px] font-bold transition-all cursor-pointer shrink-0"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Danh sách các pill danh mục */}
            <div className="flex items-center gap-2 flex-wrap pb-1">
              {localCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] shrink-0 transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-emerald-50 border-2 border-[#00A389] text-[#00A389] font-extrabold shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 font-semibold hover:border-slate-300'
                  }`}
                  title={category === cat ? 'Bấm để huỷ chọn' : 'Bấm để chọn danh mục'}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tuỳ chỉnh món */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-slate-700">Tuỳ chỉnh món</label>
              <button
                type="button"
                onClick={() => setShowAddModifier(true)}
                className="text-xs font-bold text-[#00A389] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Thêm</span>
              </button>
            </div>

            {showAddModifier && (
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <input
                  type="text"
                  value={newModifier}
                  onChange={(e) => setNewModifier(e.target.value)}
                  placeholder="VD: Size L (+10k), Ít đường, Thêm trân châu..."
                  className="flex-1 text-[12.5px] px-3 py-1.5 bg-white border border-slate-300 rounded-xl outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddModifier}
                  className="px-3 py-1.5 bg-[#00A389] text-white text-xs font-bold rounded-xl"
                >
                  Thêm
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModifier(false)}
                  className="p-1.5 text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {modifiers.length === 0 ? (
                <div className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-dashed border-slate-300 text-slate-400 text-xs font-medium">
                  Chưa có tuỳ chỉnh
                </div>
              ) : (
                modifiers.map((mod, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[12px] font-bold text-slate-700 shrink-0"
                  >
                    <span>{mod}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveModifier(idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Thời gian chế biến */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-slate-700">Thời gian chế biến</label>
              <span className="text-xs font-bold text-[#00A389]">{prepTime} phút</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap pb-1">
              {[5, 7, 10, 12, 15, 20, 30].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPrepTime(m)}
                  className={`px-3 py-1.5 rounded-full border text-[12px] shrink-0 transition-all ${
                    prepTime === m
                      ? 'bg-emerald-50 border-[#00A389] text-[#00A389] font-extrabold'
                      : 'bg-white border-slate-200 text-slate-600 font-semibold hover:border-slate-300'
                  }`}
                >
                  {m} phút
                </button>
              ))}
            </div>
          </div>

          {/* Ảnh minh hoạ */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">Ảnh minh hoạ</label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setShowImagePicker(!showImagePicker); setShowCustomUrl(false); }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#00A389] text-[12.5px] font-bold hover:bg-emerald-100 transition-colors"
              >
                <ImageIcon size={15} />
                <span>Thư viện ảnh mẫu</span>
              </button>
              <button
                type="button"
                onClick={() => { setShowCustomUrl(!showCustomUrl); setShowImagePicker(false); }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#00A389] text-[12.5px] font-bold hover:bg-emerald-100 transition-colors"
              >
                <LinkIcon size={15} />
                <span>Nhập URL ảnh</span>
              </button>
            </div>

            {showImagePicker && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 grid grid-cols-4 gap-2">
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img.label}
                    type="button"
                    onClick={() => { setImageUrl(img.url); setShowImagePicker(false); }}
                    className={`rounded-xl overflow-hidden border-2 relative transition-all ${
                      imageUrl === img.url ? 'border-[#00A389] ring-2 ring-[#00A389]/20' : 'border-transparent'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.label} className="w-full h-14 object-cover" />
                    <span className="block text-[10px] font-bold text-center py-0.5 truncate bg-white">
                      {img.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showCustomUrl && (
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="Dán đường dẫn ảnh: https://..."
                  className="flex-1 text-[12.5px] px-3 py-1.5 bg-white border border-slate-300 rounded-xl outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrlInput.trim()) {
                      setImageUrl(customUrlInput.trim());
                      setShowCustomUrl(false);
                      setCustomUrlInput('');
                    }
                  }}
                  className="px-3 py-1.5 bg-[#00A389] text-white text-xs font-bold rounded-xl"
                >
                  Xác nhận
                </button>
              </div>
            )}

            {imageUrl ? (
              <div className="flex items-center bg-white rounded-2xl p-2.5 border border-emerald-200 gap-3 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-100" />
                <div className="flex-1">
                  <span className="block text-[13px] font-bold text-slate-900">Ảnh đã chọn</span>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-[12px] font-bold text-[#00A389] hover:underline"
                  >
                    Xoá ảnh
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center border border-dashed border-slate-300 rounded-2xl text-slate-400 text-xs">
                Chưa có ảnh — bấm Thư viện hoặc Nhập URL
              </div>
            )}
          </div>

          {/* Mô tả món ăn */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">Mô tả món ăn (Tuỳ chọn)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Cà phê phin truyền thống thơm ngon kết hợp cùng sữa đặc béo ngậy..."
              className="w-full text-[13px] p-3 bg-white rounded-2xl border border-slate-300 outline-none focus:border-[#00A389] focus:ring-2 focus:ring-[#00A389]/20 shadow-2xs resize-none"
            />
          </div>

          {/* Món Bán Chạy (Nổi bật) */}
          <div className="flex items-center justify-between bg-orange-50/80 rounded-2xl p-4 border border-orange-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-orange-600"><Flame size={18} /></span>
              <span className="text-[13.5px] font-bold text-orange-800">
                Món Bán Chạy (Nổi bật)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPopular(!isPopular)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                isPopular ? 'bg-orange-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  isPopular ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-[#F1F5F9] flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl bg-white border border-slate-300 font-bold text-[13.5px] text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="flex-1 h-12 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13.5px] flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>{saving ? 'Đang lưu...' : 'Thêm món ăn'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
