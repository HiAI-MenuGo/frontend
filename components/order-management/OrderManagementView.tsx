'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, Search, Clock, Timer, AlertTriangle,
  Check, CheckCircle2, ShoppingBag, Volume2, VolumeX, X, ChevronRight,
} from 'lucide-react';
import { fetchActiveOrders, updateOrderStatus, voidOrder } from '@/lib/api/orders.api';
import type { LiveOrderDTO } from '@/lib/api/types';
import { useSearchStore } from '@/stores/search.store';
import { useHeaderStore } from '@/stores/header.store';
import { formatVND } from '@/lib/format';
import { getSocket } from '@/lib/socket';

type OrderTab = 'PENDING' | 'CONFIRMED' | 'DONE';

interface ManagedOrder extends LiveOrderDTO {
  countdownSeconds?: number;
}

const DEFAULT_PREP_SECONDS = 10 * 60;

function formatCountdown(seconds?: number): string {
  const s = seconds ?? 0;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function OrderManagementView() {
  const globalSearch = useSearchStore((s) => s.query);
  const [orders, setOrders] = useState<ManagedOrder[]>([]);
  const [activeTab, setActiveTab] = useState<OrderTab>('PENDING');
  const [selected, setSelected] = useState<ManagedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await fetchActiveOrders();
      setOrders((prev) => {
        // Giữ lại đơn DONE đã thao tác local (giống mobile), còn lại thay bằng dữ liệu mới
        const doneLocal = prev.filter((o) => o.status === 'DONE');
        const merged: ManagedOrder[] = (data as ManagedOrder[]).map((o) => {
          const old = prev.find((p) => p.id === o.id);
          return { ...o, countdownSeconds: old?.countdownSeconds ?? o.countdownSeconds ?? DEFAULT_PREP_SECONDS };
        });
        for (const d of doneLocal) {
          if (!merged.some((o) => o.id === d.id)) merged.push(d);
        }
        return merged;
      });
    } catch (e: unknown) {
      if (!silent) setError(e instanceof Error ? e.message : 'Không tải được đơn hàng');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const setCustomAction = useHeaderStore((s) => s.setCustomAction);

  useEffect(() => {
    setCustomAction(
      <div className="flex items-center gap-2">
        <SearchBox />
        <button
          onClick={() => setSoundOn((prev) => !prev)}
          title={soundOn ? 'Tắt chuông' : 'Bật chuông'}
          className={`h-10 px-3 rounded-2xl border flex items-center gap-1.5 text-[12px] font-bold transition-all ${
            soundOn
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : 'bg-white border-[#E2E8F0] text-[#94A3B8] hover:text-[#0F172A]'
          }`}
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span className="hidden sm:inline">{soundOn ? 'Chuông: Bật' : 'Chuông: Tắt'}</span>
        </button>
      </div>
    );
    return () => setCustomAction(null);
  }, [setCustomAction, soundOn]);

  const beep = useCallback(() => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.08;
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
      setTimeout(() => ctx.close(), 400);
    } catch {
      // bỏ qua nếu trình duyệt chặn âm thanh
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Đếm ngược mỗi giây cho đơn đã xác nhận (giống mobile)
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prev) =>
        prev.map((ord) =>
          ord.status === 'CONFIRMED'
            ? { ...ord, countdownSeconds: Math.max(0, (ord.countdownSeconds ?? DEFAULT_PREP_SECONDS) - 1) }
            : ord
        )
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Realtime giống mobile: đơn mới (kêu chuông) / đổi trạng thái / hủy đơn
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
    } catch {
      return;
    }
    const onNew = (newOrder: ManagedOrder) => {
      if (soundOn) beep();
      setOrders((prev) =>
        prev.some((o) => o.id === newOrder.id)
          ? prev.map((o) => (o.id === newOrder.id ? { ...newOrder, countdownSeconds: o.countdownSeconds } : o))
          : [{ ...newOrder, countdownSeconds: newOrder.countdownSeconds ?? DEFAULT_PREP_SECONDS }, ...prev]
      );
    };
    const onUpdated = (payload: { orderId: string; status: LiveOrderDTO['status'] }) => {
      setOrders((prev) => prev.map((o) => (o.id === payload.orderId ? { ...o, status: payload.status } : o)));
    };
    const onVoided = (payload: { orderId: string }) => {
      setOrders((prev) => prev.filter((o) => o.id !== payload.orderId));
      setSelected((prev) => (prev && prev.id === payload.orderId ? null : prev));
    };
    socket.on('order:new', onNew);
    socket.on('order:updated', onUpdated);
    socket.on('order:voided', onVoided);
    return () => {
      socket.off('order:new', onNew);
      socket.off('order:updated', onUpdated);
      socket.off('order:voided', onVoided);
    };
  }, [beep, soundOn]);

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length;
  const doneCount = orders.filter((o) => o.status === 'DONE').length;

  const visible = orders.filter((o) => {
    if (o.status !== activeTab) return false;
    const q = globalSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      o.code.toLowerCase().includes(q) ||
      (o.customerName ?? '').toLowerCase().includes(q) ||
      (o.tableName ?? '').toLowerCase().includes(q) ||
      o.items.some((it) => it.name.toLowerCase().includes(q))
    );
  });

  const handleConfirm = async (order: ManagedOrder) => {
    setActing(true);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'CONFIRMED', countdownSeconds: DEFAULT_PREP_SECONDS } : o)));
    setSelected((prev) => (prev && prev.id === order.id ? { ...prev, status: 'CONFIRMED', countdownSeconds: DEFAULT_PREP_SECONDS } : prev));
    try {
      await updateOrderStatus(order.id, 'CONFIRMED');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Xác nhận thất bại');
      load(true);
    } finally {
      setActing(false);
    }
  };

  const handleDone = async (order: ManagedOrder) => {
    setActing(true);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'DONE' } : o)));
    try {
      await updateOrderStatus(order.id, 'DONE');
      setActiveTab('DONE');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Hoàn thành thất bại');
      load(true);
    } finally {
      setActing(false);
    }
  };

  const handleVoid = async (order: ManagedOrder) => {
    if (!confirm(`Hủy đơn ${order.code}?`)) return;
    const reason = prompt('Nhập lý do hủy:', 'Hết nguyên liệu');
    if (reason === null) return;
    setActing(true);
    try {
      await voidOrder(order.id, reason.trim() || 'Hủy bởi quản lý');
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setSelected(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Hủy đơn thất bại');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-slate-500">Đang tải đơn hàng...</div>;
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
        <p className="font-bold text-slate-800">Không tải được đơn hàng</p>
        <p className="text-sm text-slate-500">{error}</p>
        <button onClick={() => load()} className="px-5 py-2.5 bg-[#00A389] text-white rounded-xl text-sm font-semibold">Thử lại</button>
      </div>
    );
  }

  // ===== TRANG CHI TIẾT ĐƠN (giống mobile) =====
  if (selected) {
    const active = orders.find((o) => o.id === selected.id) ?? selected;
    const totalItems = active.items.reduce((s, it) => s + it.quantity, 0);
    const countdown = active.countdownSeconds ?? 0;
    const isOverdue = active.status === 'CONFIRMED' && countdown === 0;
    const hasAction = active.status === 'PENDING' || active.status === 'CONFIRMED';

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 pb-3">
          <button
            onClick={() => setSelected(null)}
            className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F172A]"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-[20px] font-extrabold text-[#0F172A]">Đơn {active.code}</h1>
          {active.status === 'CONFIRMED' && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${isOverdue ? 'bg-[#EF4444] text-white' : 'bg-[#ECFDF5] text-[#047857]'}`}>
              {isOverdue ? <AlertTriangle size={12} /> : <Timer size={12} />}
              {isOverdue ? '0:00 (Quá hạn!)' : formatCountdown(countdown)}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3.5 pb-4 pr-1">
          <div className="bg-white rounded-[20px] p-4 border border-[#E2E8F0]">
            <p className="text-[11px] font-extrabold text-[#94A3B8] tracking-wider mb-3">THÔNG TIN PHỤC VỤ</p>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-[13px] text-[#64748B]">Bàn / Khách:</span>
              <span className="text-[13.5px] font-bold text-[#0F172A]">{active.tableName ?? active.customerName ?? 'Mang về'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-t border-[#F8FAFC]">
              <span className="text-[13px] text-[#64748B]">Thanh toán:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${active.paymentStatus === 'PAID' ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#FEF3C7] text-[#D97706]'}`}>
                {active.paymentStatus === 'PAID'
                  ? `Đã thanh toán (${active.paymentMethod === 'VIETQR' ? 'VietQR' : 'Tiền mặt'})`
                  : `Chưa thanh toán (${active.paymentMethod === 'VIETQR' ? 'VietQR' : 'Tiền mặt'})`}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-[20px] p-4 border border-[#E2E8F0]">
            <p className="text-[11px] font-extrabold text-[#94A3B8] tracking-wider mb-2">DANH SÁCH MÓN ({totalItems} món)</p>
            {active.items.map((it) => (
              <div key={it.id} className="flex items-center py-2.5 border-b border-[#F8FAFC] last:border-0">
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt={it.name} className="w-11 h-11 rounded-[10px] bg-[#F1F5F9] object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-[10px] bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] font-black">{it.quantity}x</div>
                )}
                <div className="flex-1 ml-3 min-w-0">
                  <div className="text-[13.5px] font-bold text-[#0F172A]">{it.name}</div>
                  {it.note && <div className="text-[11px] text-[#D97706] font-semibold mt-0.5">• Ghi chú: {it.note}</div>}
                  <div className="text-[12px] text-[#64748B] mt-0.5">{formatVND(it.price)} x {it.quantity}</div>
                </div>
                <div className="text-[13.5px] font-extrabold text-[#0F172A]">{formatVND(it.price * it.quantity)}</div>
              </div>
            ))}
          </div>

          {active.note && (
            <div className="bg-[#FFFBEB] rounded-[16px] p-3.5 border border-[#FDE68A]">
              <div className="text-[12px] font-bold text-[#92400E]">Ghi chú của đơn:</div>
              <div className="text-[13px] text-[#78350F] mt-1 font-semibold">📝 {active.note}</div>
            </div>
          )}

          <div className="bg-white rounded-[20px] p-4 border border-[#E2E8F0]">
            <div className="flex justify-between items-center py-1">
              <span className="text-[13px] text-[#64748B]">Tạm tính ({totalItems} món):</span>
              <span className="text-[13.5px] font-bold text-[#0F172A]">{formatVND(active.total)}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5 mt-1.5 border-t border-[#F1F5F9]">
              <span className="text-[14.5px] font-extrabold text-[#0F172A]">Tổng thanh toán:</span>
              <span className="text-[18px] font-black text-[#00A389]">{formatVND(active.total)}</span>
            </div>
          </div>
        </div>

        {hasAction && (
          <div className="flex items-center gap-2.5 pt-1">
            {active.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleVoid(active)}
                  disabled={acting}
                  className="px-6 h-[52px] rounded-full bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-[13.5px] font-bold disabled:opacity-50"
                >
                  Hủy đơn
                </button>
                <button
                  onClick={() => handleConfirm(active)}
                  disabled={acting}
                  className="flex-1 h-[52px] rounded-full bg-[#00A389] hover:bg-[#008f77] text-white text-[13.5px] font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>Xác nhận</span>
                </button>
              </>
            )}
            {active.status === 'CONFIRMED' && (
              <button
                onClick={() => handleDone(active)}
                disabled={acting}
                className="flex-1 h-[52px] rounded-full bg-[#00A389] hover:bg-[#008f77] text-white text-[13.5px] font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 size={18} strokeWidth={2.5} />
                <span>Hoàn thành</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ===== DANH SÁCH ĐƠN (giống mobile) =====
  const tabs: Array<{ key: OrderTab; label: string; count: number; dot: string; activeText: string; activeBadge: string; inactiveBadge: string; inactiveText: string; empty: string }> = [
    { key: 'PENDING', label: 'Đang chờ', count: pendingCount, dot: 'bg-[#F59E0B]', activeText: 'text-[#D97706]', activeBadge: 'bg-[#F59E0B]', inactiveBadge: 'bg-[#FEF3C7]', inactiveText: 'text-[#D97706]', empty: 'Hiện chưa có đơn mới đang chờ tiếp nhận' },
    { key: 'CONFIRMED', label: 'Đã xác nhận', count: confirmedCount, dot: 'bg-[#2563EB]', activeText: 'text-[#2563EB]', activeBadge: 'bg-[#2563EB]', inactiveBadge: 'bg-[#EFF6FF]', inactiveText: 'text-[#2563EB]', empty: 'Không có đơn nào đang chế biến' },
    { key: 'DONE', label: 'Làm xong', count: doneCount, dot: 'bg-[#059669]', activeText: 'text-[#047857]', activeBadge: 'bg-[#047857]', inactiveBadge: 'bg-[#ECFDF5]', inactiveText: 'text-[#047857]', empty: 'Chưa có đơn làm xong trong danh sách' },
  ];

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      <div className="flex bg-[#EDF0F3] p-1 rounded-[14px]">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] ${isActive ? 'bg-white shadow-2xs' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full ${t.dot}`} />
              <span className={`text-[12px] ${isActive ? `${t.activeText} font-extrabold` : `font-semibold text-[#64748B]`}`}>{t.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? `${t.activeBadge} text-white` : `${t.inactiveBadge} ${t.inactiveText}`}`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
        {visible.length === 0 ? (
          <div className="bg-white rounded-[20px] p-8 flex flex-col items-center border border-[#E2E8F0] text-center">
            <div className="w-14 h-14 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
              <ShoppingBag size={28} className="text-[#94A3B8]" />
            </div>
            <p className="text-[15px] font-bold text-[#0F172A] mb-1">Không có đơn hàng nào</p>
            <p className="text-[12.5px] text-[#64748B]">{tabs.find((t) => t.key === activeTab)?.empty}</p>
          </div>
        ) : (
          visible.map((order) => {
            const totalItems = order.items.reduce((s, it) => s + it.quantity, 0);
            const countdown = order.countdownSeconds ?? 0;
            const isOverdue = order.status === 'CONFIRMED' && countdown === 0;
            return (
              <button
                key={order.id}
                onClick={() => setSelected(order)}
                className="w-full text-left bg-white rounded-[18px] p-3.5 border border-[#E2E8F0] shadow-2xs"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-extrabold text-[#0F172A]">Đơn {order.code}</span>
                    {order.status === 'CONFIRMED' && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isOverdue ? 'bg-[#EF4444] text-white' : 'bg-[#ECFDF5] text-[#047857]'}`}>
                        {isOverdue ? <AlertTriangle size={10} /> : <Timer size={10} />}
                        {isOverdue ? '0:00 (Quá hạn)' : formatCountdown(countdown)}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 bg-[#F1F5F9] px-2 py-0.5 rounded-full text-[11px] text-[#64748B]">
                    <Clock size={11} />
                    {order.time}
                  </span>
                </div>

                {(order.tableName || order.customerName) && (
                  <p className="text-[12px] font-semibold text-[#64748B] mb-2">{order.tableName ?? order.customerName}</p>
                )}

                <div className="bg-[#F8FAFC] rounded-[12px] p-2.5 mb-2.5 space-y-1.5">
                  {order.items.map((it) => (
                    <div key={it.id} className="flex items-center">
                      <span className="text-[12px] font-black text-[#00A389] mr-1.5">{it.quantity}x</span>
                      <span className="text-[12.5px] font-semibold text-[#0F172A] flex-1 truncate">{it.name}</span>
                      <span className="text-[12px] font-bold text-[#64748B]">{formatVND(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                {order.note && (
                  <div className="bg-[#FFFBEB] rounded-[8px] px-2.5 py-1 mb-2.5 border border-[#FEF3C7]">
                    <p className="text-[11px] text-[#92400E] font-medium truncate">📝 {order.note}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2.5 border-t border-[#F1F5F9]">
                  <div>
                    <div className="text-[11px] text-[#94A3B8]">{totalItems} món • Tổng tiền</div>
                    <div className="text-[14.5px] font-extrabold text-[#00A389]">{formatVND(order.total)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${order.paymentStatus === 'PAID' ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#FEF3C7] text-[#D97706]'}`}>
                      {order.paymentStatus === 'PAID' ? 'Đã thu tiền' : 'Chưa thanh toán'}
                    </span>
                    <ChevronRight size={16} className="text-[#94A3B8]" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <span className="hidden"><X size={1} /></span>
    </div>
  );
}

function SearchBox() {
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm mã đơn, món..."
        className="h-10 w-48 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-2xl text-[12.5px] focus:outline-none focus:border-[#00A389]"
      />
    </div>
  );
}
