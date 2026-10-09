'use client';

import React from 'react';
import {
  TrendingUp,
  Users,
  UtensilsCrossed,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import { initialDishes, liveOrderQueue, initialTables } from './mockData';

interface DashboardViewProps {
  onNavigateTab: (tab: 'order-line' | 'manage-table' | 'manage-dishes' | 'customers') => void;
}

export default function DashboardView({ onNavigateTab }: DashboardViewProps) {
  // Statistics calculations
  const totalRevenue = 1842.5;
  const totalOrders = 128;
  const occupiedTables = initialTables.filter((t) => t.status === 'ON_DINE').length;
  const totalTables = initialTables.length;
  const occupancyRate = Math.round((occupiedTables / totalTables) * 100);

  const kpis = [
    {
      label: "Today's Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      secondary: '45.200.000 ₫',
      change: '+14.6%',
      isPositive: true,
      icon: DollarSign,
      bg: 'bg-emerald-50 text-[#00A389]',
      border: 'border-emerald-100',
    },
    {
      label: 'Total Orders',
      value: totalOrders.toString(),
      secondary: '4 active in queue',
      change: '+8.2%',
      isPositive: true,
      icon: UtensilsCrossed,
      bg: 'bg-teal-50 text-[#00A389]',
      border: 'border-teal-100',
    },
    {
      label: 'Table Occupancy',
      value: `${occupancyRate}%`,
      secondary: `${occupiedTables} of ${totalTables} tables occupied`,
      change: '+5.0%',
      isPositive: true,
      icon: Users,
      bg: 'bg-orange-50 text-[#FF7A59]',
      border: 'border-orange-100',
    },
    {
      label: 'Avg. Prep Time',
      value: '14.2 min',
      secondary: 'Target: < 18 min',
      change: '-2.4 min',
      isPositive: true,
      icon: Clock,
      bg: 'bg-purple-50 text-[#A855F7]',
      border: 'border-purple-100',
    },
  ];

  // Hourly revenue data for visual chart bar representation
  const hourlyData = [
    { hour: '10:00', amount: 120, height: 25 },
    { hour: '11:00', amount: 340, height: 60 },
    { hour: '12:00', amount: 580, height: 95 },
    { hour: '13:00', amount: 490, height: 80 },
    { hour: '14:00', amount: 210, height: 40 },
    { hour: '15:00', amount: 150, height: 30 },
    { hour: '16:00', amount: 190, height: 35 },
    { hour: '17:00', amount: 410, height: 70 },
    { hour: '18:00', amount: 640, height: 100 },
    { hour: '19:00', amount: 590, height: 92 },
    { hour: '20:00', amount: 420, height: 72 },
    { hour: '21:00', amount: 240, height: 45 },
  ];

  const topDishes = initialDishes.slice(0, 5);

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#00A389] via-[#008f77] to-[#047857] text-white rounded-[24px] p-6 lg:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Tasty Station POS & Management Hub</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Welcome back, Ibrahim Kadri! 👋
          </h1>
          <p className="text-white/80 text-sm mt-1.5">
            Everything is operating smoothly today. 4 orders currently in the live kitchen queue and 12 table reservations confirmed.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('order-line')}
            className="px-5 py-2.5 bg-white text-[#00A389] hover:bg-slate-50 font-semibold rounded-xl shadow-sm text-sm transition-all duration-200 active:scale-95 flex items-center gap-1.5"
          >
            <span>Open Order Line</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigateTab('manage-table')}
            className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl backdrop-blur-md text-sm transition-all duration-200"
          >
            Floor Plan
          </button>
        </div>

        {/* Decorative blur circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center font-bold`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-slate-800 tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{kpi.secondary}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
                <span
                  className={`inline-flex items-center gap-0.5 font-semibold ${
                    kpi.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {kpi.isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {kpi.change}
                </span>
                <span className="text-slate-400">vs yesterday</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart & Live Kitchen Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Hourly Sales Performance</h2>
              <p className="text-xs text-slate-400 mt-0.5">Peak dining rush hours today</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#00A389] rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00A389] animate-pulse" />
                Live Revenue: $1,842.50
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
            {hourlyData.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="relative w-full flex items-end justify-center h-full">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 bg-slate-800 text-white text-[11px] font-semibold py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    ${item.amount}
                  </div>
                  <div
                    style={{ height: `${item.height}%` }}
                    className={`w-full max-w-[32px] rounded-t-lg transition-all duration-300 ${
                      item.height > 85
                        ? 'bg-gradient-to-t from-[#00A389] to-[#34d399]'
                        : 'bg-slate-100 group-hover:bg-teal-200'
                    }`}
                  />
                </div>
                <span className="text-[11px] text-slate-400 font-medium group-hover:text-slate-700">
                  {item.hour}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#00A389]" />
                <span>Peak Rush (12:00 & 18:00)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-200" />
                <span>Regular Operating Hours</span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('order-line')}
              className="text-[#00A389] hover:underline font-semibold flex items-center gap-1"
            >
              View Order Details &rarr;
            </button>
          </div>
        </div>

        {/* Live Kitchen Status (1 col) */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Live Kitchen Queue</h2>
              <p className="text-xs text-slate-400 mt-0.5">Orders in progress right now</p>
            </div>
            <button
              onClick={() => onNavigateTab('order-line')}
              className="text-xs text-[#00A389] hover:underline font-semibold"
            >
              See all
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {liveOrderQueue.map((order) => {
              const bg =
                order.status === 'IN_KITCHEN'
                  ? '#E6F7F4'
                  : order.status === 'WAIT_LIST'
                  ? '#FFEFE8'
                  : '#F5EDFD';
              const badgeBg =
                order.status === 'IN_KITCHEN'
                  ? 'bg-[#00A389] text-white'
                  : order.status === 'WAIT_LIST'
                  ? 'bg-[#FF7A59] text-white'
                  : 'bg-[#A855F7] text-white';

              return (
                <div
                  key={order.id}
                  className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between"
                  style={{ backgroundColor: bg }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{order.orderNumber}</span>
                      <span className="text-xs font-semibold text-slate-600 bg-white/60 px-2 py-0.5 rounded-full">
                        {order.tableNumber}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                      <span className="font-semibold">{order.itemCount} Items</span>
                      <span>•</span>
                      <span>{order.timeAgo}</span>
                    </div>
                  </div>

                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm ${badgeBg}`}>
                    {order.statusLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Kitchen display active
            </span>
            <button
              onClick={() => onNavigateTab('manage-table')}
              className="text-[#00A389] font-medium hover:underline"
            >
              Check Tables
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Selling Dishes & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
        {/* Top Selling Items (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Top Selling Menu Items</h2>
              <p className="text-xs text-slate-400 mt-0.5">Most ordered dishes this week</p>
            </div>
            <button
              onClick={() => onNavigateTab('manage-dishes')}
              className="text-xs text-[#00A389] font-semibold hover:underline"
            >
              Manage Catalog &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {topDishes.map((dish, idx) => (
              <div key={dish.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">
                    #{idx + 1}
                  </span>
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-100 shadow-sm"
                  />
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{dish.name}</h4>
                    <span className="text-xs text-slate-400 capitalize">{dish.category}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-[#00A389] text-sm">${dish.price.toFixed(2)}</div>
                  <div className="text-xs text-slate-400">{(idx + 1) * 38 + 42} orders</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operations (1 col) */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-400 mb-4">Frequently used operational shortcuts</p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigateTab('order-line')}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-[#00A389] flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 group-hover:text-[#00A389]">
                      Create Table Order
                    </div>
                    <div className="text-xs text-slate-400">New dine-in or take-away ticket</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#00A389]" />
              </button>

              <button
                onClick={() => onNavigateTab('manage-table')}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#FF7A59] flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 group-hover:text-[#FF7A59]">
                      Add Reservation
                    </div>
                    <div className="text-xs text-slate-400">Book table for guests</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#FF7A59]" />
              </button>

              <button
                onClick={() => onNavigateTab('manage-dishes')}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#A855F7] flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 group-hover:text-[#A855F7]">
                      Add Menu Dish
                    </div>
                    <div className="text-xs text-slate-400">Update pricing & recipes</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#A855F7]" />
              </button>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Tasty Station v2.4</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Database Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
