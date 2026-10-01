'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Save, Sparkles, Lock } from 'lucide-react';
import apiFetch from '../../lib/api';

interface RecipeItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  quantity: number;
}

interface BomEditorProps {
  menuItemId?: string;
  itemName?: string;
}

export function BomEditor({ menuItemId, itemName = 'Trà Đào Cam Sả' }: BomEditorProps) {
  const [selectedItemName, setSelectedItemName] = useState(itemName);
  const [recipes, setRecipes] = useState<RecipeItem[]>([
    { id: '1', ingredientId: 'ing-1', ingredientName: 'Trà Đen Earl Grey', unit: 'g', quantity: 15 },
    { id: '2', ingredientId: 'ing-2', ingredientName: 'Đào Ngâm Rhodes', unit: 'miếng', quantity: 2 },
    { id: '3', ingredientId: 'ing-3', ingredientName: 'Đường cát trắng', unit: 'g', quantity: 30 },
  ]);

  const [newIngName, setNewIngName] = useState('');
  const [newQty, setNewQty] = useState<number>(10);
  const [newUnit, setNewUnit] = useState('g');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  // Backend chưa có endpoint BOM (GET/PUT /menu/items/:id/bom) — khóa nút Lưu
  // để không tạo cảm giác "đã lưu" giả. Bật lại khi API sẵn sàng.
  const bomApiReady = false;

  const handleAddIngredient = () => {
    if (!newIngName.trim()) return;
    setRecipes((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}`,
        ingredientId: `ing-${Date.now()}`,
        ingredientName: newIngName.trim(),
        unit: newUnit,
        quantity: Number(newQty) || 1,
      },
    ]);
    setNewIngName('');
    setNewQty(10);
  };

  const handleRemove = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveBom = async () => {
    if (!bomApiReady || !menuItemId) {
      setSaveError('API định lượng BOM (GET/PUT /menu/items/:id/bom) đang được hoàn thiện — tạm khóa lưu để tránh mất công thức.');
      return;
    }
    setSaving(true);
    setSaveError('');
    const res = await apiFetch(`/menu/items/${menuItemId}/bom`, {
      method: 'PUT',
      body: JSON.stringify({
        recipes: recipes.map((r) => ({ ingredientId: r.ingredientId, quantity: r.quantity, unit: r.unit })),
      }),
    });
    setSaving(false);
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } else {
      setSaveError(res.message || 'Lưu công thức thất bại, thử lại sau.');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-3">
        <div>
          <h3 className="font-extrabold text-sm text-zinc-100 flex items-center gap-1.5">
            Định Lượng Công Thức (BOM Editor) <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </h3>
          <p className="text-xs text-zinc-400">
            Hệ thống tự động trừ kho nguyên liệu theo tỷ lệ mỗi khi món được bán
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedItemName}
            onChange={(e) => setSelectedItemName(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-semibold focus:outline-none"
          >
            <option value="Trà Đào Cam Sả">Trà Đào Cam Sả</option>
            <option value="Cà Phê Muối Đặc Biệt">Cà Phê Muối Đặc Biệt</option>
            <option value="Bạc Xỉu Sài Gòn">Bạc Xỉu Sài Gòn</option>
          </select>
        </div>
      </div>

      {/* Current Ingredients Table */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-zinc-400">
          Công thức cho 1 ly {selectedItemName}:
        </span>
        <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/40">
          {recipes.map((item) => (
            <div key={item.id} className="p-3 flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-200">{item.ingredientName}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-amber-400">
                  {item.quantity} {item.unit}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="text-zinc-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Component */}
      <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-center gap-2 text-xs">
        <input
          type="text"
          value={newIngName}
          onChange={(e) => setNewIngName(e.target.value)}
          placeholder="Tên nguyên liệu thêm..."
          className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="number"
            value={newQty}
            onChange={(e) => setNewQty(Number(e.target.value))}
            placeholder="Định lượng"
            className="w-20 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-center text-zinc-100 focus:outline-none"
          />
          <select
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-zinc-300 focus:outline-none"
          >
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="miếng">miếng</option>
            <option value="cái">cái</option>
          </select>
          <button
            type="button"
            onClick={handleAddIngredient}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl flex items-center gap-1 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {savedSuccess && (
          <span className="text-xs text-emerald-400 font-medium">✓ Đã lưu công thức BOM!</span>
        )}
        {saveError && <span className="text-xs text-rose-400 font-medium">{saveError}</span>}
        {!bomApiReady && (
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Chế độ xem trước — API BOM chưa sẵn sàng
          </span>
        )}
        <button
          type="button"
          onClick={handleSaveBom}
          disabled={!bomApiReady || saving}
          title={!bomApiReady ? 'API BOM đang được hoàn thiện' : 'Lưu định lượng'}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Đang lưu...' : 'Lưu Định Lượng'}</span>
        </button>
      </div>
    </div>
  );
}

export default BomEditor;
