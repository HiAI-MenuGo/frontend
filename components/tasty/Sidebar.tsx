'use client';

import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Grid,
  UtensilsCrossed,
  Users,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';

export type MainTabType = 'dashboard' | 'order-line' | 'manage-table' | 'manage-dishes' | 'customers' | 'settings';

interface SidebarProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  onLogout?: () => void;
  orderBadgeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout, orderBadgeCount }) => {
  const navItems: { id: MainTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
    { id: 'order-line', label: 'Order Line', icon: <ClipboardList size={19} /> },
    { id: 'manage-table', label: 'Manage Table', icon: <Grid size={19} /> },
    { id: 'manage-dishes', label: 'Manage Dishes', icon: <UtensilsCrossed size={19} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={19} /> },
  ];

  return (
    <aside className="w-[220px] shrink-0 bg-white border-r border-[#F1F5F9] flex flex-col justify-between py-6 px-4 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-2 mb-8 cursor-pointer" onClick={() => onTabChange('order-line')}>
          {/* Tasty Station / HiAI Pinwheel Logo */}
          <div className="w-10 h-10 rounded-2xl bg-[#E6F7F4] flex items-center justify-center text-[#00A389] shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 12L7.05 7.05C8.42 5.68 10.16 4.8 12 4.8V12ZM12 12L16.95 7.05C18.32 8.42 19.2 10.16 19.2 12H12ZM12 12L16.95 16.95C15.58 18.32 13.84 19.2 12 19.2V12ZM12 12L7.05 16.95C5.68 15.58 4.8 13.84 4.8 12H12Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[17px] tracking-tight text-[#0F172A] leading-tight">
              Tasty
            </span>
            <span className="font-semibold text-[13.5px] text-[#00A389] tracking-tight leading-none">
              Station
            </span>
          </div>
        </div>

        {/* Main Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-[13.5px] font-bold transition-all text-left ${
                  isActive
                    ? 'bg-[#E6F7F4] text-[#00A389] shadow-xs'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={isActive ? 'text-[#00A389]' : 'text-[#64748B]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.id === 'order-line' && orderBadgeCount && orderBadgeCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#00A389] text-white">
                    {orderBadgeCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utility Links */}
      <div className="space-y-1.5 pt-4 border-t border-[#F1F5F9]">
        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-bold transition-colors text-left ${
            activeTab === 'settings'
              ? 'bg-[#E6F7F4] text-[#00A389]'
              : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
          }`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <button
          onClick={() => alert('Trung tâm trợ giúp HiAI-MenuGo: Hotline 1900 6868')}
          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors text-left"
        >
          <HelpCircle size={18} />
          <span>Help Center</span>
        </button>

        <button
          onClick={() => {
            if (onLogout) onLogout();
            else alert('Đăng xuất phiên làm việc của nhân viên thu ngân thành công!');
          }}
          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-bold text-[#EF4444] hover:bg-[#FEF2F2] transition-colors text-left"
        >
          <LogOut size={18} className="text-[#EF4444]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
