'use client';

import React, { useState, useEffect } from 'react';
import OrderKanbanCard, { KdsOrder } from '../../components/kds/OrderKanbanCard';
import { getSocket } from '../../lib/socket';
import { Volume2, VolumeX, RefreshCw, ChefHat, Bell, Clock, Ban } from 'lucide-react';
import apiFetch from '../../lib/api';

export default function KdsPage() {
  const [orders, setOrders] = useState<KdsOrder[]>([
    {
      id: 'ord-101',
      orderCode: '#101',
      tableName: 'Bàn 02',
      orderType: 'DINE_IN',
      status: 'PREPARING',
      createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
      items: [
        {
          id: 'item-1',
          name: 'Trà Đào Cam Sả',
          quantity: 2,
          modifiers: [{ optionName: '50% Đường' }, { optionName: '50% Đá' }, { optionName: 'Trân Châu Trắng' }],
          status: 'PREPARING',
        },
        {
          id: 'item-2',
          name: 'Cà Phê Muối Đặc Biệt',
          quantity: 1,
          modifiers: [{ optionName: 'Ít đá' }],
          status: 'DONE',
        },
      ],
      note: 'Ít ngọt • Không lấy ống hút nhựa',
    },
    {
      id: 'ord-102',
      orderCode: '#102',
      tableName: 'Bàn 05 (Sân Vườn)',
      orderType: 'DINE_IN',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
      items: [
        {
          id: 'item-3',
          name: 'Bạc Xỉu Sài Gòn',
          quantity: 1,
          status: 'PENDING',
        },
        {
          id: 'item-4',
          name: 'Khoai Tây Chiên Phô Mai',
          quantity: 1,
          status: 'PENDING',
        },
      ],
    },
  ]);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('kds_muted') !== '1';
  });
  const [currentTime, setCurrentTime] = useState('');
  const [isConnected, setIsConnected] = useState(true);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('kds_muted', next ? '0' : '1');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Xin quyền Notification 1 lần để báo đơn mới khi tab ẩn.
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  const notifyNewOrder = (orderCode?: string) => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
        new Notification('Đơn mới cần chế biến', { body: orderCode ? `Mã đơn ${orderCode}` : 'Có đơn mới từ QR Menu / POS' });
      }
    } catch {
      // ignore notification errors
    }
  };

  // Chuông báo đơn mới: ưu tiên file /sounds/new_order.wav,
  // fallback Web Audio beep khi file chưa tải được.
  const playAlertSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audio = new Audio('/sounds/new_order.wav');
      audio.play().catch(() => playBeepFallback());
    } catch {
      playBeepFallback();
    }
  };

  const playBeepFallback = () => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext policy
    }
  };

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    const socket = getSocket();
    socket.emit('branch:join', { branchId: 'default-branch' });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('order:new', (newOrder: any) => {
      playAlertSound();
      notifyNewOrder(newOrder?.orderCode);
      setOrders((prev) => [newOrder, ...prev]);
    });

    socket.on('order:updated', (updated: any) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
      );
    });

    // Initial fetch from backend if available
    apiFetch('/orders/active?branchId=default-branch&view=kanban').then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setOrders(res.data);
      }
    });

    return () => {
      clearInterval(clockInterval);
      socket.off('order:new');
      socket.off('order:updated');
    };
  }, [soundEnabled]);

  const handleUpdateOrderStatus = (orderId: string, newStatus: 'PENDING' | 'PREPARING' | 'DONE') => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updatedItems = order.items.map((i) => ({ ...i, status: newStatus }));
          return { ...order, status: newStatus, items: updatedItems };
        }
        return order;
      })
    );

    apiFetch(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const handleUpdateItemStatus = (
    orderId: string,
    itemId: string,
    newStatus: 'PENDING' | 'PREPARING' | 'DONE'
  ) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updatedItems = order.items.map((i) =>
            i.id === itemId ? { ...i, status: newStatus } : i
          );
          const allDone = updatedItems.every((i) => i.status === 'DONE');
          const anyPreparing = updatedItems.some((i) => i.status === 'PREPARING');
          const orderStatus = allDone ? 'DONE' : anyPreparing ? 'PREPARING' : order.status;
          return { ...order, status: orderStatus, items: updatedItems };
        }
        return order;
      })
    );

    apiFetch(`/orders/items/${itemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const doneOrders = orders.filter((o) => o.status === 'DONE');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
      {/* Top KDS Control Bar */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-black">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wide text-zinc-100">
              MÀN HÌNH BẾP REALTIME (KDS)
            </h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`}
                />
                {isConnected ? 'Realtime Connected' : 'Mất kết nối'}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-400 font-semibold">Chi Nhánh Q.1</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Live Clock */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 border border-zinc-700/80 rounded-xl font-mono text-sm font-bold text-amber-400">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{currentTime}</span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              soundEnabled
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chuông Bật' : 'Tắt Chuông'}</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => {
              apiFetch('/orders/active?branchId=default-branch&view=kanban').then((res) => {
                if (res.data) setOrders(res.data);
              });
            }}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            title="Làm mới danh sách"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3-Column Kanban Board */}
      <main className="flex-1 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto">
        {/* Column 1: PENDING */}
        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-4 flex flex-col min-w-[300px]">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <h2 className="font-bold text-sm tracking-wider uppercase text-zinc-200">
                Chờ Làm ({pendingOrders.length})
              </h2>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {pendingOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-zinc-600 text-xs">
                Không có đơn chờ
              </div>
            ) : (
              pendingOrders.map((order) => (
                <OrderKanbanCard
                  key={order.id}
                  order={order}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onUpdateItemStatus={handleUpdateItemStatus}
                />
              ))
            )}
          </div>
        </section>

        {/* Column 2: PREPARING */}
        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-4 flex flex-col min-w-[300px]">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500" />
              <h2 className="font-bold text-sm tracking-wider uppercase text-zinc-200">
                Đang Nấu ({preparingOrders.length})
              </h2>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {preparingOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-zinc-600 text-xs">
                Chưa có món đang nấu
              </div>
            ) : (
              preparingOrders.map((order) => (
                <OrderKanbanCard
                  key={order.id}
                  order={order}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onUpdateItemStatus={handleUpdateItemStatus}
                />
              ))
            )}
          </div>
        </section>

        {/* Column 3: READY / DONE */}
        <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-4 flex flex-col min-w-[300px]">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="font-bold text-sm tracking-wider uppercase text-zinc-200">
                Đã Xong / Chờ Bưng ({doneOrders.length})
              </h2>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {doneOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-zinc-600 text-xs">
                Chưa có đơn hoàn tất
              </div>
            ) : (
              doneOrders.map((order) => (
                <OrderKanbanCard
                  key={order.id}
                  order={order}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onUpdateItemStatus={handleUpdateItemStatus}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
