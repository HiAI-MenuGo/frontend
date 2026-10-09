'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp, Users, UtensilsCrossed, DollarSign, Clock,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { fetchAnalyticsOverview } from '@/lib/api/analytics.api';
import type { AnalyticsOverviewDTO } from '@/lib/api/types';
import { formatVND } from '@/lib/format';

function LoadingSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-[20px] border border-slate-100" />)}
      </div>
      <div className="h-64 bg-white rounded-[24px] border border-slate-100" />
    </div>
  );
}

export default function DashboardView() {
  const [data, setData] = useState<AnalyticsOverviewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await fetchAnalyticsOverview();
      setData(overview);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="font-bold text-slate-800">Không tải được dữ liệu dashboard</p>
        <p className="text-sm text-slate-500">{error}</p>
        <p className="text-xs text-slate-400">Kiểm tra backend {process.env.NEXT_PUBLIC_API_URL} và đăng nhập (analytics yêu cầu token).</p>
        <button onClick={load} className="mt-2 px-5 py-2.5 bg-[#00A389] text-white rounded-xl text-sm font-semibold">Thử lại</button>
      </div>
    );
  }

  const { kpis, hourlyTrend, topItems } = data;
  const maxRevenue = Math.max(1, ...hourlyTrend.map((h) => h.revenue));
  const occupancyRate = kpis.tables.total > 0 ? Math.round((kpis.tables.occupied / kpis.tables.total) * 100) : 0;

  const cards = [
    { label: 'Doanh thu hôm nay', value: formatVND(kpis.revenue.today), secondary: `Hôm qua: ${formatVND(kpis.revenue.yesterday)}`, change: `${kpis.revenue.growthPercent >= 0 ? '+' : ''}${kpis.revenue.growthPercent.toFixed(1)}%`, isPositive: kpis.revenue.growthPercent >= 0, icon: DollarSign, bg: 'bg-emerald-50 text-[#00A389]' },
    { label: 'Tổng đơn', value: String(kpis.orders.count), secondary: `TB: ${formatVND(kpis.orders.avgOrderValue)}/đơn`, change: `${kpis.orders.count} đơn`, isPositive: true, icon: UtensilsCrossed, bg: 'bg-teal-50 text-[#00A389]' },
    { label: 'Lấp đầy bàn', value: `${occupancyRate}%`, secondary: `${kpis.tables.occupied}/${kpis.tables.total} bàn đang dùng`, change: `${kpis.tables.pendingKitchen} chờ làm`, isPositive: true, icon: Users, bg: 'bg-orange-50 text-[#FF7A59]' },
    { label: 'VietQR', value: `${kpis.vietqr.sharePercent.toFixed(0)}%`, secondary: formatVND(kpis.vietqr.totalAmount), change: 'tỉ trọng', isPositive: true, icon: Clock, bg: 'bg-purple-50 text-[#A855F7]' },
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
              </div>
              <div className="text-2xl font-bold text-slate-800 tracking-tight">{kpi.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{kpi.secondary}</div>
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
                <span className={`inline-flex items-center gap-0.5 font-semibold ${kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {kpi.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}{kpi.change}
                </span>
                <span className="text-slate-400">{data.date}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Doanh thu theo giờ</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#00A389] rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00A389] animate-pulse" /> Trực tiếp: {formatVND(kpis.revenue.today)}
            </span>
          </div>
          {hourlyTrend.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">Chưa có doanh thu trong ngày.</p>
          ) : (
            <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
              {hourlyTrend.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="relative w-full flex items-end justify-center h-full">
                    <div className="absolute -top-8 bg-slate-800 text-white text-[11px] font-semibold py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">{formatVND(item.revenue)}</div>
                    <div style={{ height: `${Math.max(4, (item.revenue / maxRevenue) * 100)}%` }} className="w-full max-w-[32px] rounded-t-lg bg-slate-100 group-hover:bg-teal-200 transition-all" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
          <h2 className="text-base font-bold text-slate-800">Món bán chạy</h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Top món bán chạy nhất trong ngày</p>
          {topItems.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Chưa có dữ liệu bán hàng.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {topItems.slice(0, 5).map((dish, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">#{idx + 1} {dish.name}</div>
                    <div className="text-xs text-slate-400">{dish.category} • {dish.soldCount} suất</div>
                  </div>
                  <div className="font-bold text-[#00A389] text-sm">{formatVND(dish.revenue)}</div>
                </div>
              ))}
            </div>
          )}
          <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Cập nhật theo ngày {data.date}
          </div>
        </div>
      </div>
    </div>
  );
}
