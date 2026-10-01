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

const data = [
  { time: '08:00', revenue: 420000, orders: 8 },
  { time: '10:00', revenue: 1150000, orders: 24 },
  { time: '12:00', revenue: 2480000, orders: 48 },
  { time: '14:00', revenue: 1820000, orders: 35 },
  { time: '16:00', revenue: 1390000, orders: 28 },
  { time: '18:00', revenue: 3120000, orders: 56 },
  { time: '20:00', revenue: 2750000, orders: 49 },
  { time: '22:00', revenue: 890000, orders: 18 },
];

export function RevenueTrendChart() {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            tickFormatter={(v) => `${v / 1000}k`}
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
