'use client';

import React, { useState } from 'react';
import Sidebar, { MainTabType } from '@/components/tasty/Sidebar';
import Header from '@/components/tasty/Header';
import OrderLineView from '@/components/tasty/OrderLineView';
import ManageTableView from '@/components/tasty/ManageTableView';
import ManageDishesView from '@/components/tasty/ManageDishesView';
import DashboardView from '@/components/tasty/DashboardView';
import CustomersView from '@/components/tasty/CustomersView';
import SettingsView from '@/components/tasty/SettingsView';

export default function TastyStationApp() {
  const [activeTab, setActiveTab] = useState<MainTabType>('order-line');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F6F8] font-sans text-slate-800 antialiased selection:bg-[#00A389] selection:text-white">
      {/* Left Navigation Sidebar (220px fixed) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery(''); // clear query when switching major tab
        }}
        orderBadgeCount={4}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Operational Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          unreadCount={unreadNotifications}
        />

        {/* View Container with Responsive Padding */}
        <main className="flex-1 overflow-hidden px-6 pb-6 pt-1 flex flex-col min-h-0">
          {activeTab === 'order-line' && (
            <OrderLineView searchQuery={searchQuery} />
          )}

          {activeTab === 'manage-table' && (
            <ManageTableView />
          )}

          {activeTab === 'manage-dishes' && (
            <ManageDishesView searchQuery={searchQuery} />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={(tab) => {
                setActiveTab(tab);
              }}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  );
}
