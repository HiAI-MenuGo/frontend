'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  X,
  RefreshCw,
  CheckCircle2,
  Trash2,
  SlidersHorizontal,
  Eye,
  ChevronDown,
  Building2,
} from 'lucide-react';
import {
  fetchIngredients,
  adjustIngredientStock,
  createIngredient,
  deleteIngredient,
  type IngredientDTO,
} from '@/lib/api/ingredients.api';
import { useHeaderStore } from '@/stores/header.store';
import { useBranchStore } from '@/stores/branch.store';
import { useSocket } from '@/context/SocketContext';

export default function InventoryView() {
  const [ingredients, setIngredients] = useState<IngredientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tìm kiếm & Lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WARNING' | 'OK'>('ALL');

  // Thông báo Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Modal Chi tiết nguyên liệu
  const [detailItemId, setDetailItemId] = useState<string | null>(null);

  const activeDetailItem = useMemo(() => {
    if (!detailItemId) return null;
    return ingredients.find((i) => i.id === detailItemId) || null;
  }, [ingredients, detailItemId]);

  // Modal Điều chỉnh tồn kho
  const [adjustingItem, setAdjustingItem] = useState<IngredientDTO | null>(null);
  const [adjustType, setAdjustType] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('Nhập hàng mới');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Modal Thêm nguyên liệu mới
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    lowStockThreshold: '',
  });
  const [addLoading, setAddLoading] = useState(false);

  // Modal xác nhận xoá
  const [deletingItem, setDeletingItem] = useState<IngredientDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showToast = useCallback((type: 'success' | 'error' | 'warning', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  }, []);

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const branches = useBranchStore((s) => s.branches);
  const setBranchId = useBranchStore((s) => s.setBranchId);
  const fetchBranches = useBranchStore((s) => s.fetchBranches);

  // Quản lý nguyên liệu không có xem từ tổng -> tự động chọn chi nhánh cụ thể đầu tiên
  useEffect(() => {
    if (branches.length === 0) {
      void fetchBranches();
    }
  }, [branches.length, fetchBranches]);

  useEffect(() => {
    if ((selectedBranchId === 'ALL' || !selectedBranchId) && branches.length > 0) {
      setBranchId(branches[0].id);
    }
  }, [selectedBranchId, branches, setBranchId]);

  // Tải danh sách nguyên liệu
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const activeBranch = selectedBranchId === 'ALL' ? (branches[0]?.id || '') : selectedBranchId;
      if (!activeBranch) {
        setIngredients([]);
        return;
      }
      const data = await fetchIngredients(activeBranch);
      setIngredients(data);
    } catch (err: unknown) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Không tải được danh sách nguyên liệu');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, branches]);

  const setCustomAction = useHeaderStore((s) => s.setCustomAction);

  useEffect(() => {
    setCustomAction(
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="h-10 px-4 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center gap-2 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98]"
      >
        <Plus size={16} strokeWidth={2.5} />
        <span>Thêm nguyên liệu</span>
      </button>
    );
    return () => setCustomAction(null);
  }, [setCustomAction]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  // Lắng nghe Socket.IO Realtime
  const { on, off, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const onWarning = (payload: { ingredientId: string; name: string; currentStock: number; unit: string }) => {
      showToast('warning', `Cảnh báo: Nguyên liệu "${payload.name}" sắp hết! (Còn ${payload.currentStock} ${payload.unit})`);
      setIngredients((prev) =>
        prev.map((i) => (i.id === payload.ingredientId ? { ...i, quantity: payload.currentStock } : i))
      );
    };

    const onUpdated = (payload: { ingredientId: string; quantity: number }) => {
      setIngredients((prev) =>
        prev.map((i) => (i.id === payload.ingredientId ? { ...i, quantity: payload.quantity } : i))
      );
    };

    on('inventory:warning', onWarning);
    on('inventory:updated', onUpdated);

    return () => {
      off('inventory:warning', onWarning);
      off('inventory:updated', onUpdated);
    };
  }, [isConnected, on, off, showToast]);

  // Thống kê
  const warningCount = useMemo(() => ingredients.filter((i) => i.quantity <= i.lowStockThreshold).length, [ingredients]);
  const safeCount = useMemo(() => ingredients.filter((i) => i.quantity > i.lowStockThreshold).length, [ingredients]);

  // Lọc danh sách
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      const isWarning = item.quantity <= item.lowStockThreshold;
      if (statusFilter === 'WARNING' && !isWarning) return false;
      if (statusFilter === 'OK' && isWarning) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchUnit = item.unit.toLowerCase().includes(q);
        if (!matchName && !matchUnit) return false;
      }
      return true;
    });
  }, [ingredients, statusFilter, searchQuery]);

  // Mở modal điều chỉnh
  const handleOpenAdjust = (item: IngredientDTO) => {
    setAdjustingItem(item);
    setAdjustType('ADD');
    setAdjustAmount('');
    setAdjustReason('Nhập hàng mới');
  };

  // Xác nhận điều chỉnh
  const handleConfirmAdjust = async () => {
    if (!adjustingItem) return;
    const num = parseFloat(adjustAmount);
    if (isNaN(num) || (adjustType !== 'SET' && num <= 0) || (adjustType === 'SET' && num < 0)) {
      showToast(
        'error',
        adjustType === 'SET'
          ? 'Vui lòng nhập số lượng không âm (>= 0)'
          : 'Vui lòng nhập số lượng hợp lệ lớn hơn 0'
      );
      return;
    }

    try {
      setAdjustLoading(true);
      const updated = await adjustIngredientStock(adjustingItem.id, {
        adjustment: num,
        type: adjustType,
        reason: adjustReason,
      });

      setIngredients((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      showToast('success', `Đã cập nhật tồn kho cho "${updated.name}" thành ${updated.quantity} ${updated.unit}`);
      setAdjustingItem(null);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Không thể điều chỉnh tồn kho');
    } finally {
      setAdjustLoading(false);
    }
  };

  // Tạo nguyên liệu mới
  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.quantity.trim() || !newForm.unit.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ tên, số lượng và đơn vị');
      return;
    }

    const qty = parseFloat(newForm.quantity);
    const threshold = parseFloat(newForm.lowStockThreshold || '5');
    if (isNaN(qty) || qty < 0) {
      showToast('error', 'Số lượng tồn kho phải là số hợp lệ');
      return;
    }

    try {
      setAddLoading(true);
      const created = await createIngredient({
        name: newForm.name.trim(),
        quantity: qty,
        unit: newForm.unit.trim(),
        lowStockThreshold: isNaN(threshold) ? 5 : threshold,
      });

      setIngredients((prev) => [created, ...prev]);
      showToast('success', `Đã thêm nguyên liệu "${created.name}" thành công!`);
      setIsAddModalOpen(false);
      setNewForm({ name: '', quantity: '', unit: 'kg', lowStockThreshold: '' });
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Không thể tạo nguyên liệu');
    } finally {
      setAddLoading(false);
    }
  };

  // Xoá nguyên liệu
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setDeleteLoading(true);
      await deleteIngredient(deletingItem.id);
      setIngredients((prev) => prev.filter((i) => i.id !== deletingItem.id));
      showToast('success', `Đã xóa nguyên liệu "${deletingItem.name}"`);
      setDeletingItem(null);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Không thể xóa nguyên liệu');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Tính số lượng dự kiến sau điều chỉnh
  const previewQuantity = useMemo(() => {
    if (!adjustingItem) return 0;
    const val = parseFloat(adjustAmount) || 0;
    if (adjustType === 'ADD') return adjustingItem.quantity + val;
    if (adjustType === 'REMOVE') return Math.max(0, adjustingItem.quantity - val);
    if (adjustType === 'SET') return Math.max(0, val);
    return adjustingItem.quantity;
  }, [adjustingItem, adjustAmount, adjustType]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-[#F8FAFC] overflow-hidden">
      {/* Toast thông báo */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border bg-white ${
              toast.type === 'success'
                ? 'border-emerald-200 text-[#0F172A]'
                : toast.type === 'warning'
                ? 'border-amber-200 text-[#0F172A]'
                : 'border-rose-200 text-[#0F172A]'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
            {toast.type === 'error' && <X className="w-5 h-5 text-rose-500 shrink-0" />}
            <span className="text-[13px] font-bold">{toast.text}</span>
            <button onClick={() => setToast(null)} className="text-[#94A3B8] hover:text-[#0F172A] p-1">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header & Metrics */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">TỔNG NGUYÊN LIỆU</p>
                <p className="text-[20px] font-black text-[#0F172A] mt-0.5">{ingredients.length} mặt hàng</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#475569]">
                <Package size={20} />
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">CẢNH BÁO SẮP HẾT</p>
                <p className="text-[20px] font-black text-amber-800 mt-0.5">{warningCount} mặt hàng</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <AlertTriangle size={20} />
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">TỒN KHO AN TOÀN</p>
                <p className="text-[20px] font-black text-emerald-800 mt-0.5">{safeCount} mặt hàng</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Tìm kiếm, lọc trạng thái, lọc danh mục */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4 pt-3 border-t border-[#F1F5F9]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="tìm kiếm..."
              className="w-full h-10 pl-10 pr-9 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#00A389] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bộ lọc trạng thái */}
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`h-9 px-3 rounded-xl text-[12px] font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Tất cả ({ingredients.length})
            </button>
            <button
              onClick={() => setStatusFilter('WARNING')}
              className={`h-9 px-3 rounded-xl text-[12px] font-bold transition-all ${
                statusFilter === 'WARNING'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-[#E2E8F0] text-amber-700 hover:bg-amber-50'
              }`}
            >
              Sắp hết ({warningCount})
            </button>
            <button
              onClick={() => setStatusFilter('OK')}
              className={`h-9 px-3 rounded-xl text-[12px] font-bold transition-all ${
                statusFilter === 'OK'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-[#E2E8F0] text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              An toàn ({safeCount})
            </button>

          </div>
        </div>
      </div>

      {/* Danh sách Nguyên Liệu (Table / Grid) */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 lg:p-6 view-scroll">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#00A389] animate-spin" />
            <p className="text-[13px] font-bold text-[#64748B]">Đang tải kho nguyên liệu...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
            <p className="text-[14px] font-extrabold text-[#0F172A]">{error}</p>
            <button
              onClick={() => loadData(false)}
              className="px-4 py-2 bg-[#00A389] text-white rounded-xl text-[12px] font-bold inline-flex items-center gap-2"
            >
              <RefreshCw size={14} /> Thử lại
            </button>
          </div>
        ) : filteredIngredients.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-[#CBD5E1] max-w-md mx-auto mt-6">
            <Package size={40} className="text-[#94A3B8] mx-auto mb-3" />
            <h3 className="text-[16px] font-black text-[#0F172A]">Không tìm thấy nguyên liệu nào</h3>
            <p className="text-[12px] text-[#64748B] mt-1">
              Thử thay đổi từ khoá tìm kiếm hoặc thêm nguyên vật liệu mới vào hệ thống.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 bg-[#00A389] text-white rounded-xl text-[12px] font-bold inline-flex items-center gap-2"
            >
              <Plus size={14} /> Thêm nguyên liệu ngay
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-xs">
            <div className="overflow-x-auto table-scroll -mx-1 px-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC] text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                    <th className="py-3.5 px-5">Nguyên Vật Liệu</th>
                    <th className="py-3.5 px-4">Tồn Kho Hiện Tại</th>
                    <th className="py-3.5 px-4">Mức Tối Thiểu</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[13px]">
                  {filteredIngredients.map((item) => {
                    const isLow = item.quantity <= item.lowStockThreshold;
                    const percent = Math.min(100, Math.round((item.quantity / (item.lowStockThreshold * 2 || 10)) * 100));

                    return (
                      <tr key={item.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        {/* Tên */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-[14px] shrink-0 ${
                                isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              <Package size={18} />
                            </div>
                            <div>
                              <p className="font-extrabold text-[#0F172A]">{item.name}</p>
                            </div>
                          </div>
                        </td>

                        {/* Tồn kho hiện tại & thanh biểu đồ */}
                        <td className="py-4 px-4">
                          <div>
                            <span className={`text-[15px] font-black ${isLow ? 'text-amber-600' : 'text-[#0F172A]'}`}>
                              {item.quantity.toLocaleString('vi-VN')} {item.unit}
                            </span>
                            <div className="w-28 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mt-1.5">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isLow ? 'bg-amber-500' : 'bg-[#00A389]'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Định mức tối thiểu */}
                        <td className="py-4 px-4 text-[#64748B] font-semibold">
                          {item.lowStockThreshold} {item.unit}
                        </td>

                        {/* Trạng thái */}
                        <td className="py-4 px-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle size={12} />
                              Sắp hết hàng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} />
                              An toàn
                            </span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => setDetailItemId(item.id)}
                            className="h-9 px-3.5 rounded-xl bg-[#F8FAFC] hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-[#E2E8F0] font-bold text-[12.5px] text-[#334155] inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-[0.98]"
                          >
                            <Eye size={14} />
                            <span>Chi tiết</span>
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
      </div>

      {/* ============================================================== */}
      {/* MODAL CHI TIẾT NGUYÊN LIỆU (Mở khi bấm nút "Chi tiết") */}
      {/* ============================================================== */}
      {activeDetailItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92dvh] my-auto p-4 sm:p-6 shadow-2xl border border-[#E2E8F0] relative flex flex-col overflow-hidden modal-panel">
            <button
              onClick={() => setDetailItemId(null)}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-[#F8FAFC] transition-colors"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  activeDetailItem.quantity <= activeDetailItem.lowStockThreshold
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <Package size={24} />
              </div>
              <div className="min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-[18px] font-black text-[#0F172A] truncate">{activeDetailItem.name}</h3>
                  {activeDetailItem.quantity <= activeDetailItem.lowStockThreshold ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      <AlertTriangle size={11} /> Sắp hết
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <CheckCircle2 size={11} /> An toàn
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Grid thông tin chi tiết */}
            <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E2E8F0] space-y-3 mb-4 text-[13px]">
              <div className="flex justify-between items-center pb-2.5 border-b border-[#E2E8F0]/70">
                <span className="text-[#64748B] font-medium">Tồn kho hiện tại:</span>
                <span
                  className={`text-[16px] font-black ${
                    activeDetailItem.quantity <= activeDetailItem.lowStockThreshold
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {activeDetailItem.quantity.toLocaleString('vi-VN')} {activeDetailItem.unit}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-[#E2E8F0]/70">
                <span className="text-[#64748B] font-medium">Ngưỡng báo sắp hết (Tối thiểu):</span>
                <span className="font-bold text-[#0F172A]">
                  {activeDetailItem.lowStockThreshold} {activeDetailItem.unit}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-[#E2E8F0]/70">
                <span className="text-[#64748B] font-medium">Đơn vị đo lường:</span>
                <span className="font-bold text-[#0F172A]">{activeDetailItem.unit}</span>
              </div>

              {activeDetailItem.updatedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-medium">Cập nhật lần cuối:</span>
                  <span className="font-medium text-[#475569] text-[12px]">
                    {new Date(activeDetailItem.updatedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
            </div>

            {/* Tình trạng tồn kho với progress bar */}
            <div className="p-3.5 rounded-2xl border mb-5 bg-white border-[#E2E8F0]">
              <div className="flex justify-between items-center text-[12px] mb-1.5 font-bold">
                <span className="text-[#64748B]">Mức độ đáp ứng tồn kho</span>
                <span
                  className={
                    activeDetailItem.quantity <= activeDetailItem.lowStockThreshold
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                  }
                >
                  {activeDetailItem.quantity <= activeDetailItem.lowStockThreshold
                    ? 'Cần nhập thêm hàng'
                    : 'Đầy đủ phục vụ'}
                </span>
              </div>
              <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    activeDetailItem.quantity <= activeDetailItem.lowStockThreshold
                      ? 'bg-amber-500'
                      : 'bg-[#00A389]'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (activeDetailItem.quantity / (activeDetailItem.lowStockThreshold * 2 || 10)) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const item = activeDetailItem;
                  setDetailItemId(null);
                  handleOpenAdjust(item);
                }}
                className="flex-1 h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98]"
              >
                <SlidersHorizontal size={15} />
                <span>Cân chỉnh kho</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const item = activeDetailItem;
                  setDetailItemId(null);
                  setDeletingItem(item);
                }}
                className="h-11 px-4 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border border-[#E2E8F0] hover:border-rose-200 font-bold text-[13px] flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 size={15} />
                <span>Xóa</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailItemId(null)}
                className="h-11 px-4 rounded-2xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[13px] font-bold text-[#64748B] hover:text-[#0F172A] transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ĐIỀU CHỈNH TỒN KHO (NHẬP THÊM / XUẤT HAO HỤT / KIỂM KÊ) */}
      {/* ============================================================== */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[92dvh] my-auto p-4 sm:p-6 shadow-2xl border border-[#E2E8F0] relative flex flex-col overflow-hidden modal-panel">
            <button
              onClick={() => setAdjustingItem(null)}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-[#F8FAFC]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <h3 className="text-[17px] font-black text-[#0F172A]">Điều Chỉnh Tồn Kho</h3>
                <p className="text-[12px] text-[#64748B]">{adjustingItem.name}</p>
              </div>
            </div>

            {/* Thông tin hiện tại */}
            <div className="my-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-[12.5px]">
              <span className="text-[#64748B]">Tồn kho hiện tại:</span>
              <span className="text-[16px] font-black text-[#0F172A]">
                {adjustingItem.quantity} {adjustingItem.unit}
              </span>
            </div>

            {/* Chọn chế độ điều chỉnh */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setAdjustType('ADD');
                  setAdjustReason('Nhập hàng mới');
                }}
                className={`h-10 px-3 rounded-xl text-[13px] font-bold flex items-center justify-center border transition-all ${
                  adjustType === 'ADD'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                Nhập thêm
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdjustType('REMOVE');
                  setAdjustReason('Xuất pha chế / hao hụt');
                }}
                className={`h-10 px-3 rounded-xl text-[13px] font-bold flex items-center justify-center border transition-all ${
                  adjustType === 'REMOVE'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                Xuất kho
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdjustType('SET');
                  setAdjustReason('Kiểm kê định kỳ');
                }}
                className={`h-10 px-3 rounded-xl text-[13px] font-bold flex items-center justify-center border transition-all ${
                  adjustType === 'SET'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                Cân đối
              </button>
            </div>

            {/* Nhập số lượng */}
            <div className="mb-4">
              <label className="block text-[12px] font-extrabold text-[#334155] mb-1.5">
                {adjustType === 'ADD' && 'Số lượng nhập thêm:'}
                {adjustType === 'REMOVE' && 'Số lượng xuất kho:'}
                {adjustType === 'SET' && 'Số lượng thực tế sau kiểm kê:'}
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="any"
                  min="0"
                  autoFocus
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full h-11 pl-4 pr-16 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-[15px] font-bold text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal focus:outline-hidden focus:border-[#00A389] focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                />
                <span className="absolute right-3 px-2 py-0.5 rounded-lg bg-slate-200/70 text-[12px] font-bold text-[#475569] pointer-events-none select-none">
                  {adjustingItem.unit}
                </span>
              </div>
            </div>

            {/* Lý do */}
            <div className="mb-4">
              <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Lý do điều chỉnh:</label>
              <div className="relative">
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full h-11 pl-4 pr-10 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-[13px] text-[#0F172A] font-bold focus:outline-hidden focus:border-[#00A389] focus:bg-white appearance-none cursor-pointer transition-all"
                >
                  <option value="Nhập hàng mới">Nhập hàng mới từ nhà cung cấp</option>
                  <option value="Xuất pha chế / hao hụt">Xuất phục vụ pha chế / chế biến</option>
                  <option value="Hư hỏng / hết hạn">Hao hụt / đổ vỡ / hết hạn sử dụng</option>
                  <option value="Kiểm kê định kỳ">Kiểm kê định kỳ thực tế tại quầy</option>
                  <option value="Khác">Lý do khác</option>
                </select>
                <ChevronDown size={16} className="text-[#64748B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Xem trước kết quả */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 mb-5 flex items-center justify-between">
              <span className="text-[12px] font-bold text-emerald-800">Tồn kho sau điều chỉnh:</span>
              <span className="text-[18px] font-black text-emerald-800">
                {previewQuantity} {adjustingItem.unit}
              </span>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAdjustingItem(null)}
                className="flex-1 h-11 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] font-bold text-[#64748B] hover:text-[#0F172A]"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmAdjust}
                disabled={adjustLoading || !adjustAmount}
                className="flex-2 h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13.5px] flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md shadow-[#00A389]/20"
              >
                {adjustLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Lưu Thay Đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: THÊM NGUYÊN LIỆU MỚI */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[92dvh] my-auto p-4 sm:p-6 shadow-2xl border border-[#E2E8F0] relative flex flex-col overflow-hidden modal-panel">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-[#F8FAFC]"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <h3 className="text-[17px] font-black text-[#0F172A]">Thêm Nguyên Vật Liệu Mới</h3>
            </div>

            <form onSubmit={handleCreateIngredient} className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-extrabold text-[#334155] mb-1">
                  Tên nguyên liệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-[13px] text-[#0F172A] font-bold focus:outline-hidden focus:border-[#00A389] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[12px] font-extrabold text-[#334155] mb-1">
                  Đơn vị tính <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: kg, lít, hộp, gói..."
                  value={newForm.unit}
                  onChange={(e) => setNewForm({ ...newForm, unit: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-[13px] text-[#0F172A] font-bold focus:outline-hidden focus:border-[#00A389] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-extrabold text-[#334155] mb-1">
                    Số lượng nhập đầu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newForm.quantity}
                    onChange={(e) => setNewForm({ ...newForm, quantity: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-[14px] font-black text-[#0F172A] focus:outline-hidden focus:border-[#00A389] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-extrabold text-[#334155] mb-1">Ngưỡng báo sắp hết</label>
                  <input
                    type="number"
                    step="any"
                    value={newForm.lowStockThreshold}
                    onChange={(e) => setNewForm({ ...newForm, lowStockThreshold: e.target.value })}
                    className="w-full h-11 px-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-[14px] font-black text-[#0F172A] focus:outline-hidden focus:border-[#00A389] focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-11 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] font-bold text-[#64748B]"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-2 h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13.5px] flex items-center justify-center gap-2 shadow-md shadow-[#00A389]/20"
                >
                  {addLoading && <RefreshCw size={16} className="animate-spin" />}
                  <span>Tạo Nguyên Liệu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: XÁC NHẬN XOÁ NGUYÊN LIỆU */}
      {/* ============================================================== */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full max-h-[92dvh] my-auto p-4 sm:p-6 shadow-2xl border border-rose-200 text-center flex flex-col overflow-hidden modal-panel">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-[17px] font-black text-[#0F172A]">Xóa nguyên liệu?</h3>
            <p className="text-[13px] text-[#64748B] mt-1">
              Bạn có chắc muốn xóa <strong className="text-[#0F172A]">{deletingItem.name}</strong> khỏi kho? Hành động này không thể hoàn tác.
            </p>

            <div className="flex items-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="flex-1 h-11 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] font-bold text-[#64748B]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="flex-1 h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[13px] flex items-center justify-center gap-1.5"
              >
                {deleteLoading ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                <span>Xóa ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
