'use client';

import React, { useState, useEffect, useCallback } from 'react';
import RevenueTrendChart, { HourlyTrendPoint } from '../../../components/dashboard/RevenueTrendChart';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  QrCode,
  Flame,
  ArrowUpRight,
  Plus,
  RefreshCw,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '../../../context/i18nContext';
import apiFetch from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth.store';

interface TopItem {
  name: string;
  soldCount: number;
  revenue: number;
  category: string;
}

interface AnalyticsOverviewData {
  branch: {
    id: string;
    name: string;
    code: string;
  };
  date: string;
  kpis: {
    revenue: {
      today: number;
      yesterday: number;
      growthPercent: number;
    };
    orders: {
      count: number;
      avgOrderValue: number;
    };
    vietqr: {
      sharePercent: number;
      totalAmount: number;
    };
    tables: {
      occupied: number;
      total: number;
      pendingKitchen: number;
    };
  };
  hourlyTrend: HourlyTrendPoint[];
  topItems: TopItem[];
}

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();

  const [overview, setOverview] = useState<AnalyticsOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const branchParam = user?.branchId ? `?branchId=${encodeURIComponent(user.branchId)}` : '?branchId=default-branch';
      const res = await apiFetch<AnalyticsOverviewData>(`/analytics/overview${branchParam}`);
      if (res.success && res.data) {
        setOverview(res.data);
      } else {
        setError(res.message || t('dashboard.errorLoading', 'Không thể tải dữ liệu phân tích'));
      }
    } catch {
      setError(t('dashboard.errorLoading', 'Không thể tải dữ liệu phân tích'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, t]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const kpis = overview?.kpis;
  const isAllZero =
    kpis &&
    kpis.revenue.today === 0 &&
    kpis.orders.count === 0 &&
    kpis.vietqr.sharePercent === 0 &&
    kpis.tables.occupied === 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            {t('dashboard.title', 'TỔNG QUAN HOẠT ĐỘNG KINH DOANH')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {overview?.branch?.name
              ? `${overview.branch.name} — ${t('dashboard.subtitle', 'Dữ liệu trực tiếp theo thời gian thực của chi nhánh hôm nay')}`
              : t('dashboard.subtitle', 'Dữ liệu trực tiếp theo thời gian thực của chi nhánh hôm nay')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchOverview}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-xl transition disabled:opacity-50"
            title={t('common.refresh', 'Làm mới')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh', 'Làm mới')}</span>
          </button>
          <Link
            href="/admin/menu"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('dashboard.addMenuItem', 'Thêm Món Mới')}</span>
          </Link>
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
          >
            <span>{t('dashboard.openPos', 'Mở POS Bán Hàng')}</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchOverview}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg font-semibold transition"
          >
            {t('common.retry', 'Thử lại')}
          </button>
        </div>
      )}

      {/* Empty Data Banner (when all KPIs are 0) */}
      {!isLoading && !error && isAllZero && (
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-2.5 text-xs text-zinc-400">
          <Inbox className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{t('dashboard.emptyData', 'Chưa có dữ liệu giao dịch cho ngày hôm nay')}</span>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">{t('dashboard.todayRevenue', 'Doanh thu hôm nay')}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-2xl font-black text-zinc-100">
                  {kpis ? `${kpis.revenue.today.toLocaleString('vi-VN')}đ` : '0đ'}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    {kpis
                      ? `${kpis.revenue.growthPercent >= 0 ? `+${kpis.revenue.growthPercent}%` : `${kpis.revenue.growthPercent}%`} ${t('dashboard.vsYesterday', 'so với hôm qua')}`
                      : `0% ${t('dashboard.vsYesterday', 'so với hôm qua')}`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hóa đơn */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">{t('dashboard.orderCount', 'Số lượng hóa đơn')}</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-2xl font-black text-zinc-100">
                  {kpis ? `${kpis.orders.count} ${t('dashboard.unitOrder', 'đơn')}` : `0 ${t('dashboard.unitOrder', 'đơn')}`}
                </span>
                <p className="text-xs text-zinc-400 mt-1">
                  {t('dashboard.avgOrderValue', 'Giá trị trung bình')}:{' '}
                  {kpis ? `${kpis.orders.avgOrderValue.toLocaleString('vi-VN')}đ/${t('dashboard.unitOrder', 'đơn')}` : `0đ/${t('dashboard.unitOrder', 'đơn')}`}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Thanh toán VietQR */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">{t('dashboard.vietqrPayment', 'Thanh toán VietQR')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-20 bg-zinc-800 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-2xl font-black text-zinc-100">
                  {kpis ? `${kpis.vietqr.sharePercent}%` : '0%'}
                </span>
                <p className="text-xs text-zinc-400 mt-1">
                  {kpis ? `${kpis.vietqr.totalAmount.toLocaleString('vi-VN')}đ` : '0đ'} {t('dashboard.qrTransfers', 'qua Chuyển khoản QR')}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Đang phục vụ */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">{t('dashboard.activeTables', 'Bàn đang mở')}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-28 bg-zinc-800 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-2xl font-black text-zinc-100">
                  {kpis ? `${kpis.tables.occupied} / ${kpis.tables.total} ${t('dashboard.unitTable', 'bàn')}` : `0 / 0 ${t('dashboard.unitTable', 'bàn')}`}
                </span>
                <p className="text-xs text-amber-400 font-semibold mt-1">
                  {kpis ? `${kpis.tables.pendingKitchen} ${t('dashboard.ordersPendingKitchen', 'món đang chờ bếp nấu')}` : `0 ${t('dashboard.ordersPendingKitchen', 'món đang chờ bếp nấu')}`}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts & Top Sellers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 24h Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-zinc-100">
                {t('dashboard.revenueHourlyTrend', 'Xu Hướng Doanh Thu Theo Giờ')}
              </h3>
              <p className="text-xs text-zinc-400">
                {t('dashboard.peakHoursDesc', 'Đỉnh doanh thu thường tập trung lúc 12:00 và 18:00 - 20:00')}
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="w-full h-72 rounded-2xl bg-zinc-800/40 animate-pulse flex items-center justify-center text-zinc-600 text-xs">
              {t('common.loading', 'Đang tải...')}
            </div>
          ) : (
            <RevenueTrendChart data={overview?.hourlyTrend} />
          )}
        </div>

        {/* Right: Top 5 Best-Selling Items */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-extrabold text-sm text-zinc-100">
                {t('dashboard.topSellingToday', 'Top Món Bán Chạy Hôm Nay')}
              </h3>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                {t('dashboard.byQuantity', 'Theo số lượng')}
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {isLoading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 bg-zinc-800/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : overview?.topItems && overview.topItems.length > 0 ? (
                overview.topItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-400 text-[11px] font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-zinc-200">{item.name}</p>
                        <p className="text-[10px] text-zinc-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-400">
                        {item.soldCount} {t('dashboard.unitPortion', 'phần')}
                      </span>
                      <p className="text-[10px] text-zinc-400">
                        {item.revenue.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-500 text-xs">
                  <Inbox className="w-8 h-8 text-zinc-600 mb-2" />
                  <span>{t('dashboard.noTopItems', 'Chưa có món bán chạy trong ngày')}</span>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/admin/menu"
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-center font-bold text-xs text-zinc-200 rounded-xl transition"
          >
            {t('dashboard.manageMenu', 'Quản Lý Toàn Bộ Thực Đơn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
