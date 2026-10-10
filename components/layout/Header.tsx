'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Menu, Building2, ChevronDown, Check, Layers } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useHeaderStore } from '@/stores/header.store';
import { useBranchStore } from '@/stores/branch.store';

interface HeaderProps {
  unreadCount?: number;
  onOpenSidebar?: () => void;
}

const getRouteTitle = (path: string | null): string => {
  if (!path) return 'MenuGO';
  if (path === '/cashier' || path.startsWith('/cashier/')) return 'Quản lý thanh toán';
  if (path === '/order-management' || path.startsWith('/order-management/')) return 'Quản lý đơn';
  if (path === '/orders' || path.startsWith('/orders/')) return 'Đặt món';
  if (path === '/dashboard' || path.startsWith('/dashboard/')) return 'Doanh thu';
  if (path === '/tables' || path.startsWith('/tables/')) return 'Quản lý bàn';
  if (path === '/menu' || path.startsWith('/menu/')) return 'Quản lý món';
  if (path === '/inventory' || path.startsWith('/inventory/')) return 'Quản lý nguyên liệu';
  if (path === '/history' || path.startsWith('/history/')) return 'Lịch sử đơn';
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
  const initializeAuth = useAuthStore((s) => s.initialize);

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const branches = useBranchStore((s) => s.branches);
  const setBranchId = useBranchStore((s) => s.setBranchId);
  const initializeBranch = useBranchStore((s) => s.initialize);
  const getSelectedBranchName = useBranchStore((s) => s.getSelectedBranchName);

  const [showInfo, setShowInfo] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const branchMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeAuth();
    initializeBranch();
  }, [initializeAuth, initializeBranch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (branchMenuRef.current && !branchMenuRef.current.contains(event.target as Node)) {
        setShowBranchMenu(false);
      }
    };
    if (showBranchMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBranchMenu]);

  const displayTitle = customTitle || getRouteTitle(pathname);
  const currentBranchName = getSelectedBranchName();
  const isAllBranches = selectedBranchId === 'ALL' || !selectedBranchId;

  return (
    <header className="h-[74px] px-6 sm:px-8 bg-white border-b border-[#F1F5F9] flex items-center justify-between sticky top-0 z-20 gap-4">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
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

        {/* Global Branch Selector on Header */}
        <div className="relative hidden md:block" ref={branchMenuRef}>
          <button
            onClick={() => setShowBranchMenu(!showBranchMenu)}
            className={`h-9.5 px-3.5 rounded-2xl border text-[12.5px] font-extrabold flex items-center gap-2 transition-all cursor-pointer select-none ${
              isAllBranches
                ? 'bg-[#E6F7F4] border-[#00A389]/30 text-[#00A389] hover:bg-[#d6f2ec]'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9]'
            }`}
          >
            {isAllBranches ? <Layers size={15} /> : <Building2 size={15} />}
            <span className="max-w-[170px] truncate">{currentBranchName}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${showBranchMenu ? 'rotate-180' : ''}`} />
          </button>

          {showBranchMenu && (
            <div className="absolute left-0 top-11.5 w-76 bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 text-[10.5px] font-extrabold text-[#94A3B8] uppercase tracking-wider">
                Chi nhánh hoạt động
              </div>

              {/* Lựa chọn Tổng chi nhánh */}
              <button
                onClick={() => {
                  setBranchId('ALL');
                  setShowBranchMenu(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer text-left ${
                  isAllBranches
                    ? 'bg-[#E6F7F4] text-[#00A389] font-black'
                    : 'text-[#0F172A] hover:bg-[#F8FAFC] font-bold'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isAllBranches ? 'bg-[#00A389] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Layers size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] leading-tight flex items-center gap-1.5">
                      <span>Tổng chi nhánh</span>
                      <span className="text-[9.5px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-100 text-[#00A389]">
                        Toàn hệ thống
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] truncate mt-0.5">Dữ liệu tổng hợp toàn công ty</div>
                  </div>
                </div>
                {isAllBranches && <Check size={16} className="text-[#00A389] shrink-0" />}
              </button>

              <div className="my-1 border-t border-[#F1F5F9]" />

              {/* Danh sách các chi nhánh con */}
              <div className="max-h-52 overflow-y-auto space-y-1">
                {branches.length === 0 ? (
                  <div className="px-3 py-2 text-[12px] text-slate-400 font-medium">Chưa có chi nhánh phụ</div>
                ) : (
                  branches.map((b) => {
                    const isSelected = selectedBranchId === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          setBranchId(b.id);
                          setShowBranchMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#E6F7F4] text-[#00A389] font-black'
                            : 'text-[#0F172A] hover:bg-[#F8FAFC] font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#00A389] text-white' : 'bg-blue-50 text-blue-600'}`}>
                            <Building2 size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[12.5px] leading-tight truncate flex items-center gap-1.5">
                              <span className="truncate">{b.name}</span>
                              {b.code && (
                                <span className="text-[9.5px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                                  {b.code}
                                </span>
                              )}
                            </div>
                            {b.address && <div className="text-[11px] text-[#94A3B8] truncate mt-0.5">{b.address}</div>}
                          </div>
                        </div>
                        {isSelected && <Check size={16} className="text-[#00A389] shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
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
