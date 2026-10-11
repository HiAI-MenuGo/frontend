'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  History,
  Search,
  X,
  Clock,
  RefreshCw,
  Printer,
  CheckCircle2,
  XCircle,
  Eye,
  Banknote,
  QrCode,
  Receipt,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  Building2,
} from 'lucide-react';
import { formatVND } from '@/lib/format';
import { fetchOrderHistory, voidOrder, downloadOrderHistoryExcel } from '@/lib/api/orders.api';
import type { LiveOrderDTO } from '@/lib/api/types';
import { useSocket } from '@/context/SocketContext';
import { BillPrintModal } from '@/components/payment/BillPrintModal';
import { useBranchStore } from '@/stores/branch.store';
import { displayToApiDate, apiToDisplayDate, getDefaultReportRange } from '@/lib/date';

export interface HistoryOrderItem {
  id: string;
  code: string;
  table: string;
  time: string;
  total: number;
  status: 'COMPLETED' | 'VOIDED';
  method: 'CASH' | 'VIETQR' | string;
  staff: string;
  createdAt: string;
  branchName?: string;
  branchCode?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    note?: string;
  }>;
}

export default function OrderHistoryView() {
  const [orders, setOrders] = useState<HistoryOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'VOIDED'>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'CASH' | 'VIETQR'>('ALL');

  // Khoảng ngày lọc & xuất Excel
  const defaultRange = getDefaultReportRange();
  const [startDate, setStartDate] = useState<string>(defaultRange.startDate); // DD-MM-YYYY
  const [endDate, setEndDate] = useState<string>(defaultRange.endDate);       // DD-MM-YYYY
  const [exporting, setExporting] = useState(false);

  // Modal Chi Tiết Hoá Đơn
  const [detailOrder, setDetailOrder] = useState<HistoryOrderItem | null>(null);

  // Modal In Hoá Đơn
  const [printOrder, setPrintOrder] = useState<HistoryOrderItem | null>(null);

  // Modal Huỷ đơn
  const [voidingOrder, setVoidingOrder] = useState<HistoryOrderItem | null>(null);
  const [voidReason, setVoidReason] = useState('Khách đổi ý');
  const [voidLoading, setVoidLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  }, []);

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  // Tải dữ liệu lịch sử đơn từ API CSDL thật
  const loadHistory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const branchId = selectedBranchId === 'ALL' ? 'ALL' : selectedBranchId;
      const res = await fetchOrderHistory(
        branchId,
        1,
        100,
        searchQuery || undefined,
        startDate ? displayToApiDate(startDate) : undefined,
        endDate ? displayToApiDate(endDate) : undefined
      );
      if (res && res.orders) {
        const formatted: HistoryOrderItem[] = res.orders.map((o: LiveOrderDTO) => ({
          id: o.id,
          code: o.code || `H-${o.id.slice(-3).toUpperCase()}`,
          table: o.tableName || (o.tableId ? `Bàn ${o.tableId}` : o.customerName || 'Mang về'),
          time: o.time || new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          total: o.total,
          status: o.status === 'CANCELLED' ? 'VOIDED' : 'COMPLETED',
          method: o.paymentMethod || 'CASH',
          staff: o.customerName || 'Nhân viên quầy',
          createdAt: o.createdAt,
          branchName: o.branchName,
          branchCode: o.branchCode,
          items: (o.items || []).map((it) => ({
            name: it.name,
            quantity: it.quantity,
            price: it.price,
            note: it.note,
          })),
        }));
        setOrders(formatted);
      } else {
        setOrders([]);
      }
    } catch (e: unknown) {
      if (!silent) setError(e instanceof Error ? e.message : 'Không tải được lịch sử đơn hàng');
      setOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [searchQuery, startDate, endDate, selectedBranchId]);

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const branchId = selectedBranchId === 'ALL' ? 'ALL' : selectedBranchId;
      await downloadOrderHistoryExcel({
        branchId,
        startDate: startDate ? displayToApiDate(startDate) : undefined,
        endDate: endDate ? displayToApiDate(endDate) : undefined,
        search: searchQuery || undefined,
        status: statusFilter,
      });
      showToast('success', 'Đã tải thành công file Excel danh sách lịch sử đơn hàng!');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Lỗi khi xuất file Excel');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHistory();
  }, [loadHistory]);

  // Realtime Socket
  const { on, off, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const onPaymentCompleted = () => {
      loadHistory(true);
    };

    const onOrderUpdated = () => {
      loadHistory(true);
    };

    on('payment:completed', onPaymentCompleted);
    on('order:updated', onOrderUpdated);

    return () => {
      off('payment:completed', onPaymentCompleted);
      off('order:updated', onOrderUpdated);
    };
  }, [isConnected, on, off, loadHistory]);

  // Thống kê
  const completedCount = useMemo(() => orders.filter((o) => o.status === 'COMPLETED').length, [orders]);
  const voidedCount = useMemo(() => orders.filter((o) => o.status === 'VOIDED').length, [orders]);
  const totalCompletedRevenue = useMemo(
    () => orders.filter((o) => o.status === 'COMPLETED').reduce((sum, o) => sum + o.total, 0),
    [orders]
  );

  // Lọc dữ liệu
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
      if (methodFilter !== 'ALL' && order.method !== methodFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = order.code.toLowerCase().includes(q);
        const matchTable = order.table.toLowerCase().includes(q);
        const matchStaff = order.staff.toLowerCase().includes(q);
        const matchItem = order.items.some((it) => it.name.toLowerCase().includes(q));
        if (!matchCode && !matchTable && !matchStaff && !matchItem) return false;
      }

      return true;
    });
  }, [orders, statusFilter, methodFilter, searchQuery]);

  // Huỷ đơn hàng
  const handleConfirmVoid = async () => {
    if (!voidingOrder) return;
    try {
      setVoidLoading(true);
      await voidOrder(voidingOrder.id, voidReason);
      setOrders((prev) =>
        prev.map((o) => (o.id === voidingOrder.id ? { ...o, status: 'VOIDED', method: 'Huỷ món' } : o))
      );
      showToast('success', `Đã huỷ đơn hàng "${voidingOrder.code}"`);
      setVoidingOrder(null);
    } catch {
      // Local optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === voidingOrder.id ? { ...o, status: 'VOIDED', method: 'Huỷ món' } : o))
      );
      showToast('success', `Đã cập nhật trạng thái huỷ đơn "${voidingOrder.code}"`);
      setVoidingOrder(null);
    } finally {
      setVoidLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
      {/* Toast thông báo */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border bg-white ${
              toast.type === 'success' ? 'border-emerald-200 text-[#0F172A]' : 'border-rose-200 text-[#0F172A]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span className="text-[13px] font-bold">{toast.text}</span>
            <button onClick={() => setToast(null)} className="text-[#94A3B8] hover:text-[#0F172A] p-1">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header & Metrics */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-4 shrink-0 shadow-2xs">
        {/* Metric cards (Cân đều 100% chiều rộng, không bị lệch) */}
        <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full">
          <div className="flex-1 min-w-0 bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-xs">
            <div>
              <p className="text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider text-[#64748B]">TỔNG SỐ ĐƠN</p>
              <p className="text-[20px] 2xl:text-[22px] font-black text-[#0F172A] mt-0.5">{orders.length} đơn</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#F1F5F9] flex items-center justify-center text-[#475569] shrink-0">
              <Receipt size={22} />
            </div>
          </div>

          <div className="flex-1 min-w-0 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-xs">
            <div>
              <p className="text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">HOÀN THÀNH</p>
              <p className="text-[20px] 2xl:text-[22px] font-black text-emerald-800 mt-0.5">{completedCount} đơn</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="flex-1 min-w-0 bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-xs">
            <div>
              <p className="text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider text-rose-700">ĐÃ HUỶ / TRẢ</p>
              <p className="text-[20px] 2xl:text-[22px] font-black text-rose-800 mt-0.5">{voidedCount} đơn</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <XCircle size={22} />
            </div>
          </div>

          <div className="flex-1 min-w-0 bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-xs">
            <div>
              <p className="text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider text-purple-700">DOANH THU ĐÃ THU</p>
              <p className="text-[20px] 2xl:text-[22px] font-black text-purple-800 mt-0.5 tracking-tight">
                {formatVND(totalCompletedRevenue)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>

        {/* Toolbar: Tìm kiếm, lọc thời gian, trạng thái, thanh toán */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4 pt-3 border-t border-[#F1F5F9]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn, tên bàn, món ăn, nhân viên..."
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
            {/* Lọc trạng thái */}
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`h-9 px-3 rounded-xl text-[12px] font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`h-9 px-3 rounded-xl text-[12px] font-bold transition-all ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-[#E2E8F0] text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Hoàn thành ({completedCount})
            </button>
            <button
              onClick={() => setStatusFilter('VOIDED')}
              className={`h-9 px-3 rounded-xl text-[12px] font-bold transition-all ${
                statusFilter === 'VOIDED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-[#E2E8F0] text-rose-700 hover:bg-rose-50'
              }`}
            >
              Đã huỷ ({voidedCount})
            </button>

            {/* Lọc phương thức thanh toán */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as 'ALL' | 'CASH' | 'VIETQR')}
              className="h-9 px-3 rounded-xl bg-white border border-[#E2E8F0] text-[12px] font-bold text-[#334155] focus:outline-hidden focus:border-[#00A389]"
            >
              <option value="ALL">Mọi hình thức</option>
              <option value="CASH">Tiền mặt</option>
              <option value="VIETQR">VietQR</option>
            </select>

            {/* Lọc khoảng ngày trực tiếp */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 h-9 rounded-xl border border-[#E2E8F0] text-[12px] font-medium text-[#0F172A]">
              <Calendar className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
              <input
                type="date"
                value={displayToApiDate(startDate)}
                onChange={(e) => setStartDate(e.target.value ? apiToDisplayDate(e.target.value) : '')}
                className="bg-transparent outline-none text-[#0F172A] font-semibold text-[11.5px] cursor-pointer"
                title="Từ ngày"
              />
              <span className="text-[#94A3B8]">➔</span>
              <input
                type="date"
                value={displayToApiDate(endDate)}
                onChange={(e) => setEndDate(e.target.value ? apiToDisplayDate(e.target.value) : '')}
                className="bg-transparent outline-none text-[#0F172A] font-semibold text-[11.5px] cursor-pointer"
                title="Đến ngày"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="p-0.5 ml-0.5 text-[#94A3B8] hover:text-[#EF4444] rounded transition-colors"
                  title="Đặt lại khoảng ngày"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* NÚT TẢI BÁO CÁO EXCEL DANH SÁCH ĐƠN HÀNG */}
            <button
              onClick={handleExportExcel}
              disabled={exporting || loading}
              className={`h-9 px-3.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                exporting || loading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#00A389] hover:bg-[#008f77] text-white hover:shadow-xs active:scale-98'
              }`}
              title="Tải báo cáo danh sách đơn hàng file Excel (.xlsx) theo khoảng ngày"
            >
              {exporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
              )}
              <span>{exporting ? 'Đang xuất...' : 'Tải Báo Cáo Excel'}</span>
            </button>

            </div>
          </div>
        </div>

      {/* Danh sách Lịch Sử Đơn Hàng (Table) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#00A389] animate-spin" />
            <p className="text-[13px] font-bold text-[#64748B]">Đang tải lịch sử đơn hàng...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
            <p className="text-[14px] font-extrabold text-[#0F172A]">{error}</p>
            <button
              onClick={() => loadHistory(false)}
              className="px-4 py-2 bg-[#00A389] text-white rounded-xl text-[12px] font-bold inline-flex items-center gap-2"
            >
              <RefreshCw size={14} /> Thử lại
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-[#CBD5E1] max-w-md mx-auto mt-6">
            <History size={40} className="text-[#94A3B8] mx-auto mb-3" />
            <h3 className="text-[16px] font-black text-[#0F172A]">Chưa có đơn hàng nào khớp bộ lọc</h3>
            <p className="text-[12px] text-[#64748B] mt-1">
              Thử thay đổi mốc thời gian hoặc từ khoá tìm kiếm để kiểm tra lại lịch sử giao dịch.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-xs">
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full table-fixed text-left border-collapse">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[10%]" />
                  <col className="w-[16%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[11%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC] text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                    <th className="py-3.5 px-3 truncate">Mã Hoá Đơn</th>
                    <th className="py-3.5 px-3 truncate">Bàn / Khách</th>
                    <th className="py-3.5 px-3 truncate">Thời Gian</th>
                    <th className="py-3.5 px-3 truncate">Món Đã Gọi</th>
                    <th className="py-3.5 px-3 truncate">Hình Thức</th>
                    <th className="py-3.5 px-3 truncate">Tổng Tiền</th>
                    <th className="py-3.5 px-3 truncate">Trạng Thái</th>
                    <th className="py-3.5 px-3 text-right truncate">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[13px]">
                  {filteredOrders.map((order) => {
                    const isCompleted = order.status === 'COMPLETED';
                    const isCash = order.method === 'CASH' || order.method === 'Tiền mặt';

                    return (
                      <tr key={order.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        {/* Mã đơn */}
                        <td className="py-3.5 px-3">
                          <span className="font-black text-[#0F172A] tracking-tight block truncate">
                            {order.code}
                          </span>
                          {order.branchName && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200 mt-1 max-w-full">
                              <Building2 size={10} className="shrink-0" />
                              <span className="truncate">{order.branchName}</span>
                            </span>
                          )}
                        </td>

                        {/* Bàn / Khách */}
                        <td className="py-3.5 px-3">
                          <p className="font-extrabold text-[#0F172A] text-[13px] truncate" title={order.table}>
                            {order.table}
                          </p>
                          <p className="text-[12px] text-[#94A3B8] font-medium mt-0.5 truncate" title={order.staff}>
                            {order.staff}
                          </p>
                        </td>

                        {/* Thời gian */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5 text-[12.5px] text-[#64748B] font-medium">
                            <Clock size={13} className="text-[#94A3B8] shrink-0" />
                            <span className="truncate">{order.time}</span>
                          </div>
                        </td>

                        {/* Tóm tắt món */}
                        <td className="py-3.5 px-3">
                          {(() => {
                            const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                            const fullText = order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
                            const displayText =
                              order.items.length > 2
                                ? `${order.items.slice(0, 2).map((i) => `${i.quantity}x ${i.name}`).join(', ')}, ...`
                                : fullText;

                            if (order.items.length === 0) {
                              return (
                                <span className="text-[11px] text-[#94A3B8] font-medium">—</span>
                              );
                            }

                            return (
                              <div className="min-w-0">
                                <p
                                  className="truncate text-[#475569] font-medium text-[11.5px] leading-tight"
                                  title={fullText}
                                >
                                  {displayText}
                                </p>
                                <span className="inline-block text-[10px] text-[#64748B] bg-slate-100 font-bold px-1.5 py-0.5 rounded mt-0.5">
                                  {totalQty} món
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Hình thức thanh toán */}
                        <td className="py-3.5 px-3">
                          {isCash ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              <Banknote size={12} className="shrink-0" />
                              Tiền mặt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                              <QrCode size={12} className="shrink-0" />
                              VietQR
                            </span>
                          )}
                        </td>

                        {/* Tổng tiền */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`font-black text-[14px] block truncate ${
                              isCompleted ? 'text-emerald-600' : 'text-[#94A3B8] line-through'
                            }`}
                          >
                            {formatVND(order.total)}
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3.5 px-3">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              <CheckCircle2 size={12} className="shrink-0" />
                              Hoàn thành
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                              <XCircle size={12} className="shrink-0" />
                              Đã huỷ
                            </span>
                          )}
                        </td>

                        {/* Thao tác (Chỉ giữ lại nút Chi tiết duy nhất) */}
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => setDetailOrder(order)}
                            className="h-8.5 px-3 rounded-xl bg-[#F8FAFC] hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-[#E2E8F0] font-bold text-[12px] text-[#475569] inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-[0.98] whitespace-nowrap cursor-pointer"
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye size={13} className="shrink-0" />
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
      {/* MODAL 1: CHI TIẾT ĐƠN HÀNG LỊCH SỬ */}
      {/* ============================================================== */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E2E8F0] relative">
            <button
              onClick={() => setDetailOrder(null)}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-[#F8FAFC]"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Receipt size={20} />
              </div>
              <div>
                <h3 className="text-[18px] font-black text-[#0F172A]">Chi Tiết Đơn {detailOrder.code}</h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-[12px] text-[#64748B]">
                    {detailOrder.table} • Lúc {detailOrder.time} • Thu ngân: {detailOrder.staff}
                  </p>
                  {detailOrder.branchName && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      <Building2 size={11} className="shrink-0" />
                      <span>{detailOrder.branchName}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Trạng thái & hình thức */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-[12px]">
              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block mb-0.5">Trạng thái:</span>
                <span
                  className={`font-black ${detailOrder.status === 'COMPLETED' ? 'text-emerald-700' : 'text-rose-700'}`}
                >
                  {detailOrder.status === 'COMPLETED' ? 'Thanh toán thành công' : 'Đơn đã huỷ'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] block mb-0.5">Hình thức:</span>
                <span className="font-black text-[#0F172A]">
                  {detailOrder.method === 'VIETQR' ? 'Chuyển khoản VietQR' : 'Tiền mặt tại quầy'}
                </span>
              </div>
            </div>

            {/* Danh sách món */}
            <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#64748B]">
                Danh sách món ({detailOrder.items.length})
              </p>
              {detailOrder.items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#F1F5F9] flex items-center justify-between text-[12.5px]"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-[#00A389]">{it.quantity}x</span>
                      <span className="font-bold text-[#0F172A]">{it.name}</span>
                    </div>
                    {it.note && <p className="text-[11px] text-amber-700 italic mt-0.5">Ghi chú: {it.note}</p>}
                    <p className="text-[11px] text-[#94A3B8]">Đơn giá: {formatVND(it.price)}</p>
                  </div>
                  <span className="font-black text-[#0F172A]">{formatVND(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Tổng cộng */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 mb-5 flex items-center justify-between">
              <span className="text-[13px] font-black text-purple-900">TỔNG TIỀN THANH TOÁN:</span>
              <span className="text-[22px] font-black text-purple-900">{formatVND(detailOrder.total)}</span>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPrintOrder(detailOrder);
                  setDetailOrder(null);
                }}
                className="flex-1 h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-md shadow-[#00A389]/20 transition-all active:scale-[0.98]"
              >
                <Printer size={16} />
                <span>In Lại Hoá Đơn</span>
              </button>

              {detailOrder.status === 'COMPLETED' && (
                <button
                  type="button"
                  onClick={() => {
                    const ord = detailOrder;
                    setDetailOrder(null);
                    setVoidingOrder(ord);
                    setVoidReason('Khách đổi ý');
                  }}
                  className="h-11 px-4 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border border-[#E2E8F0] hover:border-rose-200 font-bold text-[13px] flex items-center justify-center gap-1.5 transition-all"
                  title="Huỷ / Trả đơn"
                >
                  <XCircle size={15} />
                  <span>Huỷ đơn</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="h-11 px-4 rounded-2xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[13px] font-bold text-[#64748B] hover:text-[#0F172A] transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: HUỶ ĐƠN HÀNG */}
      {/* ============================================================== */}
      {voidingOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <XCircle size={24} />
            </div>
            <h3 className="text-[17px] font-black text-[#0F172A]">Huỷ Đơn Hàng?</h3>
            <p className="text-[12.5px] text-[#64748B] mt-1">
              Bạn có chắc muốn huỷ đơn <strong className="text-[#0F172A]">{voidingOrder.code}</strong> ({voidingOrder.table})?
            </p>

            <div className="my-4 text-left">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1">
                Lý do huỷ:
              </label>
              <select
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[12.5px] font-bold text-[#0F172A] focus:outline-hidden"
              >
                <option value="Khách đổi ý">Khách đổi ý / huỷ món</option>
                <option value="Nhân viên nhập nhầm">Nhân viên order nhầm</option>
                <option value="Món bị lỗi / hết nguyên liệu">Món bị lỗi / hết nguyên liệu</option>
                <option value="Khác">Lý do khác</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setVoidingOrder(null)}
                className="flex-1 h-11 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] font-bold text-[#64748B]"
              >
                Bỏ qua
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                disabled={voidLoading}
                className="flex-1 h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[13px] flex items-center justify-center gap-1.5"
              >
                {voidLoading ? <RefreshCw size={15} className="animate-spin" /> : <XCircle size={15} />}
                <span>Huỷ Đơn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: IN LẠI PHIẾU HOÁ ĐƠN */}
      {/* ============================================================== */}
      {printOrder && (
        <BillPrintModal
          isOpen={!!printOrder}
          onClose={() => setPrintOrder(null)}
          tableNumber={printOrder.table}
          orderNumber={printOrder.code}
          items={printOrder.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          }))}
          subtotal={printOrder.total}
          tax={0}
          total={printOrder.total}
          paymentMethod={printOrder.method === 'VIETQR' ? 'scan' : 'cash'}
          storeName="MenuGO"
        />
      )}
    </div>
  );
}
