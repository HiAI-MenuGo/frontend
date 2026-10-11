'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { fetchActiveOrders } from '@/lib/api/orders.api';
import { fetchMe, AuthError, isTokenExpired } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

import { SocketProvider } from '@/context/SocketContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const initialize = useAuthStore((s) => s.initialize);
  const logout = useAuthStore((s) => s.logout);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [activeCount, setActiveCount] = useState(0);
  const [verifying, setVerifying] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Xác thực token với backend khi vào app: hết hạn -> văng về đăng nhập
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVerifying(false);
      router.replace('/login');
      return;
    }

    // Kiểm tra nhanh token cục bộ xem đã quá hạn exp chưa
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (localToken && isTokenExpired(localToken)) {
      logout();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'auth_expired_reason',
          'Phiên làm việc hoặc access token của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục làm việc.'
        );
      }
      setVerifying(false);
      router.replace('/login?expired=1');
      return;
    }

    let cancelled = false;
    fetchMe()
      .then(() => {
        if (!cancelled) setVerifying(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const code = e instanceof AuthError ? e.code : undefined;
        // Lỗi mạng thì ở lại app (các màn hình tự báo lỗi), chỉ văng khi lỗi xác thực
        if (code === 'NETWORK_ERROR') {
          setVerifying(false);
          return;
        }
        logout();
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'auth_expired_reason',
            'Phiên làm việc hoặc access token của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục làm việc.'
          );
        }
        router.replace('/login?expired=1');
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, router, logout]);

  // Kiểm tra định kỳ hạn của token trong lúc người dùng đang thao tác
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (currentToken && isTokenExpired(currentToken)) {
        logout();
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'auth_expired_reason',
            'Phiên làm việc hoặc access token của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục làm việc.'
          );
        }
        router.replace('/login?expired=1');
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    fetchActiveOrders()
      .then((orders) => {
        if (mounted) setActiveCount(orders.length);
      })
      .catch(() => {});
    const t = setInterval(() => {
      fetchActiveOrders()
        .then((orders) => {
          if (mounted) setActiveCount(orders.length);
        })
        .catch(() => {});
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [isAuthenticated]);

  const pathname = usePathname();
  const isOrdersPage = pathname === '/orders' || pathname.startsWith('/orders/');

  if (isLoading || verifying) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F4F6F8] text-sm text-slate-500">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SocketProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[#F4F6F8] font-sans text-slate-800 antialiased selection:bg-[#00A389] selection:text-white">
      {/* Sidebar overlay trên mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar orderBadgeCount={activeCount} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header unreadCount={activeCount} onOpenSidebar={() => setSidebarOpen(true)} />
        <main
          className={`flex-1 overflow-hidden flex flex-col min-h-0 ${
            isOrdersPage ? 'p-0' : 'px-3 pb-3 pt-1 sm:px-6 sm:pb-6'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
    </SocketProvider>
  );
}
