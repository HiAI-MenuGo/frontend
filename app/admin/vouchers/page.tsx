'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, Search, Tag, CheckCircle, XCircle, X, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import apiFetch from '../../../lib/api';

interface VoucherItem {
  id: string;
  code: string;
  description: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  maxDiscount?: number;
  minOrderVal: number;
  usedCount: number;
  usageLimit?: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form states
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [newValue, setNewValue] = useState<number>(15);
  const [newMaxDiscount, setNewMaxDiscount] = useState<number>(50000);
  const [newMinOrder, setNewMinOrder] = useState<number>(100000);
  const [newUsageLimit, setNewUsageLimit] = useState<number>(500);

  const fetchVouchers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<VoucherItem[]>('/vouchers');
      if (res.success && Array.isArray(res.data)) {
        setVouchers(res.data);
      } else {
        setError(res.message || 'Không thể tải danh sách voucher');
      }
    } catch {
      setError('Lỗi kết nối khi tải danh sách voucher');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const toggleVoucherActive = async (id: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      // Optimistic
      setVouchers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isActive: nextStatus } : v))
      );

      const res = await apiFetch(`/vouchers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (!res.success) {
        // Rollback + báo lỗi để user biết thao tác chưa được lưu
        setVouchers((prev) =>
          prev.map((v) => (v.id === id ? { ...v, isActive: currentStatus } : v))
        );
        setActionError(res.message || 'Đổi trạng thái voucher thất bại — đã hoàn tác.');
        setTimeout(() => setActionError(null), 4000);
      }
    } catch {
      // Rollback
      setVouchers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isActive: currentStatus } : v))
      );
      setActionError('Lỗi kết nối — đổi trạng thái voucher thất bại, đã hoàn tác.');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleDeleteVoucher = async (id: string, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa voucher ${code}?`)) return;
    try {
      const res = await apiFetch(`/vouchers/${id}`, { method: 'DELETE' });
      if (res.success) {
        setVouchers((prev) => prev.filter((v) => v.id !== id));
        setMessage(`Đã xóa voucher ${code}`);
        setTimeout(() => setMessage(null), 3000);
      } else {
        alert(res.message || 'Không thể xóa voucher');
      }
    } catch {
      alert('Lỗi kết nối khi xóa voucher');
    }
  };

  const handleCreateVoucher = async () => {
    if (!newCode.trim()) return;
    setIsSubmitting(true);
    try {
      const end = new Date();
      end.setDate(end.getDate() + 90);

      const payload = {
        code: newCode.trim().toUpperCase(),
        description: newDesc.trim() || `Giảm giá mã ${newCode.trim().toUpperCase()}`,
        type: newType,
        value: Number(newValue),
        maxDiscount: newType === 'PERCENT' ? Number(newMaxDiscount) : undefined,
        minOrderVal: Number(newMinOrder),
        usageLimit: Number(newUsageLimit),
        startDate: new Date().toISOString(),
        endDate: end.toISOString(),
        isActive: true,
      };

      const res = await apiFetch('/vouchers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setMessage(`Đã tạo thành công voucher ${payload.code}`);
        setIsModalOpen(false);
        setNewCode('');
        setNewDesc('');
        fetchVouchers();
        setTimeout(() => setMessage(null), 3000);
      } else {
        alert(res.message || 'Không thể tạo voucher');
      }
    } catch {
      alert('Lỗi kết nối khi tạo voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = vouchers.filter(
    (v) =>
      v.code.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            QUẢN LÝ MÃ GIẢM GIÁ & VOUCHER
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Thiết lập chương trình khuyến mãi theo % hoặc số tiền cố định, giới hạn lượt dùng và đơn tối thiểu
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewCode('');
            setNewDesc('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Voucher Mới</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-red-400 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-400 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Vouchers Table Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã hoặc mô tả voucher..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="button"
            onClick={fetchVouchers}
            disabled={isLoading}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-zinc-950/60 border border-zinc-800/80 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-xs text-zinc-300 font-semibold">{error}</p>
            <button
              type="button"
              onClick={fetchVouchers}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-xl inline-flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-2">
            <Ticket className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="font-bold text-zinc-300 text-sm">Chưa có mã giảm giá nào</p>
            <p className="text-xs text-zinc-500">
              Nhấn nút &quot;Tạo Voucher Mới&quot; để thiết lập chương trình khuyến mãi đầu tiên cho quán.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-3">Mã Code</th>
                  <th className="py-3 px-3">Mô Tả Khuyến Mãi</th>
                  <th className="py-3 px-3">Loại / Mức Giảm</th>
                  <th className="py-3 px-3">Đơn Tối Thiểu</th>
                  <th className="py-3 px-3">Lượt Đã Dùng</th>
                  <th className="py-3 px-3">Hạn Dùng</th>
                  <th className="py-3 px-3 text-center">Trạng Thái</th>
                  <th className="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map((v) => {
                  const endDateStr = v.endDate ? new Date(v.endDate).toLocaleDateString('vi-VN') : 'Không giới hạn';
                  return (
                    <tr key={v.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-500" />
                        <span>{v.code}</span>
                      </td>
                      <td className="py-3 px-3 text-zinc-200">{v.description}</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">
                        {v.type === 'PERCENT' ? `${v.value}%` : `${v.value.toLocaleString('vi-VN')}đ`}
                        {v.maxDiscount ? (
                          <span className="text-[10px] text-zinc-400 block font-normal">
                            Tối đa: {v.maxDiscount.toLocaleString('vi-VN')}đ
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 px-3 text-zinc-400">
                        {(v.minOrderVal || 0).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3 px-3 text-zinc-300">
                        {v.usedCount} / {v.usageLimit || '∞'}
                      </td>
                      <td className="py-3 px-3 text-zinc-400">{endDateStr}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleVoucherActive(v.id, v.isActive)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition border ${
                            v.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700'
                          }`}
                        >
                          {v.isActive ? 'KÍCH HOẠT' : 'TẠM KHÓA'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteVoucher(v.id, v.code)}
                          className="p-1 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400 transition"
                          title="Xóa voucher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Voucher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-extrabold text-sm text-zinc-100 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-500" />
                <span>Tạo Mã Khuyến Mãi Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-300">Mã Code (Viết hoa, không dấu)</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="Vd: BANMOI2026, TRIAN50K"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-300">Mô tả chương trình</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Vd: Giảm 20% tối đa 50k cho đơn từ 100k"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-300">Hình thức giảm</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'PERCENT' | 'FIXED')}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                  >
                    <option value="PERCENT">Theo phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (đ)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-zinc-300">
                    Giá trị giảm ({newType === 'PERCENT' ? '%' : 'VNĐ'})
                  </label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {newType === 'PERCENT' && (
                <div>
                  <label className="font-semibold text-zinc-300">Giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    value={newMaxDiscount}
                    onChange={(e) => setNewMaxDiscount(Number(e.target.value))}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-300">Đơn tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    value={newMinOrder}
                    onChange={(e) => setNewMinOrder(Number(e.target.value))}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-300">Giới hạn lượt dùng</label>
                  <input
                    type="number"
                    value={newUsageLimit}
                    onChange={(e) => setNewUsageLimit(Number(e.target.value))}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateVoucher}
                disabled={isSubmitting || !newCode.trim()}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
