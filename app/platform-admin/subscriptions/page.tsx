'use client';

import React from 'react';
import { Check, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionsTiersPage() {
  const plans = [
    {
      name: 'STARTER',
      price: '290.000đ',
      period: '/ tháng / quán',
      description: 'Dành cho quán cafe nhỏ, trà sữa mang về, 1 chi nhánh',
      features: [
        '1 Chi nhánh hoạt động',
        'Tối đa 5 tài khoản nhân viên',
        'QR Menu tại bàn không giới hạn',
        'Màn hình Bếp KDS Realtime',
        'Thanh toán VietQR động',
      ],
      isPopular: false,
    },
    {
      name: 'PRO (Khuyên Dùng)',
      price: '690.000đ',
      period: '/ tháng / quán',
      description: 'Phù hợp nhà hàng, chuỗi 2-5 chi nhánh có định lượng kho BOM',
      features: [
        'Tối đa 5 Chi nhánh',
        'Tối đa 25 tài khoản nhân viên',
        'Quản trị kho & Định lượng BOM tự động',
        'Đối soát kết ca Z-Report & Két tiền',
        'Động cơ khuyến mãi & Voucher',
        'Báo cáo doanh thu & Heatmap thời gian thực',
      ],
      isPopular: true,
    },
    {
      name: 'ENTERPRISE',
      price: '1.490.000đ',
      period: '/ tháng / chuỗi',
      description: 'Chuỗi F&B lớn, hỗ trợ Webhook SePay & API tích hợp',
      features: [
        'Không giới hạn Chi nhánh',
        'Không giới hạn nhân viên',
        'Webhook SePay tự động bắt giao dịch ngân hàng',
        'Tùy biến tên miền riêng & Thương hiệu',
        'Hỗ trợ kỹ thuật 24/7 riêng biệt',
      ],
      isPopular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-6xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <Link
          href="/platform-admin"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Quản trị Tenants</span>
        </Link>
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
          BẢNG GIÁ DỊCH VỤ SAAS
        </span>
      </div>

      <div className="text-center space-y-2 py-4">
        <h1 className="text-2xl font-black text-zinc-100">CÁC GÓI CƯỚC NỀN TẢNG HIAI-MENUGO</h1>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Cung cấp giải pháp phần mềm quản lý nhà hàng F&B toàn diện từ gọi món tại bàn, bếp KDS đến kế toán
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-3xl p-6 flex flex-col justify-between border relative ${
              p.isPopular
                ? 'bg-zinc-900 border-amber-500 shadow-2xl shadow-amber-500/10'
                : 'bg-zinc-900/60 border-zinc-800'
            }`}
          >
            {p.isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                Gói Phổ Biến Nhất
              </span>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-zinc-100">{p.name}</h3>
                <p className="text-xs text-zinc-400 mt-1">{p.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-400">{p.price}</span>
                <span className="text-xs text-zinc-500">{p.period}</span>
              </div>

              <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                {p.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6">
              <button
                type="button"
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                  p.isPopular
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
              >
                Cấu Hình Gói Này
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
