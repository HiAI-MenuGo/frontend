'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  FileText,
  Ticket,
  QrCode,
  Users,
  Palette,
  CreditCard,
  Webhook,
  Store,
  ChefHat,
  LogOut,
  Sparkles,
} from 'lucide-react';
import useAuthStore from '../../stores/auth.store';

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navItems = [
    { label: 'Tổng Quan', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Thực Đơn & Món', href: '/admin/menu', icon: UtensilsCrossed },
    { label: 'Kho & Định Lượng BOM', href: '/admin/inventory', icon: Package },
    { label: 'Chốt Ca (Z-Report)', href: '/admin/z-report', icon: FileText },
    { label: 'Khuyến Mãi & Voucher', href: '/admin/vouchers', icon: Ticket },
    { label: 'Sơ Đồ Bàn & QR', href: '/admin/tables', icon: QrCode },
    { label: 'Nhân Sự & Phân Quyền', href: '/admin/roles', icon: Users },
    { label: 'Nhận Diện Thương Hiệu', href: '/admin/settings/branding', icon: Palette },
    { label: 'Tài Khoản VietQR', href: '/admin/settings/bank', icon: CreditCard },
    { label: 'API & Webhook', href: '/admin/integrations', icon: Webhook },
  ];

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Brand Logo Header */}
        <div className="h-16 border-b border-zinc-800 px-5 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 flex items-center justify-center font-black text-sm shadow-lg shadow-amber-500/20">
              MG
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-zinc-100 flex items-center gap-1">
                HiAI-MenuGo <Sparkles className="w-3 h-3 text-amber-400" />
              </span>
              <p className="text-[10px] text-zinc-400 font-medium">Quản Trị Nhà Hàng F&B</p>
            </div>
          </Link>
        </div>

        {/* Quick Portal Shortcuts (POS & KDS) */}
        <div className="p-3 border-b border-zinc-800/80 grid grid-cols-2 gap-2">
          <Link
            href="/pos"
            className="flex items-center gap-1.5 p-2 bg-zinc-800/70 hover:bg-zinc-800 rounded-xl text-xs font-semibold text-amber-400 border border-zinc-700/60 transition"
          >
            <Store className="w-3.5 h-3.5" />
            <span>POS Thu Ngân</span>
          </Link>
          <Link
            href="/kds"
            className="flex items-center gap-1.5 p-2 bg-zinc-800/70 hover:bg-zinc-800 rounded-xl text-xs font-semibold text-emerald-400 border border-zinc-700/60 transition"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Màn Hình Bếp</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout footer */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
            {user?.name ? user.name[0] : 'A'}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-zinc-200 truncate">{user?.name || 'Trần Hoàng Đạt'}</p>
            <p className="text-[10px] text-amber-400 font-medium capitalize">{user?.role || 'ADMIN'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition"
          title="Đăng xuất"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
