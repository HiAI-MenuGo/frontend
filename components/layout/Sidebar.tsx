'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Grid,
  UtensilsCrossed,
  Users,
  ClipboardCheck,
  Settings,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
  Banknote,
  Package,
  History,
  CircleDollarSign,
  BellRing,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { fetchCustomerCalls } from '@/lib/api/customerRequests.api';
import { useSocket } from '@/context/SocketContext';

const NAV = [
  { href: '/dashboard', label: 'Doanh thu', icon: CircleDollarSign },
  { href: '/orders', label: 'Đặt món', icon: ClipboardList },
  { href: '/order-management', label: 'Quản lý đơn', icon: ClipboardCheck },
  { href: '/cashier', label: 'Thanh toán', icon: Banknote },
  { href: '/tables', label: 'Quản lý bàn', icon: Grid },
  { href: '/menu', label: 'Quản lý món', icon: UtensilsCrossed },
  { href: '/inventory', label: 'Nguyên liệu', icon: Package },
  { href: '/history', label: 'Lịch sử đơn', icon: History },
  { href: '/customers', label: 'Khách hàng', icon: Users },
  { href: '/staff', label: 'Nhân viên', icon: UserPlus },
] as const;

const DEFAULT_WIDTH = 220;
const COLLAPSED_WIDTH = 76;
const MIN_WIDTH = 160;
const MAX_WIDTH = 340;

export default function Sidebar({ orderBadgeCount = 0 }: { orderBadgeCount?: number }) {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, w: DEFAULT_WIDTH });
  const [pendingCallCount, setPendingCallCount] = useState(0);

  // Socket for realtime call staff notifications
  const { on, off, isConnected } = useSocket();

  // Lắng nghe số lượng yêu cầu gọi bàn đang chờ xử lý
  useEffect(() => {
    fetchCustomerCalls({ status: 'PENDING' })
      .then((res) => setPendingCallCount(res.summary.pending))
      .catch(() => {});

    if (!isConnected) return;

    const onCall = () => {
      setPendingCallCount((c) => c + 1);
    };
    const onUpdated = () => {
      fetchCustomerCalls({ status: 'PENDING' })
        .then((res) => setPendingCallCount(res.summary.pending))
        .catch(() => {});
    };

    on('call_staff:request', onCall);
    on('call_staff:updated', onUpdated);

    const interval = setInterval(() => {
      fetchCustomerCalls({ status: 'PENDING' })
        .then((res) => setPendingCallCount(res.summary.pending))
        .catch(() => {});
    }, 15000);

    return () => {
      off('call_staff:request', onCall);
      off('call_staff:updated', onUpdated);
      clearInterval(interval);
    };
  }, [isConnected, on, off]);

  // Đọc kích thước đã lưu
  useEffect(() => {
    try {
      const w = Number(localStorage.getItem('sidebar-width'));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Number.isFinite(w) && w >= MIN_WIDTH && w <= MAX_WIDTH) setWidth(w);
      setCollapsed(localStorage.getItem('sidebar-collapsed') === '1');
    } catch {
      // bỏ qua
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sidebar-width', String(width));
    } catch {
      // bỏ qua
    }
  }, [width]);

  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0');
    } catch {
      // bỏ qua
    }
  }, [collapsed]);

  const onDragMove = useCallback((e: MouseEvent) => {
    const next = dragStart.current.w + (e.clientX - dragStart.current.x);
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(next))));
  }, []);

  const onDragEnd = useCallback(() => {
    setDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (!dragging) return;
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    return () => {
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
    };
  }, [dragging, onDragMove, onDragEnd]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStart.current = { x: e.clientX, w: width };
    setDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');
  const effectiveWidth = collapsed ? COLLAPSED_WIDTH : width;

  const labelClass = 'truncate whitespace-nowrap overflow-hidden text-ellipsis min-w-0 flex-1';

  return (
    <aside
      style={{ width: effectiveWidth }}
      className={`relative shrink-0 bg-white border-r border-[#F1F5F9] flex flex-col justify-between py-6 h-screen sticky top-0 select-none z-30 ${
        dragging ? '' : 'transition-[width] duration-200 ease-out'
      } ${collapsed ? 'px-3' : 'px-4'}`}
    >
      <div className="min-w-0">
        <div className={`flex items-center mb-8 ${collapsed ? 'justify-center px-0' : 'gap-3 px-2'}`}>
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0" title="MenuGO by HiAI">
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#E6F7F4] flex items-center justify-center text-[#00A389] shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 12L7.05 7.05C8.42 5.68 10.16 4.8 12 4.8V12ZM12 12L16.95 7.05C18.32 8.42 19.2 10.16 19.2 12H12ZM12 12L16.95 16.95C15.58 18.32 13.84 19.2 12 19.2V12ZM12 12L7.05 16.95C5.68 15.58 4.8 13.84 4.8 12H12Z" fill="currentColor" />
              </svg>
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-[17px] tracking-tight text-[#0F172A] leading-tight truncate">MenuGO</span>
                <span className="font-semibold text-[13.5px] text-[#00A389] tracking-tight leading-none truncate">HiAI</span>
              </div>
            )}
          </Link>
        </div>

        <nav className="space-y-1.5">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`relative w-full flex items-center gap-3.5 rounded-2xl text-[13.5px] font-bold transition-all text-left overflow-hidden ${
                  collapsed ? 'justify-center px-0 py-3' : 'justify-between px-3.5 py-3'
                } ${
                  active ? 'bg-[#E6F7F4] text-[#00A389] shadow-xs' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <div className={`flex items-center gap-3.5 min-w-0 ${collapsed ? '' : 'flex-1'}`}>
                  <span className={`shrink-0 ${active ? 'text-[#00A389]' : 'text-[#64748B]'}`}>
                    <Icon size={19} />
                  </span>
                  {!collapsed && <span className={labelClass}>{item.label}</span>}
                </div>
                {item.href === '/order-management' && orderBadgeCount > 0 ? (
                  collapsed ? (
                    <span className="absolute mt-[-22px] ml-[22px] min-w-4 h-4 px-1 rounded-full text-[10px] font-bold bg-[#00A389] text-white flex items-center justify-center">
                      {orderBadgeCount > 99 ? '99+' : orderBadgeCount}
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#00A389] text-white">
                      {orderBadgeCount > 99 ? '99+' : orderBadgeCount}
                    </span>
                  )
                ) : null}
                {item.href === '/customers' && pendingCallCount > 0 ? (
                  collapsed ? (
                    <span className="absolute mt-[-22px] ml-[22px] min-w-4 h-4 px-1 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center justify-center animate-pulse">
                      {pendingCallCount > 99 ? '99+' : pendingCallCount}
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white flex items-center gap-1 shadow-xs animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      {pendingCallCount > 99 ? '99+' : pendingCallCount}
                    </span>
                  )
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={`space-y-1.5 pt-4 border-t border-[#F1F5F9] ${collapsed ? 'flex flex-col items-center' : ''}`}>
        <Link
          href="/settings"
          title="Cài đặt"
          className={`w-full flex items-center gap-3.5 rounded-2xl text-[13px] font-bold transition-colors text-left overflow-hidden ${
            collapsed ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5'
          } ${
            isActive('/settings') ? 'bg-[#E6F7F4] text-[#00A389]' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
          }`}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span className={labelClass}>Cài đặt</span>}
        </Link>

        <button
          onClick={() => alert('Trung tâm trợ giúp MenuGO by HiAI: Hotline 1900 6868')}
          title="Trợ giúp"
          className={`w-full flex items-center gap-3.5 rounded-2xl text-[13px] font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors text-left overflow-hidden ${
            collapsed ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5'
          }`}
        >
          <HelpCircle size={18} className="shrink-0" />
          {!collapsed && <span className={labelClass}>Trợ giúp</span>}
        </button>

        <button
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          title="Đăng xuất"
          className={`w-full flex items-center gap-3.5 rounded-2xl text-[13px] font-bold text-[#EF4444] hover:bg-[#FEF2F2] transition-colors text-left overflow-hidden ${
            collapsed ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5'
          }`}
        >
          <LogOut size={18} className="text-[#EF4444] shrink-0" />
          {!collapsed && <span className={labelClass}>Đăng xuất</span>}
        </button>
      </div>

      {/* Nút đóng / mở */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
        className="absolute -right-3.5 top-24 z-40 w-7 h-7 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#64748B] hover:text-[#00A389] hover:border-[#00A389]"
      >
        {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>

      {/* Tay kéo co giãn */}
      {!collapsed && (
        <div
          onMouseDown={startDrag}
          onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
          title="Kéo để thay đổi độ rộng (nhấp đúp để về mặc định)"
          className="absolute top-0 bottom-0 -right-1 w-2 cursor-col-resize group flex justify-center"
        >
          <div className={`w-[3px] h-full rounded-full transition-colors ${dragging ? 'bg-[#00A389]' : 'bg-transparent group-hover:bg-[#00A389]/50'}`} />
        </div>
      )}
    </aside>
  );
}
