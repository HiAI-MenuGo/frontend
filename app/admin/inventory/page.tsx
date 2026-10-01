'use client';

import React, { useState } from 'react';
import BomEditor from '../../../components/inventory/BomEditor';
import { Package, AlertTriangle, ArrowUpDown, Plus, Search, CheckCircle } from 'lucide-react';

interface IngredientView {
  id: string;
  code: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
}

export default function AdminInventoryPage() {
  const [ingredients, setIngredients] = useState<IngredientView[]>([
    { id: '1', code: 'ING-CF-01', name: 'Hạt Cà Phê Robusta Đắk Lắk', unit: 'g', currentStock: 24500, minStock: 5000, costPerUnit: 250 },
    { id: '2', code: 'ING-MILK-01', name: 'Sữa Đặc Ngôi Sao', unit: 'ml', currentStock: 14200, minStock: 3000, costPerUnit: 80 },
    { id: '3', code: 'ING-TEA-01', name: 'Trà Đen Earl Grey Thượng Hạng', unit: 'g', currentStock: 9500, minStock: 2000, costPerUnit: 400 },
    { id: '4', code: 'ING-PEACH-01', name: 'Đào Ngâm Rhodes', unit: 'miếng', currentStock: 75, minStock: 100, costPerUnit: 2500 },
    { id: '5', code: 'ING-CUP-01', name: 'Ly Nhựa Takeaway 500ml', unit: 'cái', currentStock: 850, minStock: 200, costPerUnit: 700 },
  ]);

  const [search, setSearch] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientView | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Nhập thêm hàng');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const handleAdjustStock = () => {
    if (!selectedIngredient || adjustQty === 0) return;
    setIngredients((prev) =>
      prev.map((i) =>
        i.id === selectedIngredient.id
          ? { ...i, currentStock: Math.max(0, i.currentStock + adjustQty) }
          : i
      )
    );
    setIsAdjustModalOpen(false);
  };

  const filtered = ingredients.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = ingredients.filter((i) => i.currentStock <= i.minStock).length;
  const totalStockValue = ingredients.reduce((acc, i) => acc + i.currentStock * i.costPerUnit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            QUẢN LÝ KHO & ĐỊNH LƯỢNG BOM
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Theo dõi tồn kho nguyên liệu chi nhánh, cảnh báo ngưỡng tối thiểu và công thức pha chế
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium">Tổng nguyên liệu</span>
            <p className="text-lg font-bold text-zinc-100">{ingredients.length} mặt hàng</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium">Cảnh báo sắp hết</span>
            <p className="text-lg font-bold text-red-400">{lowStockCount} mặt hàng dưới ngưỡng</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium">Giá trị tồn kho ước tính</span>
            <p className="text-lg font-bold text-emerald-400">
              {totalStockValue.toLocaleString('vi-VN')}đ
            </p>
          </div>
        </div>
      </div>

      {/* Ingredients Stock Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg space-y-3 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
          <h3 className="font-extrabold text-sm text-zinc-100">Danh Sách Tồn Kho Chi Nhánh</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nguyên liệu..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-3">Mã NL</th>
                <th className="py-3 px-3">Tên Nguyên Liệu</th>
                <th className="py-3 px-3 text-right">Tồn Kho</th>
                <th className="py-3 px-3 text-right">Ngưỡng Tối Thiểu</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
                <th className="py-3 px-3 text-right">Điều Chỉnh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((ing) => {
                const isLow = ing.currentStock <= ing.minStock;
                return (
                  <tr key={ing.id} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-3 font-mono text-zinc-400">{ing.code}</td>
                    <td className="py-3 px-3 font-bold text-zinc-200">{ing.name}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                      {ing.currentStock.toLocaleString('vi-VN')} {ing.unit}
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-400">
                      {ing.minStock.toLocaleString('vi-VN')} {ing.unit}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isLow
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {isLow ? 'SẮP HẾT' : 'AN TOÀN'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIngredient(ing);
                          setAdjustQty(0);
                          setIsAdjustModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        <span>Kiểm kê</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOM Formula Editor Section */}
      <BomEditor />

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && selectedIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-zinc-100">
              Kiểm Kê / Điều Chỉnh Tồn Kho: {selectedIngredient.name}
            </h3>

            <div className="text-xs space-y-2">
              <p className="text-zinc-400">
                Tồn hiện tại: <strong className="text-amber-400">{selectedIngredient.currentStock} {selectedIngredient.unit}</strong>
              </p>
              <div>
                <label className="text-zinc-300 font-semibold">Số lượng thay đổi (+ nhập / - hao hụt)</label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  placeholder="Ví dụ: +500 hoặc -100"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-zinc-300 font-semibold">Lý do điều chỉnh</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 focus:outline-none"
                >
                  <option value="Nhập thêm hàng">Nhập thêm hàng mới</option>
                  <option value="Hao hụt tự nhiên">Hao hụt tự nhiên</option>
                  <option value="Nguyên liệu hỏng">Nguyên liệu hỏng / Hết hạn</option>
                  <option value="Kiểm kê định kỳ">Kiểm kê định kỳ thực tế</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAdjustStock}
                className="px-4 py-1.5 bg-amber-500 font-bold text-zinc-950 rounded-lg shadow"
              >
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
