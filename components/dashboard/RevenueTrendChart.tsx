'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface HourlyTrendPoint {
  time: string;
  revenue: number;
  orders: number;
}

interface RevenueTrendChartProps {
  data?: HourlyTrendPoint[];
}

const DEFAULT_HOURLY_SLOTS: HourlyTrendPoint[] = [
  { time: '08:00', revenue: 0, orders: 0 },
  { time: '10:00', revenue: 0, orders: 0 },
  { time: '12:00', revenue: 0, orders: 0 },
  { time: '14:00', revenue: 0, orders: 0 },
  { time: '16:00', revenue: 0, orders: 0 },
  { time: '18:00', revenue: 0, orders: 0 },
  { time: '20:00', revenue: 0, orders: 0 },
  { time: '22:00', revenue: 0, orders: 0 },
];

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const chartData = data && data.length > 0 ? data : DEFAULT_HOURLY_SLOTS;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#27272a' }}
          />
          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              borderColor: '#27272a',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#f4f4f5',
            }}
            formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')}đ`, 'Doanh thu']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#f59e0b"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueTrendChart;
