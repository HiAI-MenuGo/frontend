'use client';

import React from 'react';
import Link from 'next/link';
import {
  QrCode,
  ChefHat,
  Store,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  CheckCircle,
  Database,
  Building2,
} from 'lucide-react';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

export default function Home() {
  const portals = [
    {
      title: 'QR Menu Tại Bàn (Khách Hàng)',
      badge: 'Bàn 01 Live',
      description: 'Quét QR xem thực đơn, tùy biến topping/đường/đá, theo dõi đơn live và thanh toán VietQR.',
      href: '/table/01',
      icon: QrCode,
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
      btnColor: 'bg-amber-500 hover:bg-amber-400 text-zinc-950',
    },
    {
      title: 'Màn Hình Bếp Realtime (KDS)',
      badge: 'Bếp Trưởng',
      description: 'Kanban 3 cột realtime (Chờ nấu, Đang nấu, Đã xong), chuông âm thanh chuông báo và nút báo hết món.',
      href: '/kds',
      icon: ChefHat,
      color: 'from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-400',
      btnColor: 'bg-sky-500 hover:bg-sky-400 text-zinc-950',
    },
    {
      title: 'POS Bán Hàng Thu Ngân',
      badge: 'Quầy Thu Ngân',
      description: 'Giao diện tối ưu màn hình lớn, chọn món nhanh, tính tiền thừa, sinh VietQR động và in hóa đơn.',
      href: '/pos',
      icon: Store,
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
      btnColor: 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950',
    },
    {
      title: 'Quản Trị Nhà Hàng (Admin)',
      badge: 'Chủ Quán / Quản Lý',
      description: 'Dashboard doanh thu, thực đơn, định lượng kho BOM, mã giảm giá, chốt ca Z-Report và sơ đồ bàn.',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
      btnColor: 'bg-purple-500 hover:bg-purple-400 text-zinc-950',
    },
    {
      title: 'Quản Trị Nền Tảng (SaaS Super Admin)',
      badge: 'Platform Operator',
      description: 'Quản lý danh sách quán thuê (tenants), gói cước đăng ký và bảo mật cô lập dữ liệu multi-tenant.',
      href: '/platform-admin',
      icon: ShieldCheck,
      color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
      btnColor: 'bg-rose-500 hover:bg-rose-400 text-zinc-950',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black text-sm flex items-center justify-center shadow-lg shadow-amber-500/20">
            MG
          </div>
          <span className="font-black text-base tracking-tight text-white flex items-center gap-1.5">
            HiAI-MenuGo <Sparkles className="w-4 h-4 text-amber-400" />
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Hero Header */}
      <header className="py-12 sm:py-16 px-6 text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-bold text-amber-400 uppercase tracking-widest">
          <Zap className="w-3.5 h-3.5" />
          <span>Hệ Sinh Thái F&B Đa Nền Tảng (Multi-Tenant SaaS)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Nền Tảng Vận Hành F&B Thông Minh <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300">
            QR Menu • Realtime KDS • POS • BOM
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Được thiết kế chuẩn kiến trúc Multi-Tenant, hỗ trợ đầy đủ quy trình từ khách quét QR gọi món,
          báo chế biến màn hình bếp thời gian thực, quản lý thu ngân tại quầy đến chốt ca Z-Report và định lượng kho.
        </p>
      </header>

      {/* Interactive Portal Selection Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.title}
                className={`bg-gradient-to-b ${portal.color} bg-zinc-900 border rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-xl hover:scale-[1.01] transition duration-200`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-zinc-700/60 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-950/60 border border-zinc-700/60 text-zinc-300">
                      {portal.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{portal.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      {portal.description}
                    </p>
                  </div>
                </div>

                <Link
                  href={portal.href}
                  className={`w-full py-3 px-4 ${portal.btnColor} font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]`}
                >
                  <span>Truy Cập Giao Diện</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Architecture Spec Summary */}
        <div className="mt-12 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 pb-4 border-b border-zinc-800">
            <Database className="w-5 h-5 text-amber-500" />
            <h2 className="font-extrabold text-sm text-zinc-200">
              Kiến Trúc Kỹ Thuật Đã Triển Khai (Thành Viên C)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-xs">
            <div className="space-y-1.5">
              <span className="font-bold text-amber-400">1. Database & SaaS Core</span>
              <p className="text-zinc-400">
                Prisma 6.4 với ~40 models CSDL PostgreSQL multi-tenant đầy đủ quan hệ, composite indexes và seed dữ liệu chuẩn.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-bold text-sky-400">2. Realtime WebSocket & VietQR</span>
              <p className="text-zinc-400">
                Đồng bộ trạng thái đơn hàng KDS, sold out món ăn tức thì qua Socket.IO và tạo mã VietQR động NAPAS 247.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-bold text-emerald-400">3. F&B Operations & Accounting</span>
              <p className="text-zinc-400">
                Động cơ định lượng kho tự động (BOM), hệ thống mã voucher giảm giá, phân quyền RBAC và đối soát chốt ca Z-Report.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
        <p>© 2026 HiAI-MenuGo — Dự án Khởi nghiệp Phần mềm Quản trị F&B Thông Minh</p>
      </footer>
    </div>
  );
}
