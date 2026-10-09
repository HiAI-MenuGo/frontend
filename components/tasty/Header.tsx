'use client';

import React, { useState } from 'react';
import { Search, Bell, Check, X } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  staffName?: string;
  staffRole?: string;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  staffName = 'Ibrahim Kadri',
  staffRole = 'Admin',
  unreadCount = 3,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Bàn #03 vừa gọi món', desc: '8 món mới gửi vào Bếp KDS', time: '2 phút trước', read: false },
    { id: 2, title: 'Thanh toán VietQR thành công', desc: 'Đơn #FO019 đã nhận 720.000đ', time: '14 phút trước', read: false },
    { id: 3, title: 'Báo hết món', desc: 'Món "Beef Steak" đã hết nguyên liệu', time: '28 phút trước', read: true },
  ]);

  return (
    <header className="h-[74px] px-8 bg-white border-b border-[#F1F5F9] flex items-center justify-between sticky top-0 z-20">
      {/* Global Search Bar */}
      <div className="relative w-[360px] max-w-full">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search menu, orders and more"
          className="w-full h-11 pl-11 pr-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#00A389] focus:bg-white transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-5">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-all relative"
            title="Thông báo"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-4 z-40 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <span className="font-extrabold text-[14px] text-[#0F172A]">Thông báo nhà hàng</span>
                <button
                  onClick={() => {
                    setNotifications(notifications.map(n => ({ ...n, read: true })));
                  }}
                  className="text-[11px] font-bold text-[#00A389] hover:underline"
                >
                  Đánh dấu đã đọc
                </button>
              </div>

              <div className="divide-y divide-[#F1F5F9] my-1 max-h-64 overflow-y-auto">
                {notifications.map((item) => (
                  <div key={item.id} className="py-2.5 px-1 hover:bg-[#F8FAFC] rounded-xl transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[12.5px] text-[#0F172A]">{item.title}</span>
                      <span className="text-[10px] text-[#94A3B8]">{item.time}</span>
                    </div>
                    <p className="text-[11.5px] text-[#64748B] mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-2 cursor-pointer select-none">
          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-2xs">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
              alt={staffName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="font-bold text-[13.5px] text-[#0F172A]">
              {staffName}
            </span>
            <p className="text-[11.5px] font-semibold text-[#94A3B8]">
              {staffRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
