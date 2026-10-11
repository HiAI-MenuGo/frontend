'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Bell,
  BellRing,
  Star,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  RefreshCw,
  CreditCard,
  UserCheck,
  Check,
  X,
  Filter,
  Sparkles,
  Smile,
  Frown,
  Phone,
  MessageSquare,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  fetchCustomerCalls,
  updateCustomerCallStatus,
  fetchCustomerReviews,
  type CustomerCallItem,
  type CustomerReviewItem,
  type ReviewSummary,
} from '@/lib/api/customerRequests.api';
import { useBranchStore } from '@/stores/branch.store';
import { useHeaderStore } from '@/stores/header.store';
import { useSocket } from '@/context/SocketContext';
import { formatDisplayDate, formatDisplayDateTime } from '@/lib/date';

export interface CustomerRequestsViewProps {
  activeTab?: 'calls' | 'reviews';
  onTabChange?: (tab: 'calls' | 'reviews') => void;
  hideTabBar?: boolean;
  embedded?: boolean;
}

export default function CustomerRequestsView({
  activeTab: controlledTab,
  onTabChange,
  hideTabBar = false,
  embedded = false,
}: CustomerRequestsViewProps = {}) {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const setCustomAction = useHeaderStore((s) => s.setCustomAction);

  // Tabs: 'calls' | 'reviews'
  const [internalTab, setInternalTab] = useState<'calls' | 'reviews'>('calls');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: 'calls' | 'reviews') => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // Trạng thái Yêu cầu gọi bàn
  const [calls, setCalls] = useState<CustomerCallItem[]>([]);
  const [callsSummary, setCallsSummary] = useState({ total: 0, pending: 0, processing: 0 });
  const [callTypeFilter, setCallTypeFilter] = useState<'ALL' | 'PAYMENT' | 'STAFF'>('ALL');
  const [callStatusFilter, setCallStatusFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED'>('ALL');
  const [loadingCalls, setLoadingCalls] = useState(true);

  // Trạng thái Đánh giá
  const [reviews, setReviews] = useState<CustomerReviewItem[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>({
    averageRating: 5.0,
    totalReviews: 0,
    satisfactionRate: 100,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [starFilter, setStarFilter] = useState<'ALL' | number>('ALL');
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Bật / tắt âm thanh chuông thông báo
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Hàm phát âm thanh ding-dong nhẹ khi có yêu cầu mới
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, [soundEnabled]);

  // Đưa nút bật/tắt âm thanh chuông lên Topbar (Header)
  useEffect(() => {
    setCustomAction(
      <button
        type="button"
        onClick={() => setSoundEnabled((prev) => !prev)}
        className={`h-9.5 px-3.5 rounded-2xl border text-[12.5px] font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-2xs select-none ${
          soundEnabled
            ? 'bg-[#E6F7F4] border-[#00A389]/30 text-[#00A389] hover:bg-[#d6f2ec]'
            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
        }`}
        title={soundEnabled ? 'Chuông thông báo: Đang bật' : 'Chuông thông báo: Đang tắt'}
      >
        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        <span className="hidden sm:inline">{soundEnabled ? 'Chuông: Bật' : 'Chuông: Tắt'}</span>
      </button>
    );
    return () => setCustomAction(null);
  }, [setCustomAction, soundEnabled]);

  // Load danh sách Yêu cầu
  const loadCalls = useCallback(async () => {
    try {
      setLoadingCalls(true);
      const res = await fetchCustomerCalls({
        status: callStatusFilter,
        type: callTypeFilter,
        branchId: selectedBranchId,
      });
      // Chuẩn hóa và loại bỏ trùng lặp id nếu có
      const uniqueCallsMap = new Map<string, CustomerCallItem>();
      (res.calls || []).forEach((c, idx) => {
        const cId = c.id || `call-${c.tableId || 'tbl'}-${idx}`;
        if (!uniqueCallsMap.has(cId)) {
          uniqueCallsMap.set(cId, { ...c, id: cId });
        }
      });
      setCalls(Array.from(uniqueCallsMap.values()));
      setCallsSummary(res.summary);
    } catch (err) {
      console.warn('Lỗi tải yêu cầu gọi bàn:', err);
    } finally {
      setLoadingCalls(false);
    }
  }, [callStatusFilter, callTypeFilter, selectedBranchId]);

  // Load danh sách Đánh giá
  const loadReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      const res = await fetchCustomerReviews({
        rating: starFilter,
        branchId: selectedBranchId,
      });
      setReviews(res.reviews);
      setReviewSummary(res.summary);
    } catch (err) {
      console.warn('Lỗi tải đánh giá khách hàng:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, [starFilter, selectedBranchId]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Lắng nghe Socket.IO Realtime
  const { on, off, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handleNewCall = (newCall: CustomerCallItem) => {
      if (!newCall) return;
      playNotificationSound();
      const callId =
        newCall.id ||
        `call-${newCall.tableId || 'tbl'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const callWithId: CustomerCallItem = { ...newCall, id: callId };

      setCalls((prev) => {
        const next = [callWithId, ...prev.filter((c) => c.id !== callWithId.id)];
        setCallsSummary({
          total: next.length,
          pending: next.filter((c) => c.status === 'PENDING').length,
          processing: next.filter((c) => c.status === 'PROCESSING').length,
        });
        return next;
      });
    };

    const handleUpdateCall = (updated: CustomerCallItem) => {
      setCalls((prev) => {
        const next = prev.map((c) => (c.id === updated.id ? updated : c));
        setCallsSummary({
          total: next.length,
          pending: next.filter((c) => c.status === 'PENDING').length,
          processing: next.filter((c) => c.status === 'PROCESSING').length,
        });
        return next;
      });
    };

    const handleNewReview = (newRev: CustomerReviewItem) => {
      playNotificationSound();
      setReviews((prev) => [newRev, ...prev]);
      setReviewSummary((prev) => {
        const total = prev.totalReviews + 1;
        const counts = { ...prev.ratingCounts };
        const st = Math.min(5, Math.max(1, newRev.rating)) as 1 | 2 | 3 | 4 | 5;
        counts[st] = (counts[st] || 0) + 1;
        return {
          ...prev,
          totalReviews: total,
          ratingCounts: counts,
        };
      });
    };

    on('call_staff:request', handleNewCall);
    on('call_staff:updated', handleUpdateCall);
    on('review:new', handleNewReview);

    return () => {
      off('call_staff:request', handleNewCall);
      off('call_staff:updated', handleUpdateCall);
      off('review:new', handleNewReview);
    };
  }, [isConnected, on, off, playNotificationSound]);

  // Xử lý cập nhật trạng thái yêu cầu
  const handleUpdateStatus = async (
    id: string,
    nextStatus: 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  ) => {
    setActionLoadingId(id);
    try {
      const updated = await updateCustomerCallStatus(id, nextStatus);
      setCalls((prev) => {
        const next = prev.map((c) => (c.id === id ? updated : c));
        setCallsSummary({
          total: next.length,
          pending: next.filter((c) => c.status === 'PENDING').length,
          processing: next.filter((c) => c.status === 'PROCESSING').length,
        });
        return next;
      });
    } catch (err: any) {
      alert(err?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Tính thời gian tương đối
  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return formatDisplayDate(isoString);
    } catch {
      return '';
    }
  };

  return (
    <div className={embedded ? 'space-y-6 w-full' : 'flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-7 space-y-6'}>

      {/* ======================================================== */}
      {/* 2. CHỌN TAB LỚN: Yêu cầu gọi bàn vs Đánh giá & Rating    */}
      {/* ======================================================== */}
      {!hideTabBar && (
        <div className="flex border-b border-[#E2E8F0] gap-3 sm:gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('calls')}
            className={`pb-3.5 text-[14.5px] font-black flex items-center gap-2.5 transition-all relative cursor-pointer ${
              activeTab === 'calls'
                ? 'text-[#00A389]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <BellRing size={18} />
            <span>Yêu cầu gọi bàn</span>
            {callsSummary.pending > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#EF4444] text-white text-[11px] font-black animate-bounce shadow-xs">
                {callsSummary.pending} mới
              </span>
            )}
            {activeTab === 'calls' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#00A389] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`pb-3.5 text-[14.5px] font-black flex items-center gap-2.5 transition-all relative cursor-pointer ${
              activeTab === 'reviews'
                ? 'text-amber-600'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Star size={18} className="fill-amber-400 text-amber-500" />
            <span>Đánh giá & Rating</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black">
              {reviewSummary.totalReviews} lượt
            </span>
            {activeTab === 'reviews' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-amber-500 rounded-full" />
            )}
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: YÊU CẦU GỌI BÀN (SERVICE CALLS)                     */}
      {/* ======================================================== */}
      {activeTab === 'calls' && (
        <div className="space-y-5">
          {/* Hàng 3 thẻ KPI Thống kê */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11.5px] font-black text-rose-600 uppercase tracking-wider block">
                  Đang chờ tiếp nhận
                </span>
                <span className="text-[28px] font-black text-[#0F172A] tracking-tight">
                  {callsSummary.pending}
                </span>
                <p className="text-[11.5px] text-[#64748B] mt-0.5">Khách đang đợi nhân viên đến</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Bell size={24} className="animate-pulse" />
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11.5px] font-black text-blue-600 uppercase tracking-wider block">
                  Đang phục vụ
                </span>
                <span className="text-[28px] font-black text-[#0F172A] tracking-tight">
                  {callsSummary.processing}
                </span>
                <p className="text-[11.5px] text-[#64748B] mt-0.5">Nhân viên đã tiếp nhận yêu cầu</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <UserCheck size={24} />
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11.5px] font-black text-emerald-600 uppercase tracking-wider block">
                  Tổng yêu cầu hôm nay
                </span>
                <span className="text-[28px] font-black text-[#0F172A] tracking-tight">
                  {calls.length}
                </span>
                <p className="text-[11.5px] text-[#64748B] mt-0.5">Yêu cầu từ các bàn quét QR</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </div>

          {/* Bộ lọc loại và trạng thái */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E2E8F0]">
            {/* Lọc loại yêu cầu */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11.5px] font-bold text-[#64748B] mr-1 hidden sm:inline">
                Loại:
              </span>
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'PAYMENT', label: '💳 Gọi thanh toán' },
                { id: 'STAFF', label: '🙋 Gọi nhân viên' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCallTypeFilter(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    callTypeFilter === t.id
                      ? 'bg-[#00A389] text-white shadow-2xs'
                      : 'bg-[#F8FAFC] text-[#475569] hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Lọc trạng thái */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11.5px] font-bold text-[#64748B] mr-1 hidden sm:inline">
                Trạng thái:
              </span>
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'PENDING', label: 'Chờ xử lý' },
                { id: 'PROCESSING', label: 'Đang phục vụ' },
                { id: 'COMPLETED', label: 'Đã hoàn tất' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCallStatusFilter(s.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    callStatusFilter === s.id
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'bg-[#F8FAFC] text-[#475569] hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách thẻ yêu cầu */}
          {loadingCalls ? (
            <div className="py-16 text-center text-slate-400 font-bold text-[13px]">
              Đang tải danh sách yêu cầu gọi bàn...
            </div>
          ) : calls.length === 0 ? (
            <div className="py-16 bg-white rounded-3xl border border-dashed border-[#E2E8F0] text-center flex flex-col items-center justify-center p-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-[16px] font-black text-[#0F172A]">Không có yêu cầu gọi nào</h3>
              <p className="text-[12.5px] text-[#64748B] max-w-sm mt-1">
                Hiện tại không có bàn nào đang gọi phục vụ hoặc gọi thanh toán. Khi khách quét mã QR yêu cầu, chuông sẽ reo và hiện tại đây ngay lập tức.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calls.map((call, idx) => {
                const isPending = call.status === 'PENDING';
                const isProcessing = call.status === 'PROCESSING';
                const isCompleted = call.status === 'COMPLETED';
                const callKey = call.id || `call-${call.tableId || 'tbl'}-${call.createdAt || idx}`;

                return (
                  <div
                    key={callKey}
                    className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-2xs hover:shadow-md ${
                      isPending
                        ? 'border-rose-300 ring-2 ring-rose-200/50'
                        : isProcessing
                        ? 'border-blue-300 ring-1 ring-blue-100'
                        : 'border-[#E2E8F0] opacity-80'
                    }`}
                  >
                    <div>
                      {/* Header Card: Bàn & Trạng thái */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-[18px] font-black text-[#0F172A] block tracking-tight">
                            {call.tableName}
                          </span>
                          <span className="text-[11.5px] text-[#64748B] flex items-center gap-1 mt-0.5">
                            <Clock size={12} className="text-[#94A3B8]" />
                            {formatTimeAgo(call.createdAt)}
                          </span>
                        </div>

                        {/* Badge trạng thái */}
                        <span
                          className={`text-[11px] font-black px-2.5 py-1 rounded-full border shrink-0 ${
                            isPending
                              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                              : isProcessing
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isPending
                            ? '🔴 Chờ xử lý'
                            : isProcessing
                            ? '🟡 Đang phục vụ'
                            : 'Đã xong'}
                        </span>
                      </div>

                      {/* Loại yêu cầu & Lý do */}
                      <div
                        className={`p-3.5 rounded-2xl border mb-4 space-y-1 ${
                          call.type === 'PAYMENT'
                            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                            : 'bg-blue-50/70 border-blue-200/80 text-blue-950'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
                          {call.type === 'PAYMENT' ? (
                            <>
                              <CreditCard size={14} className="text-emerald-700" />
                              <span className="text-emerald-800">
                                Yêu cầu thanh toán
                              </span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} className="text-blue-700" />
                              <span className="text-blue-800">Yêu cầu nhân viên</span>
                            </>
                          )}
                        </div>
                        <p className="text-[13.5px] font-bold leading-snug">
                          {call.type === 'PAYMENT'
                            ? `Phương thức: ${
                                call.paymentMethod === 'VIETQR' ||
                                call.reason?.toLowerCase().includes('vietqr') ||
                                call.reason?.toLowerCase().includes('chuyển khoản')
                                  ? 'Chuyển khoản'
                                  : 'Tiền mặt'
                              }`
                            : call.reason}
                        </p>
                      </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      {isPending && (
                        <button
                          type="button"
                          disabled={actionLoadingId === call.id}
                          onClick={() => handleUpdateStatus(call.id, 'PROCESSING')}
                          className="flex-1 h-9.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12.5px] flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <UserCheck size={15} />
                          <span>Tiếp nhận</span>
                        </button>
                      )}

                      {(isPending || isProcessing) && (
                        <button
                          type="button"
                          disabled={actionLoadingId === call.id}
                          onClick={() => handleUpdateStatus(call.id, 'COMPLETED')}
                          className="flex-1 h-9.5 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-bold text-[12.5px] flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Check size={15} />
                          <span>Đã phục vụ xong</span>
                        </button>
                      )}

                      {isCompleted && (
                        <div className="w-full text-center text-[12px] font-bold text-emerald-700 py-1.5 bg-emerald-50 rounded-xl">
                          Đã xử lý lúc {new Date(call.resolvedAt || call.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}

                      {!isCompleted && (
                        <button
                          type="button"
                          disabled={actionLoadingId === call.id}
                          onClick={() => handleUpdateStatus(call.id, 'CANCELLED')}
                          className="w-9.5 h-9.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer shrink-0"
                          title="Hủy yêu cầu"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ĐÁNH GIÁ & RATING CỦA KHÁCH HÀNG (REVIEWS)         */}
      {/* ======================================================== */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Card KPI tổng quan đánh giá */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-2xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Cột trái: Điểm trung bình */}
            <div className="md:col-span-4 text-center md:text-left md:border-r border-slate-100 md:pr-6">
              <span className="text-[12px] font-extrabold text-[#64748B] uppercase tracking-wider block mb-1">
                ĐIỂM ĐÁNH GIÁ TRUNG BÌNH
              </span>
              <div className="flex items-baseline justify-center md:justify-start gap-2.5">
                <span className="text-[48px] font-black text-[#0F172A] tracking-tight leading-none">
                  {reviewSummary.averageRating}
                </span>
                <span className="text-[16px] font-bold text-[#94A3B8]">/ 5.0</span>
              </div>

              {/* 5 ngôi sao vàng */}
              <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={20}
                    className={
                      s <= Math.round(reviewSummary.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }
                  />
                ))}
              </div>

              <div className="text-[12.5px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl inline-block mt-1">
                ⭐ {reviewSummary.satisfactionRate}% Khách hàng hài lòng
              </div>
            </div>

            {/* Cột phải: Thanh phân bổ sao */}
            <div className="md:col-span-8 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewSummary.ratingCounts[stars as 1 | 2 | 3 | 4 | 5] || 0;
                const percent =
                  reviewSummary.totalReviews > 0
                    ? Math.round((count / reviewSummary.totalReviews) * 100)
                    : 0;

                return (
                  <div key={stars} className="flex items-center gap-3 text-[12.5px]">
                    <span className="w-10 font-bold text-[#334155] flex items-center gap-1 shrink-0">
                      <span>{stars}</span>
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-mono font-bold text-[#64748B] shrink-0">
                      {count} ({percent}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bộ lọc số sao */}
          <div className="flex items-center gap-2 bg-white p-3.5 rounded-2xl border border-[#E2E8F0] overflow-x-auto no-scrollbar">
            <span className="text-[12px] font-bold text-[#64748B] mr-1 shrink-0">
              Lọc theo số sao:
            </span>
            {[
              { id: 'ALL', label: 'Tất cả đánh giá' },
              { id: 5, label: '⭐⭐⭐⭐⭐ 5 sao' },
              { id: 4, label: '⭐⭐⭐⭐ 4 sao' },
              { id: 3, label: '⭐⭐⭐ 3 sao' },
              { id: 2, label: '⭐⭐ 2 sao' },
              { id: 1, label: '⭐ 1 sao' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStarFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  starFilter === f.id
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-[#F8FAFC] text-[#475569] hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Danh sách các review */}
          {loadingReviews ? (
            <div className="py-16 text-center text-slate-400 font-bold text-[13px]">
              Đang tải danh sách đánh giá...
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-16 bg-white rounded-3xl border border-dashed border-[#E2E8F0] text-center flex flex-col items-center justify-center p-6">
              <Star size={36} className="text-amber-300 mb-2 fill-amber-100" />
              <h3 className="text-[16px] font-black text-[#0F172A]">Chưa có đánh giá nào</h3>
              <p className="text-[12.5px] text-[#64748B] max-w-sm mt-1">
                Khi thực khách quét mã QR và gửi nhận xét đánh giá, toàn bộ ý kiến sẽ hiển thị tại đây để bạn quản lý chất lượng dịch vụ.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev, idx) => {
                const revKey = rev.id || `rev-${rev.tableId || 'tbl'}-${rev.createdAt || idx}`;
                return (
                  <div
                    key={revKey}
                    className="bg-white rounded-3xl p-5 border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-all space-y-3"
                  >
                  {/* Header: Khách & Bàn & Số sao */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[14px] text-[#0F172A]">
                          {rev.customerName || 'Khách vãng lai'}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E6F7F4] text-[#00A389] font-mono">
                          {rev.tableName}
                        </span>
                      </div>
                      {rev.customerPhone && (
                        <span className="text-[11.5px] text-[#64748B] flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-slate-400" /> {rev.customerPhone}
                        </span>
                      )}
                    </div>

                    {/* Dải sao */}
                    <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={15}
                          className={
                            s <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {/* Nội dung nhận xét */}
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 text-[13px] text-[#334155] leading-relaxed">
                    {rev.comment ? (
                      <p className="italic">&quot;{rev.comment}&quot;</p>
                    ) : (
                      <p className="text-slate-400 italic text-[12px]">Khách hàng chỉ đánh giá số sao, không để lại nhận xét bằng lời.</p>
                    )}
                  </div>

                  {/* Footer: Thời gian */}
                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-1">
                    <span>Đánh giá từ QR Menu</span>
                    <span>{formatDisplayDateTime(rev.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
