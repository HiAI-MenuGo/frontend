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
} from 'lucide-react';
import {
  getOrderHistoryFromCookie,
  getAggregatedItemsFromHistory,
  clearOrderHistoryCookie,
  addOrderToCookie,
  updateOrderStatusInCookie,
  CustomerOrderHistoryRecord,
  COOKIE_NAME,
  setCookie,
  syncOrdersWithServer,
} from '@/lib/orderHistoryCookie';
import { formatDisplayDateTime } from '@/lib/date';
import { fetchActiveTableSession } from '@/lib/api/sessions.api';
import { formatVND } from '@/lib/format';
import { createTaggedLogger } from '@/lib/logger';
import {
  createMoMoQrPayment,
  createVNPayQrPayment,
  fetchQrPaymentStatus,
  type QrWalletCreateResult,
} from '@/lib/api/qrPayment.api';

interface CustomerOrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  displayTableName: string;
  tenantId?: string;
  branchId?: string;
  onGoToMenu?: () => void;
  primaryColor?: string;
  paymentEnabled?: boolean;
}

const log = createTaggedLogger('CART');
export function CustomerOrderHistoryModal({
  isOpen,
  onClose,
  tableId,
  displayTableName,
  tenantId,
  branchId,
  onGoToMenu,
  primaryColor = '#00A389',
  paymentEnabled = true,
}: CustomerOrderHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'aggregated' | 'batches'>('batches');
  const [orders, setOrders] = useState<CustomerOrderHistoryRecord[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);

  // Chọn phương thức thanh toán ở bước bấm Thanh toán (QR khách)
  const [showPayOptions, setShowPayOptions] = useState(false);
  const [walletLoading, setWalletLoading] = useState<'MOMO' | 'VNPAY' | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<QrWalletCreateResult | null>(null);
  const [walletProvider, setWalletProvider] = useState<'MOMO' | 'VNPAY' | null>(null);
  const [walletPaid, setWalletPaid] = useState(false);

  const basePath = tenantId && branchId
    ? `/${tenantId}/${branchId}/table/${tableId}`
    : `/table/${tableId}`;

  // Tải danh sách đơn hàng từ cookie (và fallback từ server nếu cookie chưa có)
  const reloadHistory = () => {
    let list = getOrderHistoryFromCookie(tableId);

    // Nếu cookie chưa có dữ liệu nhưng activeSession đã nạp từ server, dùng luôn dữ liệu server
    if (
      list.length === 0 &&
      activeSession?.orders &&
      Array.isArray(activeSession.orders) &&
      activeSession.orders.length > 0
    ) {
      list = syncOrdersWithServer([], activeSession.orders, tableId, displayTableName);
      try {
        setCookie(COOKIE_NAME, JSON.stringify(list));
      } catch {}
    }

    // Nếu cookie vẫn chưa có dữ liệu, thử khôi phục từ localStorage của phiên đặt trước đó
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
        log.warn('Lỗi khôi phục từ localStorage:', err);
      }
    }

    setOrders(list);
  };

  useEffect(() => {
    if (isOpen) {
      reloadHistory();
      fetchActiveTableSession(tableId)
        .then((sess) => {
          if (sess) {
            setActiveSession(sess);
            if (sess.orders && Array.isArray(sess.orders) && sess.orders.length > 0) {
              const current = getOrderHistoryFromCookie(tableId);
              const synced = syncOrdersWithServer(current, sess.orders, tableId, displayTableName);
              setOrders(synced);
              try {
                setCookie(COOKIE_NAME, JSON.stringify(synced));
              } catch {}
            } else {
              reloadHistory();
            }
          } else {
            // Không có phiên đang mở tại bàn này (bàn trống) -> dọn sạch bộ nhớ đệm của khách cũ
            setActiveSession(null);
            clearOrderHistoryCookie(tableId, true);
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`menugo_order_${tableId}`);
            }
            setOrders([]);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, tableId]);

  useEffect(() => {
    // Khi lịch sử đơn trong cookie thay đổi cục bộ, chỉ cần tải lại dữ liệu hiển thị (không gọi lại BE tránh lặp vô tận)
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

  // Phân loại các đợt gọi món: Đã xong vs Đang thực hiện
  const isRecordDone = (ord: CustomerOrderHistoryRecord) => {
    if (ord.status === 'DONE') return true;

    // Nếu bàn không có phiên active nào -> toàn bộ đơn trong cookie đều là đơn của phiên cũ đã đóng/hoàn thành
    if (!activeSession) return true;

    if (activeSession?.orders && Array.isArray(activeSession.orders)) {
      const match = activeSession.orders.find(
        (so: any) => so.orderCode === ord.orderCode || so.id === ord.id
      );
      if (match) {
        if (match.status === 'DONE' || match.status === 'READY' || match.status === 'SERVED') return true;
        if (Array.isArray(match.items) && match.items.length > 0) {
          return match.items.every(
            (it: any) => it.status === 'DONE' || it.status === 'READY' || it.status === 'SERVED'
          );
        }
        return false;
      } else {
        // Đơn trong cookie không thuộc phiên active hiện tại (thuộc phiên cũ đã đóng) -> đã xong
        return true;
      }
    }

    // Nếu activeSession có items phẳng và toàn bộ items trong phiên đều DONE / READY / SERVED
    if (activeSession?.items && Array.isArray(activeSession.items) && activeSession.items.length > 0) {
      const allSessionItemsDone = activeSession.items.every(
        (it: any) => it.status === 'DONE' || it.status === 'READY' || it.status === 'SERVED'
      );
      if (allSessionItemsDone) return true;
    }

    return false;
  };

  // 1. Đợt chưa hoàn thành -> Còn lại ở tab "Theo đợt"
  const pendingOrders = orders.filter((o) => !isRecordDone(o));
  // 2. Đợt đã hoàn thành -> Chuyển sang tab "Tổng đơn"
  const doneOrders = orders.filter((o) => isRecordDone(o));

  // Gom các món đã xong cho tab "Tổng đơn"
  const doneAggregatedItems = getAggregatedItemsFromHistory(doneOrders);
  const doneItemCount = doneAggregatedItems.reduce((sum, item) => sum + item.totalQuantity, 0);
  const doneTotalAmount = doneOrders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

  // Điều kiện chỉ cho phép thanh toán: Có món, toàn bộ món đã xong, và quán đang bật tính năng gọi thanh toán
  const hasOrders = orders.length > 0;
  const allOrdersDone = hasOrders && pendingOrders.length === 0 && doneOrders.length > 0 && paymentEnabled;

  // Tự động chọn tab phù hợp với tiến độ
  useEffect(() => {
    if (orders.length > 0) {
      if (pendingOrders.length > 0 && doneOrders.length === 0) {
        setActiveTab('batches');
      } else if (pendingOrders.length === 0 && doneOrders.length > 0) {
        setActiveTab('aggregated');
      }
    }
  }, [orders.length, pendingOrders.length, doneOrders.length]);

  const handleMarkDone = (orderId: string, orderCode?: string) => {
    updateOrderStatusInCookie(tableId, orderId, 'DONE');
    if (orderCode && orderCode !== orderId) {
      updateOrderStatusInCookie(tableId, orderCode, 'DONE');
    }
    reloadHistory();
  };

  const handleCheckout = () => {
    if (!allOrdersDone || !paymentEnabled) return;
    // Mở bước chọn phương thức: MoMo / VNPay sandbox (không nối sang gọi thanh toán)
    setWalletError(null);
    setWalletData(null);
    setWalletProvider(null);
    setWalletPaid(false);
    setShowPayOptions(true);
  };

  // Poll trạng thái IPN 3s/lần sau khi đã sinh QR ví
  useEffect(() => {
    if (!walletData?.referenceNo || walletPaid) return;
    const ref = walletData.referenceNo;
    const timer = setInterval(async () => {
      try {
        const st = await fetchQrPaymentStatus(ref);
        if (st.status === 'PAID') {
          setWalletPaid(true);
          clearInterval(timer);
        } else if (st.status === 'FAILED') {
          setWalletError('Giao dịch thất bại hoặc đã hết hạn. Bạn bấm Tạo lại để sinh mã mới.');
          clearInterval(timer);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [walletData?.referenceNo, walletPaid]);

  const handleCreateWallet = async (provider: 'MOMO' | 'VNPAY') => {
    setWalletLoading(provider);
    setWalletError(null);
    setWalletData(null);
    setWalletProvider(provider);
    setWalletPaid(false);
    try {
      const data =
        provider === 'MOMO' ? await createMoMoQrPayment(tableId) : await createVNPayQrPayment(tableId);
      setWalletData(data);
    } catch (err: any) {
      setWalletError(err?.message || 'Không tạo được thanh toán. Quán cần điền key sandbox trước.');
    } finally {
      setWalletLoading(null);
    }
  };

  const handleWalletDone = () => {
    clearOrderHistoryCookie(tableId);
    setOrders([]);
    setShowPayOptions(false);
    onClose();
  };

  const handleClear = () => {
    if (window.confirm('Bạn có chắc muốn xoá lịch sử món đã gọi trong trình duyệt?')) {
      clearOrderHistoryCookie(tableId);
      setOrders([]);
    }
  };

  if (!isOpen) return null;

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
                Lịch Sử
              </h3>
              <p className="text-[11.5px] text-[#64748B] mt-0.5 font-medium">
                {displayTableName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher Pills: Tổng đơn & Theo đợt */}
        {orders.length > 0 && (
          <div className="px-4 pt-3 pb-1 border-b border-[#F1F5F9] bg-[#F8FAFC] flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('aggregated')}
              className={`flex-1 py-2 rounded-xl text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'aggregated'
                  ? 'bg-white text-[#00A389] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Utensils size={14} />
              <span>Tổng đơn ({doneItemCount} món)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('batches')}
              className={`flex-1 py-2 rounded-xl text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'batches'
                  ? 'bg-white text-[#00A389] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Receipt size={14} />
              <span>Theo đợt ({pendingOrders.length} lần)</span>
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
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[12.5px] shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <span>Xem menu gọi món</span>
                  <ChevronRight size={15} />
                </button>
              )}
            </div>
          ) : activeTab === 'aggregated' ? (
            /* TAB 1: TỔNG ĐƠN (CÁC MÓN ĐÃ LÀM XONG) */
            doneOrders.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2.5 text-[#94A3B8]">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-500 flex items-center justify-center">
                  <Clock size={26} className="animate-pulse" />
                </div>
                <div>
                  <h5 className="text-[14px] font-extrabold text-[#0F172A]">Chưa có món nào hoàn thành</h5>
                  <p className="text-[12px] text-[#64748B] mt-1 max-w-xs leading-relaxed">
                    Món đang được chế biến ở tab <strong className="text-amber-600 font-bold">Theo đợt</strong>. Khi làm xong sẽ tự động chuyển sang Tổng đơn.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="p-3 bg-[#E6F7F4]/60 border border-[#00A389]/20 rounded-2xl flex items-center justify-between text-[12.5px]">
                  <div className="flex items-center gap-1.5 text-[#00A389] font-bold">
                    <CheckCircle2 size={15} />
                    <span>Món đã hoàn thành:</span>
                  </div>
                  <span className="font-extrabold text-[#008770] font-mono text-[14px]">
                    {doneItemCount} món • {doneTotalAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                {doneAggregatedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-[12px] font-mono">
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
            )
          ) : (
            /* TAB 2: THEO ĐỢT (CÁC ĐỢT ĐANG THỰC HIỆN - CHƯA XONG) */
            pendingOrders.length === 0 ? (
              <div className="py-12 flex items-center justify-center text-center">
                <span className="text-[14px] font-bold text-[#94A3B8]">Trống</span>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((ord, idx) => {
                  const formatted = formatDisplayDateTime(ord.createdAt);

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
                            {formatted}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMarkDone(ord.id, ord.orderCode)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md border text-amber-700 bg-amber-50 border-amber-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all cursor-pointer"
                          title="Bấm để đánh dấu đã làm xong (chuyển sang Tổng đơn)"
                        >
                          <Clock size={11} className="animate-pulse" />
                          <span>Đang thực hiện</span>
                        </button>
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
            )
          )}
        </div>

        {/* Footer Actions */}
        {orders.length > 0 && (
          <div className="p-3.5 border-t border-[#F1F5F9] bg-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-[12px] font-bold flex items-center gap-1 transition cursor-pointer"
                title="Xoá lịch sử"
              >
                <Trash2 size={14} />
                <span>Xoá</span>
              </button>
            </div>

            {/* Nút Thanh toán: Chỉ cho phép bấm khi toàn bộ món chuyển qua "xong" */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!allOrdersDone}
              style={{
                backgroundColor: allOrdersDone ? primaryColor : undefined,
              }}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-[13px] transition flex items-center gap-1.5 shadow-md ${
                allOrdersDone
                  ? 'text-white hover:brightness-105 active:scale-95 shadow-[#00A389]/20 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border border-slate-300/50 cursor-not-allowed shadow-none'
              }`}
              title={
                !paymentEnabled
                  ? 'Quán đã tắt tính năng gọi thanh toán'
                  : allOrdersDone
                  ? 'Bấm để thanh toán'
                  : `Cần đợi tất cả món hoàn thành trước khi thanh toán (còn ${pendingOrders.length} đợt đang làm)`
              }
            >
              <span>
                {!paymentEnabled
                  ? 'Đã tắt thanh toán'
                  : allOrdersDone
                  ? `Thanh toán (${formatVND(doneTotalAmount)})`
                  : `Chờ món xong (${pendingOrders.length} đợt)`}
              </span>
            </button>
          </div>
        )}

        {/* Bước chọn phương thức thanh toán (MoMo / VNPay sandbox) */}
        {showPayOptions && (
          <div className="absolute inset-0 z-10 bg-white rounded-t-[28px] sm:rounded-3xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between shrink-0">
              <div>
                <h4 className="text-[15px] font-black text-[#0F172A]">Chọn cách thanh toán</h4>
                <p className="text-[11.5px] text-[#64748B]">
                  Tổng cần trả: <strong className="font-mono text-[#008770]">{formatVND(doneTotalAmount)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayOptions(false)}
                className="w-9 h-9 rounded-xl bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center"
                aria-label="Quay lại"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {walletPaid ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={28} />
                  </div>
                  <h5 className="text-[15px] font-black text-[#0F172A]">Đã thanh toán thành công!</h5>
                  <p className="text-[12px] text-[#64748B]">IPN từ ví đã xác nhận. Bạn có thể rời bàn.</p>
                  <button
                    type="button"
                    onClick={handleWalletDone}
                    className="mt-2 px-5 py-2.5 rounded-xl text-white font-extrabold text-[13px]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Hoàn tất
                  </button>
                </div>
              ) : !walletData ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleCreateWallet('MOMO')}
                    disabled={walletLoading !== null}
                    className="w-full p-3.5 rounded-2xl border border-pink-200 bg-pink-50/60 hover:bg-pink-50 text-left transition-all disabled:opacity-50"
                  >
                    <span className="block font-black text-[13.5px] text-[#BE185D]">
                      {walletLoading === 'MOMO' ? 'Đang tạo MoMo...' : 'Ví MoMo (sandbox)'}
                    </span>
                    <span className="block text-[11.5px] text-[#64748B] mt-0.5">
                      Hiện QR + nút mở app, tự xác nhận qua IPN
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateWallet('VNPAY')}
                    disabled={walletLoading !== null}
                    className="w-full p-3.5 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-50 text-left transition-all disabled:opacity-50"
                  >
                    <span className="block font-black text-[13.5px] text-[#1D4ED8]">
                      {walletLoading === 'VNPAY' ? 'Đang tạo VNPay...' : 'VNPay (sandbox)'}
                    </span>
                    <span className="block text-[11.5px] text-[#64748B] mt-0.5">
                      Hiện QR + nút mở app, tự xác nhận qua IPN
                    </span>
                  </button>
                  {walletError && (
                    <p className="text-[12px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                      {walletError}
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[12px] text-[#334155]">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Cổng:</span>
                      <strong>{walletProvider}</strong>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[#64748B]">Số tiền:</span>
                      <strong className="font-mono text-[#008770]">{formatVND(walletData.amount)}</strong>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[#64748B]">Mã GD:</span>
                      <strong className="font-mono">{walletData.referenceNo}</strong>
                    </div>
                  </div>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      walletData.qrCodeUrl ||
                      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(walletData.payUrl)}`
                    }
                    alt={`QR ${walletProvider}`}
                    className="w-55 h-55 max-w-full mx-auto rounded-2xl border border-[#E2E8F0] bg-white p-2"
                    width={220}
                    height={220}
                  />
                  <p className="text-center text-[11.5px] text-[#64748B]">
                    Không muốn chuyển app? Tắt popup trình duyệt rồi dùng app ví quét QR này — vẫn tự xác nhận.
                  </p>

                  <a
                    href={walletData.deeplink || walletData.payUrl}
                    className="block text-center px-5 py-2.5 rounded-xl text-white font-extrabold text-[13px]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Mở app {walletProvider} (đã điền sẵn tiền)
                  </a>
                  <p className="text-center text-[11px] text-[#94A3B8] animate-pulse">
                    Đang chờ IPN tự xác nhận (poll 3s/lần)...
                  </p>

                  {walletError && (
                    <p className="text-[12px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                      {walletError}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => (setWalletData(null), setWalletProvider(null))}
                      className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-bold text-[12.5px]"
                    >
                      Đổi cách khác
                    </button>
                    <button
                      type="button"
                      onClick={() => walletProvider && handleCreateWallet(walletProvider)}
                      className="flex-1 h-10 rounded-xl border border-[#E2E8F0] font-bold text-[12.5px] text-[#475569]"
                    >
                      Tạo lại mã
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerOrderHistoryModal;
