'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useHeaderStore } from '@/stores/header.store';

interface HeaderProps {
  unreadCount?: number;
  onOpenSidebar?: () => void;
}

const getRouteTitle = (path: string | null): string => {
  if (!path) return 'MenuGO';
  if (path === '/cashier' || path.startsWith('/cashier/')) return 'Quản lý thanh toán';
  if (path === '/order-management' || path.startsWith('/order-management/')) return 'Quản lý đơn';
  if (path === '/orders' || path.startsWith('/orders/')) return 'Đặt món';
  if (path === '/dashboard' || path.startsWith('/dashboard/')) return 'Tổng quan';
  if (path === '/tables' || path.startsWith('/tables/')) return 'Quản lý bàn';
  if (path === '/menu' || path.startsWith('/menu/')) return 'Quản lý món';
  if (path === '/inventory' || path.startsWith('/inventory/')) return 'Quản lý nguyên liệu';
  if (path === '/history' || path.startsWith('/history/')) return 'Lịch sử đơn hàng';
  if (path === '/customers' || path.startsWith('/customers/')) return 'Khách hàng';
  if (path === '/staff' || path.startsWith('/staff/')) return 'Quản lý nhân viên';
  if (path === '/settings' || path.startsWith('/settings/')) return 'Cài đặt';
  return 'MenuGO';
};

export default function Header({ unreadCount = 0, onOpenSidebar }: HeaderProps) {
  const pathname = usePathname();
  const customTitle = useHeaderStore((s) => s.customTitle);
  const customAction = useHeaderStore((s) => s.customAction);
  const user = useAuthStore((s) => s.user);
  const initialize = useAuthStore((s) => s.initialize);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const displayTitle = customTitle || getRouteTitle(pathname);

  return (
    <header className="h-[74px] px-6 sm:px-8 bg-white border-b border-[#F1F5F9] flex items-center justify-between sticky top-0 z-20 gap-4">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="lg:hidden w-10 h-10 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] shrink-0"
            aria-label="Mở menu"
          >
            <Menu size={18} />
          </button>
        )}
        <h1 className="text-[20px] sm:text-[22px] font-black text-[#0F172A] tracking-tight shrink-0 whitespace-nowrap">
          {displayTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {customAction}

        <div className="relative">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-10 h-10 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-all relative"
            title="Thông báo"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white"></span>
            )}
          </button>

          {showInfo && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-4 z-40">
              <div className="font-extrabold text-[14px] text-[#0F172A] pb-2 border-b border-[#F1F5F9]">
                Thông báo nhà hàng
              </div>
              <p className="text-[12px] text-[#64748B] py-3">
                {unreadCount > 0
                  ? `Đang có ${unreadCount} đơn cần xử lý ở màn Quản lý đơn.`
                  : 'Không có thông báo mới. Đơn mới sẽ hiện ở đây theo thời gian thực.'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-2 select-none">
          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-2xs bg-[#E6F7F4] flex items-center justify-center font-extrabold text-[#00A389]">
            {(user?.name?.[0] ?? 'A').toUpperCase()}
          </div>
          <div className="flex flex-col text-left leading-tight hidden sm:flex">
            <span className="font-bold text-[13.5px] text-[#0F172A]">{user?.name ?? 'Thu ngân'}</span>
            <p className="text-[11.5px] font-semibold text-[#94A3B8]">{user?.role ?? 'STAFF'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
