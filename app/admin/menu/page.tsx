'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Check, X, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface MenuItemAdmin {
  id: string;
  code: string;
  name: string;
  categoryName: string;
  basePrice: number;
  costPrice: number;
  isSoldOut: boolean;
  isActive: boolean;
  imageUrl?: string;
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItemAdmin[]>([
    {
      id: 'item-1',
      code: 'TEA-01',
      name: 'Trà Đào Cam Sả',
      categoryName: 'Trà trái cây',
      basePrice: 45000,
      costPrice: 12000,
      isSoldOut: false,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop',
    },
    {
      id: 'item-2',
      code: 'CF-01',
      name: 'Cà Phê Muối Đặc Biệt',
      categoryName: 'Cà phê',
      basePrice: 35000,
      costPrice: 8000,
      isSoldOut: false,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&h=200&fit=crop',
    },
    {
      id: 'item-3',
      code: 'CF-02',
      name: 'Bạc Xỉu Sài Gòn',
      categoryName: 'Cà phê',
      basePrice: 32000,
      costPrice: 7500,
      isSoldOut: false,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
    },
    {
      id: 'item-4',
      code: 'FD-01',
      name: 'Khoai Tây Chiên Phô Mai',
      categoryName: 'Đồ ăn nhẹ',
      basePrice: 39000,
      costPrice: 11000,
      isSoldOut: false,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop',
    },
    {
      id: 'item-5',
      code: 'FD-02',
      name: 'Bánh Croissant Bơ Pháp',
      categoryName: 'Bánh ngọt',
      basePrice: 42000,
      costPrice: 15000,
      isSoldOut: true,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=200&fit=crop',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItemAdmin>>({
    name: '',
    categoryName: 'Trà trái cây',
    basePrice: 40000,
    costPrice: 10000,
    isSoldOut: false,
    isActive: true,
  });

  const toggleSoldOut = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isSoldOut: !i.isSoldOut } : i))
    );
  };

  const handleSaveItem = () => {
    if (!editingItem.name) return;
    if (editingItem.id) {
      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? ({ ...i, ...editingItem } as MenuItemAdmin) : i))
      );
    } else {
      const newItem: MenuItemAdmin = {
        id: `item-${Date.now()}`,
        code: `ITEM-0${items.length + 1}`,
        name: editingItem.name,
        categoryName: editingItem.categoryName || 'Trà trái cây',
        basePrice: Number(editingItem.basePrice) || 30000,
        costPrice: Number(editingItem.costPrice) || 8000,
        isSoldOut: false,
        isActive: true,
        imageUrl: editingItem.imageUrl || 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop',
      };
      setItems((prev) => [newItem, ...prev]);
    }
    setIsModalOpen(false);
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            QUẢN LÝ THỰC ĐƠN & MÓN ĂN
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Cấu hình danh mục, giá bán, giá vốn và trạng thái còn/hết hàng realtime
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingItem({
              name: '',
              categoryName: 'Trà trái cây',
              basePrice: 40000,
              costPrice: 10000,
              isSoldOut: false,
              isActive: true,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Món Mới</span>
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc mã món..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <span className="text-xs text-zinc-400">
          Tổng cộng: <strong className="text-zinc-200">{filteredItems.length}</strong> món
        </span>
      </div>

      {/* Menu Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Món Ăn</th>
                <th className="py-3.5 px-4">Mã Code</th>
                <th className="py-3.5 px-4">Danh Mục</th>
                <th className="py-3.5 px-4 text-right">Giá Bán</th>
                <th className="py-3.5 px-4 text-right">Giá Vốn</th>
                <th className="py-3.5 px-4 text-center">Báo Hết Món</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredItems.map((item) => {
                const profitMargin = ((item.basePrice - item.costPrice) / item.basePrice) * 100;
                return (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 text-[10px]">
                            No img
                          </div>
                        )}
                        <span className="font-bold text-zinc-100">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{item.code}</td>
                    <td className="py-3 px-4 text-zinc-300">{item.categoryName}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400">
                      {item.basePrice.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      {item.costPrice.toLocaleString('vi-VN')}đ
                      <span className="text-[10px] text-emerald-400 ml-1.5 font-semibold">
                        ({profitMargin.toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSoldOut(item.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition border ${
                          item.isSoldOut
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {item.isSoldOut ? 'HẾT HÀNG' : 'CÒN HÀNG'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-extrabold text-base text-zinc-100">
                {editingItem.id ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-300">Tên món</label>
                <input
                  type="text"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="Ví dụ: Trà Đào Cam Sả"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-300">Giá bán (VNĐ)</label>
                  <input
                    type="number"
                    value={editingItem.basePrice || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, basePrice: Number(e.target.value) })}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-300">Giá vốn (VNĐ)</label>
                  <input
                    type="number"
                    value={editingItem.costPrice || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, costPrice: Number(e.target.value) })}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-300">Danh mục</label>
                <select
                  value={editingItem.categoryName || 'Trà trái cây'}
                  onChange={(e) => setEditingItem({ ...editingItem, categoryName: e.target.value })}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                >
                  <option value="Trà trái cây">Trà trái cây</option>
                  <option value="Cà phê">Cà phê</option>
                  <option value="Đồ ăn nhẹ">Đồ ăn nhẹ</option>
                  <option value="Bánh ngọt">Bánh ngọt</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-300">Đường dẫn ảnh (URL)</label>
                <input
                  type="text"
                  value={editingItem.imageUrl || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20"
              >
                Lưu Món
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
