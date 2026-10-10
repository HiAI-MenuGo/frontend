'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Clock,
  CheckCircle2,
  Trash2,
  Utensils,
  Receipt,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  getOrderHistoryFromCookie,
  getAggregatedItemsFromHistory,
  clearOrderHistoryCookie,
  addOrderToCookie,
  CustomerOrderHistoryRecord,
} from '@/lib/orderHistoryCookie';

interface CustomerOrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  displayTableName: string;
  onGoToMenu?: () => void;
  primaryColor?: string;
}

export function CustomerOrderHistoryModal({
  isOpen,
  onClose,
  tableId,
  displayTableName,
  onGoToMenu,
  primaryColor = '#00A389',
}: CustomerOrderHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'aggregated' | 'batches'>('aggregated');
  const [orders, setOrders] = useState<CustomerOrderHistoryRecord[]>([]);

  // Tải danh sách đơn hàng từ cookie
  const reloadHistory = () => {
    let list = getOrderHistoryFromCookie(tableId);

    // Nếu cookie chưa có dữ liệu, thử khôi phục từ localStorage của phiên đặt trước đó
    if (list.length === 0 && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`menugo_order_${tableId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
            const recovered = addOrderToCookie({
              orderCode: parsed.orderCode || 'H-001',
              tableId,
              tableName: displayTableName,
              totalAmount: parsed.totalAmount || 0,
              note: parsed.note,
              createdAt: parsed.createdAt || new Date().toISOString(),
              status: 'PREPARING',
              items: parsed.items.map((it: { name: string; quantity: number; basePrice?: number; price?: number; selectedModifiers?: any[]; note?: string }) => ({
                name: it.name,
                quantity: it.quantity || 1,
                unitPrice: it.basePrice ?? it.price ?? 0,
                selectedModifiers: it.selectedModifiers,
                note: it.note,
              })),
            });
            list = [recovered];
          }
        }
      } catch (err) {
        console.warn('Lỗi khôi phục từ localStorage:', err);
      }
    }

    setOrders(list);
  };

  useEffect(() => {
    if (isOpen) {
      reloadHistory();
    }
  }, [isOpen, tableId]);

  useEffect(() => {
    const handleUpdate = () => {
      reloadHistory();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('menugo:order_history_changed', handleUpdate);
      return () => {
        window.removeEventListener('menugo:order_history_changed', handleUpdate);
      };
    }
  }, [tableId]);

  if (!isOpen) return null;

  const aggregatedItems = getAggregatedItemsFromHistory(orders);
  const totalItemCount = aggregatedItems.reduce((sum, item) => sum + item.totalQuantity, 0);
  const totalAmount = orders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

  const handleClear = () => {
    if (window.confirm('Bạn có chắc muốn xoá lịch sử món đã gọi trong trình duyệt?')) {
      clearOrderHistoryCookie(tableId);
      setOrders([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[rgba(15,23,42,0.5)] backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white border border-[#E2E8F0] rounded-t-[28px] sm:rounded-3xl flex flex-col max-h-[88vh] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Header Bar */}
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E6F7F4] text-[#00A389] flex items-center justify-center shrink-0">
              <History size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[17px] font-extrabold text-[#0F172A] leading-tight">
                Lịch Sử Món Đã Gọi
              </h3>
              <p className="text-[11.5px] text-[#64748B] mt-0.5 font-medium">
                {displayTableName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200 flex items-center justify-center transition-all"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher Pills */}
        {orders.length > 0 && (
          <div className="px-4 pt-3 pb-1 border-b border-[#F1F5F9] bg-[#F8FAFC] flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('aggregated')}
              className={`flex-1 py-2 rounded-xl text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'aggregated'
                  ? 'bg-white text-[#00A389] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Utensils size={14} />
              <span>Tổng hợp ({totalItemCount} món)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('batches')}
              className={`flex-1 py-2 rounded-xl text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'batches'
                  ? 'bg-white text-[#00A389] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Receipt size={14} />
              <span>Theo đợt ({orders.length} lần)</span>
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {orders.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-3 text-[#94A3B8]">
              <div className="w-16 h-16 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8]">
                <Clock size={30} className="opacity-50" />
              </div>
              <div>
                <h4 className="text-[15px] font-extrabold text-[#0F172A]">Chưa có món nào được gọi</h4>
              </div>
              {onGoToMenu && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToMenu();
                  }}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[12.5px] shadow-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <span>Xem menu gọi món</span>
                  <ChevronRight size={15} />
                </button>
              )}
            </div>
          ) : activeTab === 'aggregated' ? (
            /* TAB 1: GOM NHÓM TẤT CẢ MÓN */
            <div className="space-y-2.5">
              <div className="p-3 bg-[#E6F7F4]/60 border border-[#00A389]/20 rounded-2xl flex items-center justify-between text-[12.5px]">
                <span className="text-[#00A389] font-bold">Tổng cộng các món đã gọi:</span>
                <span className="font-extrabold text-[#008770] font-mono text-[14px]">
                  {totalItemCount} món • {totalAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>

              {aggregatedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[#00A389] font-black text-[12px] font-mono">
                        {item.totalQuantity}x
                      </span>
                      <h5 className="font-extrabold text-[13.5px] text-[#0F172A] truncate">
                        {item.name}
                      </h5>
                    </div>

                    {item.notes.length > 0 && (
                      <p className="text-[11px] text-[#64748B] italic truncate mt-1">
                        Ghi chú: {item.notes.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[13.5px] font-black text-[#008770] font-mono">
                      {item.totalAmount.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="block text-[10.5px] text-[#94A3B8] font-mono">
                      ({item.unitPrice.toLocaleString('vi-VN')}đ/món)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TAB 2: TỪNG ĐỢT GỬI ĐƠN */
            <div className="space-y-3">
              {orders.map((ord, idx) => {
                const formattedTime = new Date(ord.createdAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const formattedDate = new Date(ord.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                });

                return (
                  <div
                    key={ord.id || idx}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3.5 space-y-2.5 shadow-2xs"
                  >
                    {/* Header đợt gọi */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-[#0F172A] text-white font-mono font-black text-[11px]">
                          {ord.orderCode || `Đơn #${orders.length - idx}`}
                        </span>
                        <span className="text-[11.5px] font-medium text-[#64748B]">
                          {formattedTime} • {formattedDate}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Flame size={12} className="text-amber-500" />
                        <span>Bếp nhận</span>
                      </span>
                    </div>

                    {/* Danh sách món trong đợt này */}
                    <div className="space-y-1.5">
                      {ord.items.map((it, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between items-center text-[12.5px]">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-bold text-[#00A389] font-mono">{it.quantity}x</span>
                            <span className="font-semibold text-[#0F172A] truncate">{it.name}</span>
                          </div>
                          <span className="font-mono font-bold text-[#475569] shrink-0 ml-2">
                            {(it.unitPrice * it.quantity).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer đợt */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-[12px]">
                      <span className="text-[#64748B]">Tổng tiền đợt này:</span>
                      <strong className="text-[#008770] font-mono font-black text-[13px]">
                        {ord.totalAmount.toLocaleString('vi-VN')}đ
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {orders.length > 0 && (
          <div className="p-3.5 border-t border-[#F1F5F9] bg-white flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-[12px] font-bold flex items-center gap-1 transition"
              title="Xoá lịch sử món đã gọi"
            >
              <Trash2 size={14} />
              <span>Xoá lịch sử</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onGoToMenu) onGoToMenu();
              }}
              style={{ backgroundColor: primaryColor }}
              className="px-5 py-2.5 rounded-xl font-extrabold text-white text-[12.5px] hover:brightness-105 active:scale-95 shadow-sm transition flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>Gọi thêm món</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerOrderHistoryModal;
