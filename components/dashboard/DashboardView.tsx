'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CircleDollarSign,
  TrendingUp,
  Calendar,
  Download,
  FileSpreadsheet,
  ShoppingBag,
  Banknote,
  QrCode,
  Percent,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  ChevronRight,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { fetchRevenueReport, downloadRevenueExcel } from '@/lib/api/analytics.api';
import type { RevenueReportDTO } from '@/lib/api/types';
import { formatVND } from '@/lib/format';
import { useBranchStore } from '@/stores/branch.store';
import { useHeaderStore } from '@/stores/header.store';
import { formatDateInput, formatDisplayDate, parseDisplayDate, displayToApiDate, apiToDisplayDate, getDefaultReportRange } from '@/lib/date';

const PAYMENT_COLORS: Record<string, string> = {
  VIETQR: '#6366F1',
  CASH: '#F59E0B',
};

export default function DashboardView() {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const [mounted, setMounted] = useState(false);
  const defaultRange = getDefaultReportRange();
  const [startDate, setStartDate] = useState<string>(defaultRange.startDate); // DD-MM-YYYY
  const [endDate, setEndDate] = useState<string>(defaultRange.endDate);       // DD-MM-YYYY

  const [data, setData] = useState<RevenueReportDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Toggle chart metric (doanh thu vs số đơn)
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');

  // Search filter cho bảng chi tiết đơn
  const [orderSearch, setOrderSearch] = useState('');
  const [activeTableTab, setActiveTableTab] = useState<'daily' | 'orders'>('daily');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tải dữ liệu báo cáo từ API
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRevenueReport({
        startDate: displayToApiDate(startDate),
        endDate: displayToApiDate(endDate),
        branchId: selectedBranchId === 'ALL' ? 'ALL' : selectedBranchId,
      });
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được báo cáo doanh thu');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedBranchId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Xử lý xuất file Excel báo cáo doanh thu theo khoảng ngày
  const handleExportExcel = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await downloadRevenueExcel({
        startDate: displayToApiDate(startDate),
        endDate: displayToApiDate(endDate),
        branchId: selectedBranchId === 'ALL' ? 'ALL' : selectedBranchId,
      });
      setToastMsg({
        type: 'success',
        text: `Đã xuất thành công file Excel báo cáo doanh thu (${startDate} đến ${endDate})!`,
      });
    } catch (err: unknown) {
      setToastMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi khi xuất file Excel',
      });
    } finally {
      setExporting(false);
      setTimeout(() => setToastMsg(null), 5000);
    }
  }, [exporting, startDate, endDate, selectedBranchId]);

  const setCustomAction = useHeaderStore((s) => s.setCustomAction);

  // Đưa toàn bộ bộ lọc khoảng ngày & nút xuất Excel lên Topbar
  useEffect(() => {
    setCustomAction(
      <div className="flex items-center gap-2 shrink-0 py-0.5">
        {/* Date Pickers (Từ ngày - Đến ngày) */}
        <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 h-9 lg:h-10 rounded-2xl border border-[#E2E8F0] text-xs font-medium text-[#0F172A] shadow-2xs shrink-0">
          <Calendar className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <input
            type="date"
            value={displayToApiDate(startDate)}
            onChange={(e) => setStartDate(e.target.value ? apiToDisplayDate(e.target.value) : '')}
            className="w-[102px] bg-transparent outline-none text-[#0F172A] font-semibold text-[11.5px] cursor-pointer"
            title="Từ ngày"
          />
          <span className="text-[#94A3B8] text-[11px]">➔</span>
          <input
            type="date"
            value={displayToApiDate(endDate)}
            onChange={(e) => setEndDate(e.target.value ? apiToDisplayDate(e.target.value) : '')}
            className="w-[102px] bg-transparent outline-none text-[#0F172A] font-semibold text-[11.5px] cursor-pointer"
            title="Đến ngày"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="p-0.5 ml-0.5 text-[#94A3B8] hover:text-[#EF4444] rounded transition-colors cursor-pointer"
              title="Đặt lại khoảng ngày"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* NÚT TẢI BÁO CÁO DOANH THU FILE EXCEL */}
        <button
          onClick={handleExportExcel}
          disabled={exporting || loading}
          className={`h-9 lg:h-10 px-3.5 lg:px-4 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer whitespace-nowrap ${
            exporting || loading
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-[#00A389] hover:bg-[#008f77] text-white hover:shadow-md hover:shadow-emerald-500/20 active:scale-98'
          }`}
          title={`Tải báo cáo doanh thu file Excel (.xlsx) từ ${startDate || 'tất cả'} đến ${endDate || 'nay'}`}
        >
          {exporting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
          )}
          <span>{exporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
        </button>
      </div>
    );
    return () => setCustomAction(null);
  }, [setCustomAction, startDate, endDate, exporting, loading, handleExportExcel]);

  // Format dữ liệu biểu đồ xu hướng
  const chartData = useMemo(() => {
    if (!data?.dailyTrend) return [];
    return data.dailyTrend.map((d) => {
      // Rút gọn ngày 'YYYY-MM-DD' thành 'DD/MM' cho trục hoành
      const parts = d.date.split('-');
      const shortLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.date;
      return {
        ...d,
        shortDate: shortLabel,
      };
    });
  }, [data?.dailyTrend]);

  // Đơn hàng lọc theo ô tìm kiếm
  const filteredOrders = useMemo(() => {
    if (!data?.recentOrders) return [];
    if (!orderSearch.trim()) return data.recentOrders;
    const q = orderSearch.toLowerCase();
    return data.recentOrders.filter(
      (o) =>
        o.orderCode.toLowerCase().includes(q) ||
        o.tableName.toLowerCase().includes(q) ||
        o.paymentMethod.toLowerCase().includes(q)
    );
  }, [data?.recentOrders, orderSearch]);

  return (
    <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-y-auto min-h-0 pr-1 pb-10 view-scroll compact-y">
      {/* Toast thông báo xuất file */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold border animate-in slide-in-from-bottom duration-300 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-900/95 border-emerald-500/50 text-emerald-100'
              : 'bg-rose-900/95 border-rose-500/50 text-rose-100'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}



      {/* ERROR BANNER */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
        {/* Card 1: Tổng Doanh Thu */}
        <div className="bg-white rounded-3xl p-4 lg:p-5 border border-slate-100 shadow-xs relative overflow-hidden group hover:shadow-md transition min-w-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Tổng Doanh Thu</span>
            <div className="w-10 h-10 rounded-2xl bg-[#E6F7F4] text-[#00A389] flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl xl:text-3xl font-black text-[#0F172A] tracking-tight kpi-value">
            {data ? formatVND(data.summary.totalRevenue) : '0 ₫'}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {data && data.summary.growthPercent !== 0 && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  data.summary.growthPercent >= 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {data.summary.growthPercent >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {data.summary.growthPercent >= 0 ? '+' : ''}
                {data.summary.growthPercent}%
              </span>
            )}
            <span className="text-xs text-[#94A3B8] font-medium">so với kỳ trước</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-[#64748B]">
            <span>Tổng số đơn hoàn thành:</span>
            <strong className="text-[#0F172A]">{data?.summary.orderCount || 0} đơn</strong>
          </div>
        </div>

        {/* Card 2: Giá Trị Đơn Trung Bình (AOV) */}
        <div className="bg-white rounded-3xl p-4 lg:p-5 border border-slate-100 shadow-xs relative overflow-hidden group hover:shadow-md transition min-w-0">
          <div className="flex items-center justify-between mb-3 gap-2 min-w-0">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider truncate">Giá Trị TB / Đơn (AOV)</span>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl xl:text-3xl font-black text-[#0F172A] tracking-tight kpi-value">
            {data ? formatVND(data.summary.avgOrderValue) : '0 ₫'}
          </div>
          <div className="mt-2 text-xs text-[#94A3B8] font-medium">
            Trung bình mỗi đơn thanh toán
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-[#64748B]">
            <span>Tổng số đơn đã tính:</span>
            <strong className="text-teal-700">{data?.summary.orderCount || 0} đơn</strong>
          </div>
        </div>

        {/* Card 3: Doanh Thu VietQR */}
        <div className="bg-white rounded-3xl p-4 lg:p-5 border border-slate-100 shadow-xs relative overflow-hidden group hover:shadow-md transition min-w-0">
          <div className="flex items-center justify-between mb-3 gap-2 min-w-0">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider truncate">Chuyển Khoản VietQR</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl xl:text-3xl font-black text-[#0F172A] tracking-tight kpi-value">
            {data ? formatVND(data.summary.qrRevenue) : '0 ₫'}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {data && data.summary.totalRevenue > 0
                ? `${Math.round((data.summary.qrRevenue / data.summary.totalRevenue) * 100)}%`
                : '0%'}
            </span>
            <span className="text-xs text-[#94A3B8] font-medium">tỉ trọng thanh toán</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-[#64748B]">
            <span>Tiền vào tài khoản quán:</span>
            <strong className="text-indigo-600">Tự động đối soát</strong>
          </div>
        </div>

        {/* Card 4: Doanh Thu Tiền Mặt */}
        <div className="bg-white rounded-3xl p-4 lg:p-5 border border-slate-100 shadow-xs relative overflow-hidden group hover:shadow-md transition min-w-0">
          <div className="flex items-center justify-between mb-3 gap-2 min-w-0">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider truncate">Tiền Mặt</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl xl:text-3xl font-black text-[#0F172A] tracking-tight kpi-value">
            {data ? formatVND(data.summary.cashRevenue) : '0 ₫'}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {data && data.summary.totalRevenue > 0
                ? `${Math.round((data.summary.cashRevenue / data.summary.totalRevenue) * 100)}%`
                : '0%'}
            </span>
            <span className="text-xs text-[#94A3B8] font-medium">tỉ trọng thanh toán</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-[#64748B]">
            <span>Kênh thu ngân:</span>
            <strong className="text-amber-700">Thu tiền mặt trực tiếp</strong>
          </div>
        </div>
      </div>

      {/* CHARTS ROW (Biểu đồ xu hướng & Biểu đồ cơ cấu thanh toán) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Biểu đồ xu hướng doanh thu theo ngày */}
        <div className="xl:col-span-2 bg-white rounded-3xl p-4 sm:p-5 lg:p-6 border border-slate-100 shadow-xs flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00A389]" />
                <span>Xu Hướng Doanh Thu Theo Ngày</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Biến động doanh thu và lượng đơn đặt theo từng mốc thời gian
              </p>
            </div>
            <div className="flex items-center bg-[#F8FAFC] p-1 rounded-2xl border border-[#E2E8F0] shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  chartMetric === 'revenue'
                    ? 'bg-white text-[#00A389] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Doanh thu (₫)
              </button>
              <button
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  chartMetric === 'orders'
                    ? 'bg-white text-[#00A389] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Số đơn
              </button>
            </div>
          </div>

          <div className="h-60 lg:h-72 w-full min-w-0">
            {mounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00A389" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00A389" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="shortDate"
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(val) =>
                      chartMetric === 'revenue'
                        ? val >= 1000000
                          ? `${(val / 1000000).toFixed(1)}M`
                          : val >= 1000
                          ? `${(val / 1000).toFixed(0)}k`
                          : String(val)
                        : String(val)
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#0F172A] text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 border border-slate-700 min-w-[160px]">
                            <p className="text-slate-400 font-semibold">{d.date}</p>
                            <p className="text-emerald-400 font-bold text-sm">
                              {formatVND(d.revenue)}
                            </p>
                            <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-300 space-y-0.5">
                              <div>Số đơn: <strong className="text-white">{d.orders}</strong></div>
                              <div>VietQR: <strong className="text-indigo-300">{formatVND(d.vietqr)}</strong></div>
                              <div>Tiền mặt: <strong className="text-amber-300">{formatVND(d.cash)}</strong></div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {chartMetric === 'revenue' ? (
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#00A389"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                    />
                  ) : (
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="#6366F1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#ordersGrad)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Đang tải dữ liệu biểu đồ...
              </div>
            )}
          </div>
        </div>

        {/* Biểu đồ cơ cấu phương thức thanh toán */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-[#00A389]" />
              <span>Cơ Cấu Thanh Toán</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Phân bổ dòng tiền theo 2 kênh: VietQR & Tiền mặt
            </p>
          </div>

          <div className="h-44 lg:h-52 w-full my-3 flex items-center justify-center min-w-0">
            {mounted && data?.paymentBreakdown && data.paymentBreakdown.some((p) => p.amount > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.paymentBreakdown.filter((p) => p.amount > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                    {data.paymentBreakdown.map((entry) => (
                      <Cell
                        key={`cell-${entry.method}`}
                        fill={PAYMENT_COLORS[entry.method] || '#00A389'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatVND(Number(value)), 'Thực nhận']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10 text-xs text-[#94A3B8]">
                Chưa có giao dịch thanh toán trong khoảng ngày này
              </div>
            )}
          </div>

          {/* Legend chi tiết kênh thanh toán */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {data?.paymentBreakdown.map((item) => (
              <div key={item.method} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PAYMENT_COLORS[item.method] || '#00A389' }}
                  />
                  <span className="font-bold text-[#0F172A]">{item.label}</span>
                  <span className="text-[#94A3B8] font-medium">({item.percentage}%)</span>
                </div>
                <strong className="text-[#0F172A] font-mono">{formatVND(item.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP MÓN DOANH THU & DANH MỤC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top món đóng góp doanh thu nhiều nhất */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[#00A389]" />
                <span>Top Món Bán Chạy Nhất (Doanh Thu)</span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Các món ăn & thức uống đóng góp tỉ trọng doanh thu lớn nhất
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Top 10
            </span>
          </div>

          {data && data.topItems.length > 0 ? (
            <div className="space-y-3.5">
              {data.topItems.map((item, idx) => {
                const maxRevenue = data.topItems[0]?.revenue || 1;
                const percent = Math.min(100, Math.round((item.revenue / maxRevenue) * 100));
                return (
                  <div key={idx} className="flex flex-col gap-1.5 group">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="text-[#0F172A] truncate">{item.name}</span>
                        <span className="text-[#94A3B8] font-normal hidden sm:inline">
                          ({item.category})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[#64748B] font-semibold">
                          {item.soldCount} suất
                        </span>
                        <span className="text-[#00A389] font-black font-mono">
                          {formatVND(item.revenue)}
                        </span>
                      </div>
                    </div>
                    {/* Thanh tiến trình phần trăm */}
                    <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#00A389] h-full rounded-full transition-all duration-500 group-hover:bg-[#008f77]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#94A3B8]">
              Chưa có dữ liệu món bán trong khoảng thời gian này
            </div>
          )}
        </div>

        {/* Cơ cấu doanh thu theo Danh mục */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#00A389]" />
              <span>Doanh Thu Theo Nhóm Món</span>
            </h2>
          </div>

          <div className="space-y-3 my-4">
            {data && data.categoryBreakdown.length > 0 ? (
              data.categoryBreakdown.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-[#0F172A]">{cat.category}</div>
                    <div className="text-[11px] text-[#64748B]">{cat.count} suất đã bán</div>
                  </div>
                  <strong className="text-[#00A389] text-xs font-mono font-black">
                    {formatVND(cat.revenue)}
                  </strong>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#94A3B8]">
                Chưa có dữ liệu danh mục
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-[#94A3B8] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Thống kê từ các phiên bàn đã hoàn tất thanh toán</span>
          </div>
        </div>
      </div>

      {/* BẢNG KÊ CHI TIẾT DOANH THU (THEO NGÀY & DANH SÁCH ĐƠN HÀNG) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex bg-[#F8FAFC] p-1 rounded-2xl border border-[#E2E8F0]">
              <button
                onClick={() => setActiveTableTab('daily')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTableTab === 'daily'
                    ? 'bg-white text-[#00A389] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Bảng Kê Theo Ngày ({data?.dailyTrend.length || 0})
              </button>
              <button
                onClick={() => setActiveTableTab('orders')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTableTab === 'orders'
                    ? 'bg-white text-[#00A389] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Danh Sách Đơn Hàng ({data?.recentOrders.length || 0})
              </button>
            </div>
          </div>

          {activeTableTab === 'orders' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="tìm kiếm..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] focus:outline-hidden focus:border-[#00A389] font-medium"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Bảng kê theo ngày */}
        {activeTableTab === 'daily' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[#64748B] font-bold uppercase text-[11px]">
                  <th className="py-3 px-3">Ngày</th>
                  <th className="py-3 px-3 text-center">Số Đơn</th>
                  <th className="py-3 px-3 text-right">Tiền Mặt</th>
                  <th className="py-3 px-3 text-right">VietQR</th>
                  <th className="py-3 px-3 text-right text-[#00A389]">Tổng Doanh Thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data && data.dailyTrend.length > 0 ? (
                  data.dailyTrend.map((row) => (
                    <tr key={row.date} className="hover:bg-[#F8FAFC] transition">
                      <td className="py-3 px-3 font-bold text-[#0F172A]">{row.date}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#0F172A] font-bold text-[11px]">
                          {row.orders}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#64748B]">
                        {formatVND(row.cash)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-600 font-bold">
                        {formatVND(row.vietqr)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-[#00A389]">
                        {formatVND(row.revenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Chưa có dữ liệu theo ngày
                    </td>
                  </tr>
                )}
              </tbody>
              {data && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-[#F8FAFC] font-black text-xs text-[#0F172A]">
                    <td className="py-3 px-3">TỔNG CỘNG</td>
                    <td className="py-3 px-3 text-center">{data.summary.orderCount} đơn</td>
                    <td className="py-3 px-3 text-right font-mono">{formatVND(data.summary.cashRevenue)}</td>
                    <td className="py-3 px-3 text-right font-mono text-indigo-700">{formatVND(data.summary.qrRevenue)}</td>
                    <td className="py-3 px-3 text-right font-mono text-base text-[#00A389]">{formatVND(data.summary.totalRevenue)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Tab 2: Danh sách đơn hàng hoàn thành */}
        {activeTableTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[#64748B] font-bold uppercase text-[11px]">
                  <th className="py-3 px-3">Mã Đơn</th>
                  <th className="py-3 px-3">Bàn Phục Vụ</th>
                  <th className="py-3 px-3">Thời Gian</th>
                  <th className="py-3 px-3 text-center">Phương Thức</th>
                  <th className="py-3 px-3 text-center">Trạng Thái</th>
                  <th className="py-3 px-3 text-right text-[#00A389]">Tổng Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="py-3 px-3 font-black text-[#0F172A]">{ord.orderCode}</td>
                      <td className="py-3 px-3 font-semibold text-[#64748B]">{ord.tableName}</td>
                      <td className="py-3 px-3 text-[#94A3B8]">
                        {new Date(ord.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            ord.paymentMethod === 'VIETQR'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {ord.paymentMethod === 'VIETQR' ? 'VietQR' : 'Tiền mặt'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          {ord.status === 'DONE' ? 'Hoàn thành' : ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-[#00A389]">
                        {formatVND(ord.totalAmount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Không tìm thấy đơn hàng phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
