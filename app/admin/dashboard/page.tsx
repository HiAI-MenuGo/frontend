'use client';

import React from 'react';
import RevenueTrendChart from '../../../components/dashboard/RevenueTrendChart';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  QrCode,
  Users,
  Flame,
  ArrowUpRight,
  Plus,
  UtensilsCrossed,
  PackageCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '../../../context/i18nContext';

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const topSellingItems = [
    { name: 'Trà Đào Cam Sả', soldCount: 84, revenue: 3780000, category: 'Trà trái cây' },
    { name: 'Cà Phê Muối Đặc Biệt', soldCount: 62, revenue: 2170000, category: 'Cà phê' },
    { name: 'Khoai Tây Chiên Phô Mai', soldCount: 45, revenue: 1755000, category: 'Ăn nhẹ' },
    { name: 'Bạc Xỉu Sài Gòn', soldCount: 38, revenue: 1216000, category: 'Cà phê' },
    { name: 'Bánh Croissant Bơ Pháp', soldCount: 29, revenue: 1218000, category: 'Bánh ngọt' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            {t('dashboard.title', 'TỔNG QUAN HOẠT ĐỘNG KINH DOANH')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('dashboard.subtitle', 'Dữ liệu trực tiếp theo thời gian thực của Chi nhánh Quận 1 hôm nay')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            <span className="text-2xl font-black text-zinc-100">14.020.000đ</span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t('dashboard.vsYesterday', '+18.4% so với hôm qua')}</span>
            </div>
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
            <span className="text-2xl font-black text-zinc-100">266 đơn</span>
            <p className="text-xs text-zinc-400 mt-1">{t('dashboard.avgOrderValue', 'Giá trị trung bình: 52.700đ/đơn')}</p>
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
            <span className="text-2xl font-black text-zinc-100">68.4%</span>
            <p className="text-xs text-zinc-400 mt-1">{t('dashboard.qrTransfers', '9.589.680đ qua Chuyển khoản QR')}</p>
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
            <span className="text-2xl font-black text-zinc-100">8 / 15 bàn</span>
            <p className="text-xs text-amber-400 font-semibold mt-1">{t('dashboard.ordersPendingKitchen', '4 đơn đang chờ bếp nấu')}</p>
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
              <p className="text-xs text-zinc-400">{t('dashboard.peakHoursDesc', 'Đỉnh doanh thu thường tập trung lúc 12:00 và 18:00 - 20:00')}</p>
            </div>
          </div>
          <RevenueTrendChart />
        </div>

        {/* Right: Top 5 Best-Selling Items */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-extrabold text-sm text-zinc-100">{t('dashboard.topSellingToday', 'Top Món Bán Chạy Hôm Nay')}</h3>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                {t('dashboard.byQuantity', 'Theo số lượng')}
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {topSellingItems.map((item, idx) => (
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
                    <span className="font-bold text-amber-400">{item.soldCount} ly/phần</span>
                    <p className="text-[10px] text-zinc-400">
                      {item.revenue.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              ))}
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
