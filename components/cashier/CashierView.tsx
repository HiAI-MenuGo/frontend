'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  QrCode,
  Clock,
  User,
  CheckCircle2,
  Receipt,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  X,
  Printer,
  AlertCircle,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { formatVND } from '@/lib/format';
import { fetchPendingPayments, payCash, createVietQR, type VietQRResult } from '@/lib/api/sessions.api';
import type { PendingSessionDTO } from '@/lib/api/types';
import { getSocket } from '@/lib/socket';
import { BillPrintModal } from '@/components/payment/BillPrintModal';
import { useHeaderStore } from '@/stores/header.store';
import { useBranchStore } from '@/stores/branch.store';

export interface PendingBill {
  sessionId: string;
  tableId: string;
  tableName: string;
  total: number;
  count: number;
  time: string;
  staff: string;
  createdAt: string;
  branchId?: string;
  branchName?: string;
  branchCode?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    note?: string;
  }>;
}

interface CashierTopBarActionsProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterType: 'ALL' | 'LONG_WAIT';
  setFilterType: (val: 'ALL' | 'LONG_WAIT') => void;
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  totalCount: number;
  urgentCount: number;
}

function CashierTopBarActions({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  soundEnabled,
  setSoundEnabled,
  totalCount,
  urgentCount,
}: CashierTopBarActionsProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      {/* Search Input */}
      <div className="relative w-36 sm:w-52 md:w-64">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm bàn, món, thu ngân..."
          className="w-full h-10 pl-9 pr-7 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#00A389] focus:bg-white transition-all font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
            aria-label="Xoá tìm kiếm"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setFilterType('ALL')}
          className={`h-10 px-3 sm:px-3.5 rounded-2xl text-[12px] font-bold transition-all whitespace-nowrap ${
            filterType === 'ALL'
              ? 'bg-[#7C3AED] text-white shadow-xs shadow-purple-600/20'
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Tất cả ({totalCount})
        </button>
        <button
          onClick={() => setFilterType('LONG_WAIT')}
          className={`h-10 px-3 sm:px-3.5 rounded-2xl text-[12px] font-bold transition-all whitespace-nowrap ${
            filterType === 'LONG_WAIT'
              ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Chờ lâu (&gt;20p){urgentCount > 0 ? ` (${urgentCount})` : ''}
        </button>
      </div>

      {/* Sound Bell Toggle */}
      <button
        onClick={() => setSoundEnabled((prev) => !prev)}
        className={`h-10 px-3 rounded-2xl border flex items-center gap-1.5 text-[12px] font-bold transition-all shrink-0 ${
          soundEnabled
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            : 'bg-white border-[#E2E8F0] text-[#94A3B8] hover:text-[#0F172A]'
        }`}
        title={soundEnabled ? 'Tắt âm thanh chuông báo' : 'Bật âm thanh chuông báo'}
      >
        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        <span className="hidden md:inline">{soundEnabled ? 'Chuông: Bật' : 'Chuông: Tắt'}</span>
      </button>
    </div>
  );
}

export default function CashierView() {
  const [bills, setBills] = useState<PendingBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal xem chi tiết đơn để thanh toán
  const [checkoutModalBill, setCheckoutModalBill] = useState<PendingBill | null>(null);

  // Tìm kiếm & Lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'LONG_WAIT'>('ALL');

  // Thống kê ca làm việc cục bộ
  const [settledCountToday, setSettledCountToday] = useState(0);
  const [settledAmountToday, setSettledAmountToday] = useState(0);

  // Âm thanh thông báo
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Toast thông báo
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error'; text: string; details?: string } | null>(null);

  // Modal Tiền Mặt
  const [cashModalBill, setCashModalBill] = useState<PendingBill | null>(null);
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [cashLoading, setCashLoading] = useState(false);

  // Modal VietQR
  const [qrModalBill, setQrModalBill] = useState<PendingBill | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(60);
  const [qrManualVerifying, setQrManualVerifying] = useState(false);

  // Modal In Hoá Đơn
  const [printModalBill, setPrintModalBill] = useState<PendingBill | null>(null);
  const [printPaymentMethod, setPrintPaymentMethod] = useState<'cash' | 'scan'>('cash');

  // Mốc thời gian tham chiếu tính toán chờ lâu (tránh Date.now() trong render)
  const [referenceTime, setReferenceTime] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setReferenceTime(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Âm thanh chuông báo Web Audio API (thành công / đơn mới)
  const playPaymentChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.35); // D6

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start(ctx.currentTime + 0.15);
      osc1.stop(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 0.45);
      setTimeout(() => ctx.close(), 600);
    } catch {
      // Bỏ qua nếu bị trình duyệt chặn
    }
  }, [soundEnabled]);

  const showToast = useCallback((type: 'success' | 'info' | 'error', text: string, details?: string) => {
    setToast({ type, text, details });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  // Tải danh sách đơn chờ thanh toán
  const loadBills = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data: PendingSessionDTO[] = await fetchPendingPayments(selectedBranchId === 'ALL' ? 'ALL' : selectedBranchId);
      const formatted: PendingBill[] = data.map((d) => ({
        sessionId: d.sessionId,
        tableId: d.tableId,
        tableName: d.tableName || d.tableId || 'Bàn không tên',
        total: d.total,
        count: d.items ? d.items.length : 1,
        time: new Date(d.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        staff: d.customerName || 'Nhân viên',
        createdAt: d.createdAt,
        branchId: d.branchId,
        branchName: d.branchName,
        branchCode: d.branchCode,
        items: d.items || [],
      }));

      setBills(formatted);
      setCheckoutModalBill((prev) => {
        if (!prev) return null;
        return formatted.find((b) => b.sessionId === prev.sessionId) || null;
      });
    } catch (err: unknown) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Không tải được danh sách thanh toán');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  // Lắng nghe sự kiện Socket.IO Realtime
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
    } catch {
      return;
    }

    const onPaymentCompleted = (payload: { sessionId: string; amount: number; tableName?: string; method?: string }) => {
      playPaymentChime();
      setBills((prev) => prev.filter((b) => b.sessionId !== payload.sessionId));
      setSettledCountToday((prev) => prev + 1);
      setSettledAmountToday((prev) => prev + (payload.amount || 0));

      if (checkoutModalBill && checkoutModalBill.sessionId === payload.sessionId) {
        setCheckoutModalBill(null);
      }
      if (qrModalBill && qrModalBill.sessionId === payload.sessionId) {
        setQrModalBill(null);
      }
      if (cashModalBill && cashModalBill.sessionId === payload.sessionId) {
        setCashModalBill(null);
      }

      showToast(
        'success',
        `Thanh toán thành công ${payload.tableName || 'Bàn'}!`,
        `Đã thu: ${formatVND(payload.amount || 0)} qua ${payload.method === 'VIETQR' ? 'VietQR' : 'tiền mặt'}`
      );
    };

    const onSessionUpdated = () => {
      loadBills(true);
    };

    const onTableStatusChanged = () => {
      loadBills(true);
    };

    socket.on('payment:completed', onPaymentCompleted);
    socket.on('session:updated', onSessionUpdated);
    socket.on('session:created', onSessionUpdated);
    socket.on('order:new', onSessionUpdated);
    socket.on('table:status_changed', onTableStatusChanged);

    return () => {
      socket.off('payment:completed', onPaymentCompleted);
      socket.off('session:updated', onSessionUpdated);
      socket.off('session:created', onSessionUpdated);
      socket.off('order:new', onSessionUpdated);
      socket.off('table:status_changed', onTableStatusChanged);
    };
  }, [loadBills, playPaymentChime, qrModalBill, cashModalBill, checkoutModalBill, showToast]);

  // Bộ đếm ngược VietQR Modal (60s)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (qrModalBill && qrCountdown > 0) {
      timer = setInterval(() => {
        setQrCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [qrModalBill, qrCountdown]);

  // Thao tác mở Modal Tiền mặt
  const handleOpenCashModal = (bill: PendingBill) => {
    setCashModalBill(bill);
    setCashReceivedInput(bill.total.toString());
  };

  // Xác nhận thu tiền mặt
  const handleConfirmCashPayment = async () => {
    if (!cashModalBill) return;
    const received = Number(cashReceivedInput.replace(/\D/g, '')) || 0;
    if (received < cashModalBill.total) {
      showToast('error', 'Số tiền khách đưa chưa đủ!', `Cần tối thiểu ${formatVND(cashModalBill.total)}`);
      return;
    }

    try {
      setCashLoading(true);
      const res = await payCash(cashModalBill.sessionId, received, 'default-branch', 'CASH');

      playPaymentChime();
      setBills((prev) => prev.filter((b) => b.sessionId !== cashModalBill.sessionId));
      setSettledCountToday((prev) => prev + 1);
      setSettledAmountToday((prev) => prev + cashModalBill.total);

      const targetBillForPrint = cashModalBill;
      setCashModalBill(null);

      showToast(
        'success',
        `Thu tiền ${targetBillForPrint.tableName} thành công!`,
        `Khách đưa: ${formatVND(received)} • Tiền thối: ${formatVND(res.change)} • +${res.pointsEarned} điểm tích luỹ`
      );

      const billMode = typeof window !== 'undefined' ? localStorage.getItem('menugo_bill_mode') || 'BOTH' : 'BOTH';
      if (billMode === 'THERMAL' || billMode === 'BOTH') {
        setPrintPaymentMethod('cash');
        setPrintModalBill(targetBillForPrint);
      } else {
        showToast('info', 'Hoá đơn điện tử', `Đã phát hành bill online cho khách tại ${targetBillForPrint.tableName}`);
      }
    } catch (err: unknown) {
      showToast('error', 'Lỗi thanh toán', err instanceof Error ? err.message : 'Không thể hoàn tất thanh toán');
    } finally {
      setCashLoading(false);
    }
  };

  // Thao tác mở Modal VietQR
  const handleOpenVietQR = async (bill: PendingBill) => {
    setQrModalBill(bill);
    setQrCountdown(60);
    setQrLoading(true);
    setQrUrl(null);
    try {
      const res: VietQRResult = await createVietQR(bill.sessionId, bill.total);
      const url = (res.qrImageUrl || res.imageUrl || res.qrData || null) as string | null;
      if (url) {
        setQrUrl(url);
      } else {
        setQrUrl(
          `https://img.vietqr.io/image/970422-0334888999-compact2.png?amount=${bill.total}&addInfo=${encodeURIComponent(
            `${bill.tableName} TT`
          )}&accountName=MenuGO`
        );
      }
    } catch {
      setQrUrl(
        `https://img.vietqr.io/image/970422-0334888999-compact2.png?amount=${bill.total}&addInfo=${encodeURIComponent(
          `${bill.tableName} TT`
        )}&accountName=MenuGO`
      );
    } finally {
      setQrLoading(false);
    }
  };

  // Xác nhận đã nhận tiền VietQR thủ công
  const handleConfirmManualQR = async () => {
    if (!qrModalBill) return;
    try {
      setQrManualVerifying(true);
      await payCash(qrModalBill.sessionId, qrModalBill.total, 'default-branch', 'VIETQR');
      playPaymentChime();
      setBills((prev) => prev.filter((b) => b.sessionId !== qrModalBill.sessionId));
      setSettledCountToday((prev) => prev + 1);
      setSettledAmountToday((prev) => prev + qrModalBill.total);

      const savedBill = qrModalBill;
      setQrModalBill(null);

      showToast('success', `Đã xác nhận thanh toán QR cho ${savedBill.tableName}!`, `Đã thu: ${formatVND(savedBill.total)}`);
      const billMode = typeof window !== 'undefined' ? localStorage.getItem('menugo_bill_mode') || 'BOTH' : 'BOTH';
      if (billMode === 'THERMAL' || billMode === 'BOTH') {
        setPrintPaymentMethod('scan');
        setPrintModalBill(savedBill);
      } else {
        showToast('info', 'Hoá đơn điện tử', `Đã phát hành bill online cho khách tại ${savedBill.tableName}`);
      }
    } catch (err: unknown) {
      showToast('error', 'Lỗi xác nhận', err instanceof Error ? err.message : 'Không thể xác nhận thanh toán');
    } finally {
      setQrManualVerifying(false);
    }
  };

  // Lọc và tìm kiếm danh sách bàn
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Tìm kiếm theo tên bàn, món, khách
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTable = b.tableName.toLowerCase().includes(q);
        const matchStaff = b.staff.toLowerCase().includes(q);
        const matchItem = b.items.some((it) => it.name.toLowerCase().includes(q));
        if (!matchTable && !matchStaff && !matchItem) return false;
      }

      // Lọc theo thời gian chờ > 20 phút
      if (filterType === 'LONG_WAIT' && referenceTime > 0) {
        const diffMinutes = (referenceTime - new Date(b.createdAt).getTime()) / 60000;
        if (diffMinutes < 20) return false;
      }

      return true;
    });
  }, [bills, searchQuery, filterType, referenceTime]);

  // Đếm số bàn chờ lâu > 20p
  const urgentCount = useMemo(() => {
    if (!referenceTime) return 0;
    return bills.filter((b) => {
      const diffMinutes = (referenceTime - new Date(b.createdAt).getTime()) / 60000;
      return diffMinutes >= 20;
    }).length;
  }, [bills, referenceTime]);

  const totalPendingAmount = useMemo(() => bills.reduce((sum, b) => sum + b.total, 0), [bills]);

  // Đưa thanh tìm kiếm, bộ lọc và nút chuông lên Topbar
  const setCustomAction = useHeaderStore((s) => s.setCustomAction);

  useEffect(() => {
    setCustomAction(
      <CashierTopBarActions
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        totalCount={bills.length}
        urgentCount={urgentCount}
      />
    );
    return () => setCustomAction(null);
  }, [setCustomAction, searchQuery, filterType, soundEnabled, bills.length, urgentCount]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBills();
  }, [loadBills]);

  // Phụ trợ tính toán số tiền khách đưa & tiền thối
  const numericCashReceived = Number(cashReceivedInput.replace(/\D/g, '')) || 0;
  const cashChange = Math.max(0, numericCashReceived - (cashModalBill?.total || 0));
  const isCashSufficient = numericCashReceived >= (cashModalBill?.total || 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
      {/* Toast thông báo nổi */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border ${
              toast.type === 'success'
                ? 'bg-white border-[#00A389]/30 text-[#0F172A]'
                : toast.type === 'error'
                ? 'bg-white border-rose-200 text-[#0F172A]'
                : 'bg-white border-blue-200 text-[#0F172A]'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#00A389] shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Receipt className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />}
            <div className="text-left pr-2">
              <p className="text-[13px] font-bold">{toast.text}</p>
              {toast.details && <p className="text-[11.5px] text-[#64748B] mt-0.5">{toast.details}</p>}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg"
              aria-label="Đóng thông báo"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Thanh Thống Kê 3 Thẻ Metric (3 Divs) */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-4 shrink-0 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full items-stretch">
          {/* Div 1: Tổng tiền chờ thu */}
          <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-xs">
            <div>
              <p className="text-[11px] sm:text-[11.5px] font-black uppercase tracking-wider text-purple-700">TỔNG TIỀN CHỜ THU</p>
              <p className="text-[22px] 2xl:text-[24px] font-black text-purple-800 mt-0.5 tracking-tight">
                {formatVND(totalPendingAmount)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <Banknote size={22} />
            </div>
          </div>

          {/* Div 2: Bàn chờ tính tiền */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-xs">
            <div>
              <p className="text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider text-[#64748B]">BÀN CHỜ TÍNH TIỀN</p>
              <p className="text-[22px] 2xl:text-[24px] font-black text-[#0F172A] mt-0.5 tracking-tight">
                {bills.length} <span className="text-[13px] font-medium text-[#64748B]">hoá đơn</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#F1F5F9] flex items-center justify-center text-[#475569] shrink-0">
              <Receipt size={22} />
            </div>
          </div>

          {/* Div 3: Đã thu ca này */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-xs">
            <div>
              <p className="text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">ĐÃ THU CA NÀY</p>
              <p className="text-[20px] 2xl:text-[22px] font-black text-emerald-800 mt-0.5 tracking-tight">
                {settledAmountToday > 0 ? formatVND(settledAmountToday) : '0 ₫'}{' '}
                <span className="text-[12px] font-semibold text-emerald-700">({settledCountToday} đơn)</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Bills Grid (Chiếm toàn bộ độ rộng, không còn panel bên phải) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#00A389] animate-spin" />
            <p className="text-[13px] font-bold text-[#64748B]">Đang tải danh sách chờ thanh toán...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3 max-w-md mx-auto mt-6">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-[14px] font-extrabold text-[#0F172A]">{error}</p>
            <button
              onClick={() => loadBills(false)}
              className="px-4 py-2 bg-[#00A389] text-white rounded-xl text-[12px] font-bold inline-flex items-center gap-2"
            >
              <RefreshCw size={14} /> Thử lại
            </button>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-[#CBD5E1] max-w-lg mx-auto mt-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-[18px] font-black text-[#0F172A]">Tất cả đã thanh toán xong!</h3>
            <p className="text-[13px] text-[#64748B] mt-1.5 max-w-xs mx-auto">
              Hiện tại không có bàn nào đang chờ xuất bill hoặc khớp bộ lọc tìm kiếm.
            </p>
            <button
              onClick={() => loadBills(false)}
              className="mt-5 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-[12px] font-bold inline-flex items-center gap-2 transition-all"
            >
              <RefreshCw size={14} /> Kiểm tra lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 sm:gap-5">
            {filteredBills.map((bill) => (
              <div
                key={bill.sessionId}
                onClick={() => setCheckoutModalBill(bill)}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] hover:border-purple-300 hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between group active:scale-[0.99]"
              >
                {/* Header Card */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <h4 className="text-[18px] font-black text-[#0F172A] tracking-tight truncate group-hover:text-purple-700 transition-colors">
                        {bill.tableName}
                      </h4>
                      {bill.branchName && (
                        <span className="px-2 py-0.5 rounded-md text-[10.5px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1 shrink-0">
                          <Building2 size={11} />
                          <span>{bill.branchName}</span>
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border bg-purple-50 text-purple-700 border-purple-200 shrink-0">
                        Chờ tính tiền
                      </span>
                    </div>
                    <span className="text-[18px] font-black text-emerald-600 tracking-tight shrink-0">
                      {formatVND(bill.total)}
                    </span>
                  </div>

                  {/* Sub-meta: Giờ vào, nhân viên, số món */}
                  <div className="flex items-center flex-wrap gap-2 text-[12px] text-[#64748B] mb-3">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Clock size={12} className="text-[#94A3B8]" />
                      Vào lúc {bill.time}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <User size={12} className="text-[#94A3B8]" />
                      {bill.staff}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-[#0F172A]">{bill.count} món</span>
                  </div>

                  {/* Item Preview List (tối đa 3 món) */}
                  <div className="bg-[#F8FAFC] rounded-2xl p-3 border border-[#F1F5F9] space-y-1.5 mb-4 group-hover:bg-purple-50/20 transition-colors">
                    {bill.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[12px]">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-md bg-white border border-[#E2E8F0] text-[11px] font-bold text-[#0F172A] flex items-center justify-center shrink-0">
                            {item.quantity}x
                          </span>
                          <span className="truncate text-[#334155] font-medium">{item.name}</span>
                          {item.note && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                              {item.note}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-[#0F172A] shrink-0 text-right">
                          {formatVND(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    {bill.items.length > 3 && (
                      <p className="text-[11px] text-[#94A3B8] text-center pt-1 font-semibold">
                        + thêm {bill.items.length - 3} món khác
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Checkout Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#F1F5F9]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCashModal(bill);
                    }}
                    className="flex-1 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-[12.5px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    title="Thanh toán tiền mặt ngay"
                  >
                    <Banknote size={15} />
                    <span>Tiền mặt</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenVietQR(bill);
                    }}
                    className="flex-1 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-[12.5px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    title="Quét VietQR ngay"
                  >
                    <QrCode size={15} />
                    <span>VietQR</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrintPaymentMethod('cash');
                      setPrintModalBill(bill);
                    }}
                    className="w-10 h-10 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-all shrink-0"
                    title="In phiếu tạm tính"
                  >
                    <Printer size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL CHI TIẾT THANH TOÁN (Hiện ra khi bấm vào bất kỳ đơn nào) */}
      {/* ========================================================== */}
      {checkoutModalBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E2E8F0] relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#F1F5F9]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    CHI TIẾT THANH TOÁN
                  </span>
                  <span className="text-[11px] font-bold text-[#64748B]">
                    • {checkoutModalBill.count} món
                  </span>
                </div>
                <h3 className="text-[22px] font-black text-[#0F172A] tracking-tight">
                  {checkoutModalBill.tableName}
                </h3>
                <div className="flex items-center gap-3 text-[12px] text-[#64748B] mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} className="text-[#94A3B8]" /> Vào lúc {checkoutModalBill.time}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <User size={13} className="text-[#94A3B8]" /> {checkoutModalBill.staff}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setCheckoutModalBill(null)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-2 rounded-2xl hover:bg-[#F8FAFC] transition-colors"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* Danh sách món chi tiết cuộn được */}
            <div className="my-4 flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
                Món đã gọi ({checkoutModalBill.items.length})
              </p>
              {checkoutModalBill.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#F1F5F9] flex items-center justify-between text-[13px]"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#00A389] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[12px]">
                        {item.quantity}x
                      </span>
                      <span className="font-bold text-[#0F172A] truncate">{item.name}</span>
                    </div>
                    {item.note && (
                      <p className="text-[11.5px] text-amber-700 italic mt-1 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                        Ghi chú: {item.note}
                      </p>
                    )}
                    <p className="text-[11.5px] text-[#94A3B8] mt-0.5">
                      Đơn giá: {formatVND(item.price)}
                    </p>
                  </div>
                  <span className="font-black text-[#0F172A] shrink-0 text-[14px]">
                    {formatVND(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Tổng kết tiền */}
            <div className="space-y-2 py-3 border-t border-[#F1F5F9] text-[13px]">
              <div className="flex justify-between text-[#64748B]">
                <span>Tạm tính tiền món:</span>
                <span className="font-bold text-[#0F172A]">{formatVND(checkoutModalBill.total)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Thuế VAT (0%):</span>
                <span className="font-bold text-[#0F172A]">0 ₫</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-[#CBD5E1]">
                <span className="text-[15px] font-black text-[#0F172A]">TỔNG CỘNG:</span>
                <span className="text-[24px] font-black text-emerald-600 tracking-tight">
                  {formatVND(checkoutModalBill.total)}
                </span>
              </div>
            </div>

            {/* Nút hành động thanh toán */}
            <div className="space-y-2.5 pt-3 border-t border-[#F1F5F9]">
              <button
                onClick={() => {
                  const bill = checkoutModalBill;
                  setCheckoutModalBill(null);
                  handleOpenCashModal(bill);
                }}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[14px] flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99]"
              >
                <Banknote size={18} />
                <span>Thu Tiền Mặt ({formatVND(checkoutModalBill.total)})</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const bill = checkoutModalBill;
                    setCheckoutModalBill(null);
                    handleOpenVietQR(bill);
                  }}
                  className="flex-1 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-xs shadow-blue-600/20 transition-all active:scale-[0.99]"
                >
                  <QrCode size={16} />
                  <span>Quét VietQR</span>
                </button>

                <button
                  onClick={() => {
                    const bill = checkoutModalBill;
                    setPrintPaymentMethod('cash');
                    setPrintModalBill(bill);
                  }}
                  className="h-11 px-5 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-extrabold text-[13px] flex items-center justify-center gap-1.5 transition-all"
                >
                  <Printer size={16} />
                  <span>In Phiếu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 1: THU TIỀN MẶT & TÍNH TIỀN THỐI (Desk Cashier Drawer) */}
      {/* ========================================================== */}
      {cashModalBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] relative">
            <button
              onClick={() => setCashModalBill(null)}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-[#F8FAFC]"
            >
              <X size={18} />
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Banknote size={20} />
              </div>
              <div>
                <h3 className="text-[18px] font-black text-[#0F172A]">Thu Tiền Mặt</h3>
                <p className="text-[12px] text-[#64748B]">{cashModalBill.tableName} • {cashModalBill.count} món</p>
              </div>
            </div>

            {/* Khung số tiền cần thanh toán */}
            <div className="my-4 p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700">SỐ TIỀN PHẢI THU</span>
                <p className="text-[24px] font-black text-purple-900 tracking-tight">{formatVND(cashModalBill.total)}</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-white border border-purple-200 text-[11px] font-black text-purple-700">
                +{Math.floor(cashModalBill.total / 10000)} điểm thưởng
              </div>
            </div>

            {/* Ô nhập tiền khách đưa */}
            <div className="mb-4">
              <label className="block text-[12px] font-extrabold text-[#334155] mb-1.5">
                Tiền khách đưa (VNĐ)
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={
                    cashReceivedInput
                      ? Number(cashReceivedInput.replace(/\D/g, '')).toLocaleString('vi-VN')
                      : ''
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setCashReceivedInput(raw);
                  }}
                  placeholder="Nhập số tiền..."
                  className="w-full h-12 px-4 rounded-2xl bg-[#F8FAFC] border-2 border-[#CBD5E1] text-[20px] font-black text-[#0F172A] focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-right pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-[#64748B]">₫</span>
              </div>
            </div>

            {/* Các nút bấm chọn nhanh mệnh giá */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B]">Chọn nhanh mệnh giá:</span>
                <button
                  type="button"
                  onClick={() => setCashReceivedInput(cashModalBill.total.toString())}
                  className="text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  Đúng {formatVND(cashModalBill.total)}
                </button>
              </div>

              {/* Hàng 1: Nút cộng thêm tiền */}
              <div className="grid grid-cols-4 gap-2">
                {[10000, 20000, 50000, 100000].map((add) => (
                  <button
                    key={add}
                    type="button"
                    onClick={() => {
                      const cur = Number(cashReceivedInput.replace(/\D/g, '')) || cashModalBill.total;
                      setCashReceivedInput((cur + add).toString());
                    }}
                    className="h-8 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[11.5px] font-bold text-[#334155] transition-all"
                  >
                    +{add / 1000}k
                  </button>
                ))}
              </div>

              {/* Hàng 2: Tờ tiền tròn chuẩn */}
              <div className="grid grid-cols-4 gap-2">
                {[50000, 100000, 200000, 500000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setCashReceivedInput(amount.toString())}
                    className="h-8 rounded-xl bg-white border border-[#CBD5E1] hover:border-emerald-500 hover:text-emerald-700 text-[11.5px] font-bold text-[#0F172A] transition-all"
                  >
                    {amount / 1000}k
                  </button>
                ))}
              </div>
            </div>

            {/* Hiển thị tiền thối lại cho khách */}
            <div
              className={`p-3.5 rounded-2xl border mb-5 transition-all ${
                isCashSufficient
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold">
                  {isCashSufficient ? 'Tiền thối lại cho khách:' : 'Khách đưa còn thiếu:'}
                </span>
                <span className="text-[18px] font-black">
                  {isCashSufficient
                    ? formatVND(cashChange)
                    : formatVND(cashModalBill.total - numericCashReceived)}
                </span>
              </div>
            </div>

            {/* Nút xác nhận thu tiền */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCashModalBill(null)}
                className="flex-1 h-11 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] font-bold text-[#64748B] hover:text-[#0F172A]"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmCashPayment}
                disabled={cashLoading || !isCashSufficient}
                className="flex-2 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[13.5px] flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20"
              >
                {cashLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Xác Nhận & Đóng Bàn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 2: VIETQR ĐỘNG NAPAS 247 (Tự động nhận diện qua Socket) */}
      {/* ========================================================== */}
      {qrModalBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] relative text-center">
            <button
              onClick={() => setQrModalBill(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-[#F8FAFC]"
            >
              <X size={18} />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-extrabold uppercase mb-2 border border-blue-200">
              <QrCode size={13} />
              <span>VietQR NAPAS 247</span>
            </div>

            <h3 className="text-[18px] font-black text-[#0F172A]">{qrModalBill.tableName}</h3>
            <p className="text-[12px] text-[#64748B]">Quét bằng ứng dụng ngân hàng hoặc ví điện tử bất kỳ</p>

            {/* Khung ảnh QR Code */}
            <div className="my-4 p-4 bg-white rounded-2xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center min-h-[220px]">
              {qrLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-[12px] font-bold text-[#64748B] mt-2">Đang tạo mã VietQR động...</p>
                </div>
              ) : qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="VietQR"
                  className="w-56 h-auto object-contain rounded-xl shadow-xs"
                />
              ) : (
                <QrCode size={160} className="text-[#0F172A]" />
              )}
              <p className="text-[20px] font-black text-blue-700 mt-3">{formatVND(qrModalBill.total)}</p>
              <p className="text-[11px] text-[#64748B] font-semibold">Tự động hoàn tất khi tài khoản nhận tiền</p>
            </div>

            {/* Đếm ngược hiệu lực */}
            <div className="flex items-center justify-between bg-blue-50 px-3.5 py-2.5 rounded-xl border border-blue-200 mb-4 text-[12px]">
              <div className="flex items-center gap-1.5 font-bold text-blue-700">
                <Clock size={14} />
                <span>Thời gian hiệu lực:</span>
              </div>
              <span className={`font-black ${qrCountdown <= 10 ? 'text-rose-600 animate-pulse' : 'text-blue-700'}`}>
                {qrCountdown}s
              </span>
            </div>

            {/* Nút xác nhận thủ công */}
            <button
              onClick={handleConfirmManualQR}
              disabled={qrManualVerifying}
              className="w-full h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-xs shadow-blue-600/20 disabled:opacity-50 transition-all"
            >
              {qrManualVerifying ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Đang xác nhận...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Xác Nhận Đã Nhận Tiền Thủ Công</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 3: IN HOÁ ĐƠN (Sử dụng BillPrintModal chung) */}
      {/* ========================================================== */}
      {printModalBill && (
        <BillPrintModal
          isOpen={!!printModalBill}
          onClose={() => setPrintModalBill(null)}
          tableNumber={printModalBill.tableName}
          orderNumber={`HD-${printModalBill.sessionId.slice(-4).toUpperCase()}`}
          items={printModalBill.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          }))}
          subtotal={printModalBill.total}
          tax={0}
          total={printModalBill.total}
          paymentMethod={printPaymentMethod}
          storeName="MenuGO"
        />
      )}
    </div>
  );
}
