'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TicketPercent,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  Pencil,
  Trash2,
  RefreshCw,
  Gift,
  Tag,
  Flame,
  LayoutGrid,
  List,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Info,
  X,
} from 'lucide-react';
import {
  fetchVouchers,
  createVoucher,
  updateVoucher,
  toggleVoucherStatus,
  deleteVoucher,
  type VoucherItem,
  type VoucherType,
  type CreateVoucherInput,
} from '@/lib/api/vouchers.api';
import { formatVND } from '@/lib/format';
import { formatDisplayDate } from '@/lib/date';
import { useHeaderStore } from '@/stores/header.store';

export default function PromotionsView() {
  const setCustomTitle = useHeaderStore((s) => s.setCustomTitle);
  const setCustomAction = useHeaderStore((s) => s.setCustomAction);

  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Display
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PERCENT' | 'FIXED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals & Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VoucherItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form State
  const [form, setForm] = useState({
    code: '',
    description: '',
    type: 'PERCENT' as VoucherType,
    value: '',
    maxDiscount: '',
    minOrderVal: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await fetchVouchers(false);
      setVouchers(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Mở modal tạo mới
  const openCreateModal = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setEditingVoucher(null);
    setForm({
      code: '',
      description: '',
      type: 'PERCENT',
      value: '10',
      maxDiscount: '50000',
      minOrderVal: '100000',
      usageLimit: '100',
      startDate: today,
      endDate: nextMonth,
      isActive: true,
    });
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    setCustomTitle('Khuyến Mãi & Voucher');
    setCustomAction(
      <button
        onClick={openCreateModal}
        className="h-10 px-4 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center gap-1.5 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98] shrink-0 cursor-pointer"
      >
        <Plus size={16} strokeWidth={2.5} />
        <span>Tạo Mã Khuyến Mãi</span>
      </button>
    );
    loadData();
    return () => {
      setCustomTitle(null);
      setCustomAction(null);
    };
  }, [setCustomTitle, setCustomAction, openCreateModal, loadData]);

  // Copy code vào clipboard
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Đã sao chép mã ${code} vào bộ nhớ tạm!`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Tạo mã ngẫu nhiên gợi ý
  const generateRandomCode = () => {
    const prefixes = ['SALE', 'HIAI', 'DISCOUNT', 'VIP', 'CHAO', 'HE', 'COMBO'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    setForm((prev) => ({ ...prev, code: `${prefix}${randomNum}` }));
  };

  // Mở modal chỉnh sửa
  const openEditModal = (voucher: VoucherItem) => {
    setEditingVoucher(voucher);
    const start = voucher.startDate ? new Date(voucher.startDate).toISOString().split('T')[0] : '';
    const end = voucher.endDate ? new Date(voucher.endDate).toISOString().split('T')[0] : '';

    setForm({
      code: voucher.code,
      description: voucher.description || '',
      type: voucher.type,
      value: String(voucher.value),
      maxDiscount: voucher.maxDiscount ? String(voucher.maxDiscount) : '',
      minOrderVal: voucher.minOrderVal ? String(voucher.minOrderVal) : '0',
      usageLimit: voucher.usageLimit ? String(voucher.usageLimit) : '',
      startDate: start,
      endDate: end,
      isActive: voucher.isActive,
    });
    setIsModalOpen(true);
  };

  // Bật/tắt trạng thái voucher trực tiếp
  const handleToggleStatus = async (voucher: VoucherItem) => {
    const nextState = !voucher.isActive;
    // Optimistic update
    setVouchers((prev) =>
      prev.map((v) => (v.id === voucher.id ? { ...v, isActive: nextState } : v))
    );

    try {
      await toggleVoucherStatus(voucher.id, nextState);
      showToast(`Đã ${nextState ? 'kích hoạt' : 'tạm dừng'} mã ${voucher.code}`, 'success');
    } catch (err: any) {
      // Rollback
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucher.id ? { ...v, isActive: voucher.isActive } : v))
      );
      showToast(err?.message || 'Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  // Xóa / Vô hiệu hóa voucher
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await deleteVoucher(deleteTarget.id);
      if (res.deleted) {
        setVouchers((prev) => prev.filter((v) => v.id !== deleteTarget.id));
        showToast(`Đã xóa vĩnh viễn mã khuyến mãi ${deleteTarget.code}`, 'success');
      } else {
        setVouchers((prev) =>
          prev.map((v) => (v.id === deleteTarget.id ? { ...v, isActive: false } : v))
        );
        showToast(
          res.message || `Mã ${deleteTarget.code} đã có đơn áp dụng, hệ thống đã tạm ngừng kích hoạt`,
          'info'
        );
      }
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err?.message || 'Không thể xóa mã khuyến mãi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Lưu Form (Tạo mới hoặc Sửa)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = form.code.trim().toUpperCase();

    if (!formattedCode) {
      showToast('Vui lòng nhập mã khuyến mãi', 'error');
      return;
    }
    const val = Number(form.value);
    if (isNaN(val) || val <= 0) {
      showToast('Giá trị giảm phải lớn hơn 0', 'error');
      return;
    }
    if (form.type === 'PERCENT' && val > 100) {
      showToast('Giảm theo % không được vượt quá 100%', 'error');
      return;
    }
    if (!form.endDate) {
      showToast('Vui lòng chọn ngày hết hạn', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateVoucherInput = {
        code: formattedCode,
        description: form.description.trim() || undefined,
        type: form.type,
        value: val,
        maxDiscount: form.type === 'PERCENT' && form.maxDiscount ? Number(form.maxDiscount) : null,
        minOrderVal: form.minOrderVal ? Number(form.minOrderVal) : 0,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: new Date(`${form.endDate}T23:59:59`).toISOString(),
      };

      if (editingVoucher) {
        const updated = await updateVoucher(editingVoucher.id, {
          ...payload,
          isActive: form.isActive,
        });
        setVouchers((prev) => prev.map((v) => (v.id === editingVoucher.id ? updated : v)));
        showToast(`Đã cập nhật mã ${updated.code} thành công!`, 'success');
      } else {
        const created = await createVoucher(payload);
        setVouchers((prev) => [created, ...prev]);
        showToast(`Tạo mã khuyến mãi ${created.code} thành công!`, 'success');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Thao tác không thành công', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const now = new Date();
    const total = vouchers.length;
    let active = 0;
    let expired = 0;
    let paused = 0;
    let totalRedeemed = 0;

    vouchers.forEach((v) => {
      totalRedeemed += v.usedCount || 0;
      const isExp = new Date(v.endDate) < now;
      if (isExp) {
        expired++;
      } else if (v.isActive) {
        active++;
      } else {
        paused++;
      }
    });

    return { total, active, expired, paused, totalRedeemed };
  }, [vouchers]);

  // Lọc và tìm kiếm danh sách
  const filteredVouchers = useMemo(() => {
    const now = new Date();
    return vouchers.filter((v) => {
      // Search
      const q = search.trim().toLowerCase();
      if (q) {
        const matchCode = v.code.toLowerCase().includes(q);
        const matchDesc = v.description?.toLowerCase().includes(q);
        if (!matchCode && !matchDesc) return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && v.type !== typeFilter) return false;

      // Status filter
      const isExp = new Date(v.endDate) < now;
      if (statusFilter === 'ACTIVE' && (!v.isActive || isExp)) return false;
      if (statusFilter === 'INACTIVE' && (v.isActive || isExp)) return false;
      if (statusFilter === 'EXPIRED' && !isExp) return false;

      return true;
    });
  }, [vouchers, search, typeFilter, statusFilter]);

  // Kiểm tra thời hạn còn lại của voucher
  const getExpiryInfo = (endDateStr: string, isActive: boolean) => {
    const end = new Date(endDateStr);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { label: 'Đã hết hạn', color: 'bg-red-50 text-red-600 border-red-200', isExpired: true };
    }
    if (!isActive) {
      return { label: 'Tạm ngưng', color: 'bg-slate-100 text-slate-600 border-slate-200', isExpired: false };
    }
    if (diffDays === 0) {
      return { label: 'Hết hạn hôm nay', color: 'bg-amber-50 text-amber-600 border-amber-200', isExpired: false };
    }
    if (diffDays <= 3) {
      return { label: `Còn ${diffDays} ngày`, color: 'bg-orange-50 text-orange-600 border-orange-200', isExpired: false };
    }
    return { label: `Còn ${diffDays} ngày`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', isExpired: false };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-sky-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}


      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng mã */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-slate-200 transition">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <TicketPercent className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Tổng mã voucher</div>
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          </div>
        </div>

        {/* Card 2: Đang hoạt động */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-slate-200 transition">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Đang hoạt động</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
          </div>
        </div>

        {/* Card 3: Hết hạn / Tạm dừng */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-slate-200 transition">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Hết hạn / Tạm dừng</div>
            <div className="text-2xl font-bold text-slate-700">{stats.expired + stats.paused}</div>
          </div>
        </div>

        {/* Card 4: Lượt đã sử dụng */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-slate-200 transition">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Lượt đã áp dụng</div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalRedeemed}</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters & View Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="tìm kiếm..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters & View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lọc loại giảm */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tất cả loại ưu đãi</option>
            <option value="PERCENT">Giảm phần trăm (%)</option>
            <option value="FIXED">Giảm tiền mặt (₫)</option>
          </select>

          {/* Lọc trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang kích hoạt</option>
            <option value="INACTIVE">Tạm dừng</option>
            <option value="EXPIRED">Đã hết hạn</option>
          </select>

          {/* Chuyển đổi Grid / Table */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-sm transition ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-600 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Dạng thẻ Voucher"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-sm transition ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-600 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Dạng danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area: Cards Grid or Table */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-60 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
            <TicketPercent className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">
              {search || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Không tìm thấy mã khuyến mãi phù hợp'
                : 'Chưa có chương trình khuyến mãi nào'}
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              {search || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc bên trên.'
                : 'Hãy bắt đầu tạo mã khuyến mãi đầu tiên để thu hút và giữ chân khách hàng.'}
            </p>
          </div>
          {search || typeFilter !== 'ALL' || statusFilter !== 'ALL' ? (
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="px-4 py-2 text-sm font-medium text-emerald-600 hover:underline"
            >
              Xóa bộ lọc
            </button>
          ) : (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Mã Mới Ngay</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Voucher Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVouchers.map((voucher) => {
            const expInfo = getExpiryInfo(voucher.endDate, voucher.isActive);
            const usagePercent =
              voucher.usageLimit && voucher.usageLimit > 0
                ? Math.min(100, Math.round((voucher.usedCount / voucher.usageLimit) * 100))
                : null;

            return (
              <div
                key={voucher.id}
                className={`relative bg-white rounded-3xl border transition-all duration-300 hover:shadow-xl flex flex-col justify-between overflow-hidden group ${
                  voucher.isActive && !expInfo.isExpired
                    ? 'border-slate-200/80 hover:border-emerald-500/50'
                    : 'border-slate-200/60 opacity-80'
                }`}
              >
                {/* Coupon Header Banner */}
                <div
                  className={`p-5 pb-4 relative ${
                    voucher.type === 'PERCENT'
                      ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent'
                      : 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-2xl font-black tracking-tight ${
                            voucher.type === 'PERCENT' ? 'text-emerald-600' : 'text-blue-600'
                          }`}
                        >
                          {voucher.type === 'PERCENT' ? `-${voucher.value}%` : `-${formatVND(voucher.value)}`}
                        </span>
                        {voucher.type === 'PERCENT' && voucher.maxDiscount && (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Tối đa {formatVND(voucher.maxDiscount)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {voucher.description || 'Chương trình khuyến mãi'}
                      </p>
                    </div>

                    {/* Expiry Badge */}
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${expInfo.color}`}
                    >
                      {expInfo.label}
                    </span>
                  </div>

                  {/* Voucher Code Box */}
                  <div className="mt-4 flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-xs">
                    <div className="flex items-center gap-2 pl-1 font-mono font-bold text-base text-slate-800 tracking-wider">
                      <Tag className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{voucher.code}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(voucher.code)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition"
                      title="Sao chép mã"
                    >
                      {copiedCode === voucher.code ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Perforated Edge Divider (Đường đục lỗ voucher cách điệu) */}
                <div className="relative flex items-center justify-between px-2 py-1">
                  <div className="w-4 h-4 rounded-full bg-slate-50 -ml-4 border-r border-slate-200" />
                  <div className="flex-1 border-b-2 border-dashed border-slate-200 mx-2" />
                  <div className="w-4 h-4 rounded-full bg-slate-50 -mr-4 border-l border-slate-200" />
                </div>

                {/* Coupon Body Info */}
                <div className="p-5 pt-3 space-y-3.5 text-xs text-slate-600 flex-1">
                  {/* Điều kiện đơn tối thiểu */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Đơn tối thiểu:</span>
                    <span className="font-semibold text-slate-700">
                      {voucher.minOrderVal > 0 ? formatVND(voucher.minOrderVal) : 'Không giới hạn'}
                    </span>
                  </div>

                  {/* Lượt sử dụng */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Đã áp dụng:</span>
                      <span className="font-semibold text-slate-700">
                        {voucher.usedCount}{' '}
                        {voucher.usageLimit ? `/ ${voucher.usageLimit} lượt` : 'lượt (Không giới hạn)'}
                      </span>
                    </div>
                    {usagePercent !== null && (
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            usagePercent >= 90
                              ? 'bg-rose-500'
                              : usagePercent >= 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Hạn hiệu lực */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Thời hạn:</span>
                    <span className="font-medium text-slate-700">
                      {formatDisplayDate(voucher.startDate)} → {formatDisplayDate(voucher.endDate)}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                  {/* Status Toggle Switch */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={voucher.isActive}
                      onChange={() => handleToggleStatus(voucher)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {voucher.isActive ? 'Bật' : 'Tắt'}
                    </span>
                  </label>

                  {/* Edit & Delete Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(voucher)}
                      className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title="Chỉnh sửa mã"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(voucher)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Xóa mã khuyến mãi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Voucher Table View */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase font-semibold">
                  <th className="py-4 px-6">Mã Khuyến Mãi</th>
                  <th className="py-4 px-6">Mức Giảm</th>
                  <th className="py-4 px-6">Điều Kiện Áp Dụng</th>
                  <th className="py-4 px-6">Lượt Dùng</th>
                  <th className="py-4 px-6">Thời Hạn</th>
                  <th className="py-4 px-6 text-center">Trạng Thái</th>
                  <th className="py-4 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredVouchers.map((voucher) => {
                  const expInfo = getExpiryInfo(voucher.endDate, voucher.isActive);

                  return (
                    <tr key={voucher.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                            {voucher.code}
                          </span>
                          <button
                            onClick={() => handleCopy(voucher.code)}
                            className="p-1 text-slate-400 hover:text-emerald-600 transition"
                            title="Sao chép"
                          >
                            {copiedCode === voucher.code ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {voucher.description && (
                          <div className="text-xs text-slate-500 mt-1 max-w-xs truncate">
                            {voucher.description}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">
                          {voucher.type === 'PERCENT' ? `Giảm ${voucher.value}%` : `Giảm ${formatVND(voucher.value)}`}
                        </div>
                        {voucher.type === 'PERCENT' && voucher.maxDiscount && (
                          <div className="text-xs text-slate-500">
                            Tối đa: {formatVND(voucher.maxDiscount)}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-slate-800">
                          {voucher.minOrderVal > 0 ? (
                            <>Đơn từ <span className="font-medium">{formatVND(voucher.minOrderVal)}</span></>
                          ) : (
                            <span className="text-slate-500">Mọi đơn hàng</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-800">
                          {voucher.usedCount}
                          {voucher.usageLimit ? ` / ${voucher.usageLimit}` : ' (không giới hạn)'}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-xs text-slate-600">
                          {formatDisplayDate(voucher.startDate)} → {formatDisplayDate(voucher.endDate)}
                        </div>
                        <span
                          className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${expInfo.color}`}
                        >
                          {expInfo.label}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={voucher.isActive}
                            onChange={() => handleToggleStatus(voucher)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                        </label>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(voucher)}
                            className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(voucher)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Tạo mới / Chỉnh sửa Mã Khuyến Mãi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <TicketPercent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingVoucher ? 'Chỉnh Sửa Mã Khuyến Mãi' : 'Tạo Mã Khuyến Mãi Mới'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
              {/* Mã Voucher & Nút sinh mã ngẫu nhiên */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>MÃ KHUYẾN MÃI (CODE) <span className="text-rose-500">*</span></span>
                  {!editingVoucher && (
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Gợi ý mã ngẫu nhiên
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-base font-bold tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              {/* Tên / Mô tả chương trình */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  TÊN CHƯƠNG TRÌNH / MÔ TẢ
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              {/* Loại giảm giá: Phím chuyển Tab PERCENT vs FIXED */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">HÌNH THỨC GIẢM GIÁ</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'PERCENT' })}
                    className={`p-3.5 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                      form.type === 'PERCENT'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Theo phần trăm (%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'FIXED' })}
                    className={`p-3.5 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                      form.type === 'FIXED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Số tiền cố định (₫)</span>
                  </button>
                </div>
              </div>

              {/* Giá trị giảm & Mức trần tối đa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {form.type === 'PERCENT' ? 'MỨC GIẢM (%)' : 'SỐ TIỀN GIẢM (₫)'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={form.type === 'PERCENT' ? '100' : undefined}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                {form.type === 'PERCENT' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      GIẢM TỐI ĐA (₫) <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.maxDiscount}
                      onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">ĐƠN TỐI THIỂU (₫)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.minOrderVal}
                      onChange={(e) => setForm({ ...form, minOrderVal: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                )}
              </div>

              {/* Nếu là PERCENT thì input Đơn tối thiểu + Giới hạn lượt dùng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {form.type === 'PERCENT' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">ĐƠN TỐI THIỂU (₫)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.minOrderVal}
                      onChange={(e) => setForm({ ...form, minOrderVal: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    GIỚI HẠN SỐ LƯỢT DÙNG <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Ngày bắt đầu & Ngày hết hạn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">NGÀY BẮT ĐẦU</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    NGÀY HẾT HẠN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Trạng thái Kích hoạt */}
              <div className="pt-2">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div className="text-sm">
                    <span className="font-semibold text-slate-800">Kích hoạt ngay chương trình này</span>
                  </div>
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingVoucher ? 'Cập Nhật Voucher' : 'Tạo Voucher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận Xóa Mã Khuyến Mãi */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                Xóa mã khuyến mãi {deleteTarget.code}?
              </h3>
              <p className="text-sm text-slate-500">
                Nếu mã này chưa từng được dùng trong đơn hàng, hệ thống sẽ xóa vĩnh viễn. Nếu đã có đơn áp dụng, hệ thống sẽ tự động tạm ngưng để bảo toàn lịch sử hóa đơn.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
