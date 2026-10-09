'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BomEditor from '../../../components/inventory/BomEditor';
import { Package, AlertTriangle, ArrowUpDown, Search, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import apiFetch from '../../../lib/api';
import { useI18n } from '../../../context/i18nContext';

interface IngredientView {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  category: string;
  branchId?: string;
  updatedAt?: string;
}

export default function AdminInventoryPage() {
  const { t } = useI18n();
  const [ingredients, setIngredients] = useState<IngredientView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientView | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Kiểm kê định kỳ');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjustMessage, setAdjustMessage] = useState<string | null>(null);

  const fetchIngredients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<IngredientView[]>('/ingredients');
      if (res.success && Array.isArray(res.data)) {
        setIngredients(res.data);
      } else {
        setError(res.message || t('inventory.errorLoading', 'Không thể tải danh sách nguyên vật liệu'));
      }
    } catch {
      setError(t('errors.network', 'Lỗi kết nối máy chủ khi tải dữ liệu kho'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleAdjustStock = async () => {
    if (!selectedIngredient || adjustQty === 0) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await apiFetch(`/ingredients/${selectedIngredient.id}/adjust`, {
        method: 'PATCH',
        body: JSON.stringify({
          adjustment: adjustQty,
          type: adjustQty > 0 ? 'ADD' : 'SUBTRACT',
          reason: adjustReason,
        }),
      });

      if (res.success) {
        setAdjustMessage(`${t('inventory.adjustSuccess', 'Đã điều chỉnh kho thành công:')} ${adjustQty > 0 ? '+' : ''}${adjustQty} ${selectedIngredient.unit}`);
        setIsAdjustModalOpen(false);
        fetchIngredients();
        setTimeout(() => setAdjustMessage(null), 3000);
      } else {
        setActionError(res.message || t('inventory.adjustFailed', 'Không thể điều chỉnh kho'));
      }
    } catch {
      setActionError(t('errors.network', 'Lỗi kết nối khi gửi yêu cầu điều chỉnh kho'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = ingredients.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = ingredients.filter((i) => i.quantity <= i.lowStockThreshold).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            {t('inventory.title', 'QUẢN LÝ KHO & ĐỊNH LƯỢNG BOM')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('inventory.subtitle', 'Theo dõi tồn kho nguyên liệu chi nhánh, cảnh báo ngưỡng tối thiểu và công thức pha chế')}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchIngredients}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          <span>{t('inventory.refreshStock', 'Làm Mới Kho')}</span>
        </button>
      </div>

      {adjustMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-400 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{adjustMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium">{t('inventory.totalIngredients', 'Tổng nguyên liệu đang quản lý')}</span>
            <p className="text-lg font-bold text-zinc-100">{ingredients.length} {t('inventory.itemsCount', 'mặt hàng')}</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium">{t('inventory.lowStockWarning', 'Cảnh báo sắp hết')}</span>
            <p className="text-lg font-bold text-red-400">{lowStockCount} {t('inventory.belowSafeThreshold', 'mặt hàng dưới ngưỡng an toàn')}</p>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('inventory.searchPlaceholder', 'Tìm theo tên hoặc danh mục nguyên liệu...')}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <span className="text-xs text-zinc-400">
          {t('common.showing', 'Hiển thị')}: <strong className="text-zinc-200">{filtered.length}</strong> / {ingredients.length} {t('inventory.itemsCount', 'mặt hàng')}
        </span>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-48" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-zinc-950/60 border border-zinc-800/80 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-zinc-900 border border-red-500/30 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-zinc-100 text-sm">{t('inventory.errorLoading', 'Không thể tải dữ liệu nguyên vật liệu')}</h3>
            <p className="text-xs text-zinc-400">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchIngredients}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('common.retry', 'Thử lại')}</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="font-bold text-zinc-300 text-sm">{t('inventory.empty', 'Chưa có nguyên vật liệu nào')}</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {t('inventory.emptyDesc', 'Không tìm thấy bản ghi nguyên liệu phù hợp với bộ lọc hiện tại.')}
          </p>
        </div>
      ) : (
        /* Ingredients Stock Table */
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">{t('inventory.colName', 'Tên Nguyên Liệu')}</th>
                  <th className="py-3.5 px-4">{t('inventory.colCategory', 'Phân Loại')}</th>
                  <th className="py-3.5 px-4 text-right">{t('inventory.colCurrentStock', 'Tồn Kho Hiện Tại')}</th>
                  <th className="py-3.5 px-4 text-right">{t('inventory.colMinThreshold', 'Ngưỡng Tối Thiểu')}</th>
                  <th className="py-3.5 px-4 text-center">{t('inventory.colStatus', 'Trạng Thái')}</th>
                  <th className="py-3.5 px-4 text-right">{t('common.actions', 'Thao Tác')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map((item) => {
                  const isLow = item.quantity <= item.lowStockThreshold;
                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4 font-bold text-zinc-100">{item.name}</td>
                      <td className="py-3 px-4 text-zinc-300">{item.category}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-400">
                        {item.lowStockThreshold} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isLow
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isLow ? t('inventory.lowStock', 'SẮP HẾT') : t('inventory.inStock', 'AN TOÀN')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedIngredient(item);
                            setAdjustQty(0);
                            setActionError(null);
                            setIsAdjustModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium rounded-lg ml-auto transition"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t('inventory.adjustStock', 'Kiểm kê / Nhập')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team A/B BOM Integration Notice & Editor */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-start gap-3 text-xs text-purple-300">
        <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <p>
          <strong>Lưu ý tiến độ dự án:</strong> Tính năng liên kết công thức định lượng (BOM Recipe) tự động trừ kho khi bán món đang được phối hợp triển khai cùng API Menu của Team A/B.
        </p>
      </div>

      <BomEditor />

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && selectedIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-zinc-100 pb-3 border-b border-zinc-800">
              {t('inventory.adjustStockTitle', 'Điều Chỉnh Kho')}: {selectedIngredient.name}
            </h3>

            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-400">{t('inventory.currentStockLabel', 'Tồn kho hiện tại:')}</span>
                <span className="font-bold text-amber-400">
                  {selectedIngredient.quantity} {selectedIngredient.unit}
                </span>
              </div>

              <div>
                <label className="font-semibold text-zinc-300">
                  {t('inventory.adjustQtyLabel', 'Số lượng thay đổi')} ({selectedIngredient.unit})
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    placeholder="+/- số lượng"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAdjustQty((prev) => prev + 5)}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustQty((prev) => prev + 10)}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                    >
                      +10
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {t('inventory.adjustQtyHelp', 'Nhập số dương để nhập kho thêm, số âm để trừ hao hụt/hỏng.')}
                </p>
              </div>

              <div>
                <label className="font-semibold text-zinc-300">{t('inventory.adjustReasonLabel', 'Lý do điều chỉnh')}</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
              >
                {t('common.cancel', 'Hủy')}
              </button>
              <button
                type="button"
                onClick={handleAdjustStock}
                disabled={isSubmitting || adjustQty === 0}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? t('common.updating', 'Đang cập nhật...') : t('common.confirm', 'Xác Nhận')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
