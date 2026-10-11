'use client';

import React, { useState, useEffect, use } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, CheckCircle2, Copy, ShieldCheck, Clock, Download, Printer } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../../../context/i18nContext';
import apiFetch from '../../../../lib/api';
import { fetchActiveTableSession } from '../../../../lib/api/sessions.api';
import { useSocket } from '../../../../context/SocketContext';

interface PageProps {
  params: Promise<{ tableId: string; tenantId?: string; branchId?: string }>;
}

export default function TablePaymentPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { tableId, tenantId, branchId } = resolvedParams;
  const router = useRouter();
  const { t, setLocale } = useI18n();
  const { on, off, isConnected } = useSocket();
  const basePath = tenantId && branchId ? `/${tenantId}/${branchId}/table/${tableId}` : `/table/${tableId}`;

  useEffect(() => {
    setLocale('vi');
  }, [setLocale]);

  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(890); // ~15 minutes
  const [isPaid, setIsPaid] = useState(false);

  const [restaurantName, setRestaurantName] = useState('MenuGO');
  const [restaurantAddress, setRestaurantAddress] = useState('170 Bàu Cát, Phường 14, Tân Bình, TP.HCM');
  const [footerText, setFooterText] = useState('Cảm ơn Quý khách & Hẹn gặp lại!');
  const [billPrintMode, setBillPrintMode] = useState<'THERMAL' | 'ONLINE' | 'BOTH'>('BOTH');
  const [orderItems, setOrderItems] = useState<Array<{ name: string; quantity: number; price: number }>>([]);

  // Bank Info & QR parameters từ TenantBranding (chỉ render QR khi branding thật về)
  const [bankReady, setBankReady] = useState(false);
  const [activeOrderCode, setActiveOrderCode] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    bankCode: '',
    accountNo: '',
    accountName: '',
    amount: 125000,
    memo: `MENUGO ${tableId.toUpperCase()} H-001`,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mode = (localStorage.getItem('menugo_bill_mode') as 'THERMAL' | 'ONLINE' | 'BOTH') || 'BOTH';
      setBillPrintMode(mode);

      // 1. Thử đọc từ localStorage nếu khách vừa đặt hàng trên thiết bị này
      try {
        const saved = localStorage.getItem(`menugo_order_${tableId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.orderCode) {
            setActiveOrderCode(parsed.orderCode);
          }
          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
            setOrderItems(
              parsed.items.map((i: any) => ({
                name: i.name,
                quantity: i.quantity,
                price: i.basePrice ?? i.price ?? 0,
              }))
            );
            if (parsed.totalAmount) {
              setBankInfo((prev) => ({ ...prev, amount: parsed.totalAmount }));
            }
          }
        }
      } catch {}

      // 2. Đồng thời truy vấn API Database thật để lấy dữ liệu chuẩn xác nhất của phiên bàn
      fetchActiveTableSession(tableId)
        .then((session) => {
          if (session && session.items && session.items.length > 0) {
            setOrderItems(session.items);
            setBankInfo((prev) => ({
              ...prev,
              amount: session.total,
              memo: `MENUGO ${session.sessionCode || tableId.toUpperCase()}`,
            }));
          }
        })
        .catch(() => {});
    }
  }, [tableId]);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        let effectiveBranchId = branchId || 'default-branch';
        let effectiveTenantId = tenantId;

        if (tableId.length > 20 || tableId.includes('.')) {
          const res = await apiFetch<{ branchId?: string; tenantId?: string }>(
            `/tables/resolve?token=${encodeURIComponent(tableId)}`
          );
          if (res?.data?.branchId) effectiveBranchId = res.data.branchId;
          if (res?.data?.tenantId) effectiveTenantId = res.data.tenantId;
        }

        // Scope branding theo đúng bàn QR (tableId lookup, chặn dò tenantId tùy ý)
        const params = new URLSearchParams({ tableId });
        if (effectiveBranchId && effectiveBranchId !== 'default-branch') params.set('branchId', effectiveBranchId);
        if (effectiveTenantId) params.set('tenantId', effectiveTenantId);
        const endpoint = `/branding/public?${params.toString()}`;
        const res = await apiFetch<{
          bankCode?: string;
          bankAccountNo?: string;
          bankAccountName?: string;
          footerText?: string;
          address?: string;
          restaurantName?: string;
          tenant?: { name?: string };
        }>(endpoint);
        const data = res?.data;
        if (data) {
          if (data.restaurantName || data.tenant?.name) {
            setRestaurantName(data.restaurantName || data.tenant?.name || 'MenuGO');
          }
          if (data.address) setRestaurantAddress(data.address);
          if (data.footerText) setFooterText(data.footerText);
          if (data.bankCode && data.bankAccountNo) {
            const code = data.bankCode;
            const accNo = data.bankAccountNo;
            setBankInfo((prev) => ({
              ...prev,
              bankCode: code,
              bankName: code === 'MB' ? 'Ngân hàng Quân Đội (MBBank)' : code,
              accountNo: accNo,
              accountName: data.bankAccountName || prev.accountName,
            }));
            setBankReady(true);
          }
        }
      } catch (err) {
        console.warn('Could not load branding for payment QR:', err);
        setBankReady(false);
      }
    };
    loadBranding();
  }, [tableId, branchId, tenantId]);

  // VietQR Quicklink payload
  const qrString = `https://img.vietqr.io/image/${bankInfo.bankCode}-${bankInfo.accountNo}-compact2.png?amount=${bankInfo.amount}&addInfo=${encodeURIComponent(
    bankInfo.memo
  )}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const handlePaymentCompleted = () => {
      setIsPaid(true);
    };

    on('payment:completed', handlePaymentCompleted);

    return () => {
      off('payment:completed', handlePaymentCompleted);
    };
  }, [isConnected, on, off]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (isPaid) {
    const effectiveItems =
      orderItems.length > 0
        ? orderItems
        : [
            { name: 'Đơn gọi món tại bàn', quantity: 1, price: bankInfo.amount },
          ];
    const subtotal = effectiveItems.reduce((acc, i) => acc + i.price * i.quantity, 0) || bankInfo.amount;
    const vatRate = typeof window !== 'undefined' ? Number(localStorage.getItem('app-vat-rate') || 8) : 8;
    const tax = Math.round(subtotal * (vatRate / 100));
    const grandTotal = subtotal + tax;
    const orderCode = activeOrderCode || `H-${tableId.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(-3) || '001'}`;
    const currentDate = new Date().toLocaleString('vi-VN');

    if (billPrintMode === 'THERMAL') {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1.5">{t('payment.success', 'Thanh toán thành công!')}</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Hoá đơn giấy (K80) đã được in tại quầy thu ngân. Quý khách vui lòng nhận bill từ nhân viên phục vụ.
              </p>
            </div>
            <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 text-xs font-semibold text-zinc-300">
              Bàn: <strong className="text-white">{tableId.toUpperCase()}</strong> • Tổng tiền: <strong className="text-emerald-400 font-mono">{grandTotal.toLocaleString('vi-VN')}đ</strong>
            </div>
            <Link
              href={basePath}
              className="w-full py-3 bg-[#00A389] hover:bg-[#008f77] text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm transition active:scale-98"
            >
              <span>Về trang chủ</span>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 sm:p-6 max-w-md mx-auto justify-start">
        {/* Top Success Banner */}
        <div className="no-print text-center my-3 space-y-1.5 animate-in fade-in duration-300">
          <div className="w-13 h-13 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">{t('payment.success', 'Thanh toán thành công!')}</h2>
            <p className="text-xs text-zinc-400">
              Hoá đơn điện tử online đã phát hành cho bàn {tableId.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Online Bill Paper Card (Printable) */}
        <div id="printable-bill" className="print-area bg-white text-[#0F172A] rounded-[26px] p-5 sm:p-6 shadow-2xl border border-slate-200 relative space-y-3.5 animate-in zoom-in-95 duration-200">
          {/* Con dấu Đã thanh toán */}
          <div className="absolute top-4 right-4 pointer-events-none select-none">
            <div className="px-2 py-0.5 rounded-lg border-2 border-emerald-500 text-emerald-600 font-black text-[10px] uppercase tracking-wider rotate-[-6deg] bg-emerald-50">
              ✓ ĐÃ THANH TOÁN
            </div>
          </div>

          {/* Header quán */}
          <div className="text-center space-y-0.5 pb-2.5 border-b border-dashed border-slate-300">
            <h3 className="font-black text-[16px] text-[#0F172A] uppercase tracking-tight">{restaurantName}</h3>
            <p className="text-[11px] text-[#64748B]">{restaurantAddress}</p>
            <div className="inline-block px-2 py-0.5 rounded-full bg-[#E6F7F4] text-[#00A389] text-[9.5px] font-black uppercase tracking-wider mt-1">
              Hoá đơn điện tử Online
            </div>
          </div>

          {/* Thông tin đơn */}
          <div className="text-[11.5px] space-y-0.5 pb-2.5 border-b border-dashed border-slate-300 font-mono">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Mã hoá đơn:</span>
              <strong className="text-[#0F172A]">{orderCode}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Bàn phục vụ:</span>
              <strong className="text-[#0F172A]">BÀN {tableId.toUpperCase()}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Thời gian:</span>
              <span className="text-slate-700">{currentDate}</span>
            </div>
          </div>

          {/* Danh sách món */}
          <div className="space-y-1.5 pb-2.5 border-b border-dashed border-slate-300 text-[11.5px]">
            <div className="flex justify-between text-[10.5px] font-bold text-[#64748B] uppercase pb-1 border-b border-slate-100">
              <span>Tên món</span>
              <div className="flex gap-3">
                <span className="w-5 text-center">SL</span>
                <span className="w-18 text-right">Tiền</span>
              </div>
            </div>
            {effectiveItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="font-bold text-[#0F172A] truncate max-w-[170px]">{item.name}</span>
                <div className="flex gap-3 font-mono">
                  <span className="w-5 text-center font-bold text-slate-600">{item.quantity}</span>
                  <span className="w-18 text-right font-bold text-[#0F172A]">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tổng kết tiền */}
          <div className="space-y-1 pb-2.5 border-b border-dashed border-slate-300 text-[11.5px]">
            <div className="flex justify-between text-[#64748B]">
              <span>Tạm tính:</span>
              <span className="font-mono font-bold text-slate-800">{subtotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Thuế VAT ({vatRate}%):</span>
              <span className="font-mono font-bold text-slate-800">{tax.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-[14px] font-black text-[#0F172A] pt-1">
              <span>TỔNG CỘNG:</span>
              <span className="text-[#00A389] font-mono font-black">{grandTotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#64748B] pt-0.5">
              <span>Hình thức:</span>
              <span className="font-bold text-emerald-600">VietQR (Chuyển khoản)</span>
            </div>
          </div>

          {/* Lời cảm ơn */}
          <div className="text-center text-[10.5px] text-[#64748B] pt-0.5 space-y-0.5">
            <p className="font-semibold text-slate-700">{footerText}</p>
            <p className="text-[9.5px] text-slate-400">Hệ thống gọi món thông minh HiAI - MenuGO</p>
          </div>
        </div>

        {/* Nút In / Tải về & Về trang chủ (no-print) */}
        <div className="no-print mt-4 space-y-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full py-3.5 px-4 bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#00A389]/25 transition active:scale-98 text-[13.5px] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải hoá đơn / In bill (PDF)</span>
          </button>

          <Link
            href={basePath}
            className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-2xl flex items-center justify-center gap-2 text-[12.5px] transition active:scale-98"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 sm:p-6 max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <Link
          href={`${basePath}/order-status`}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back', 'Quay lại đơn')}</span>
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
          {t('table.table', 'Bàn')} {tableId.toUpperCase()}
        </span>
      </div>

      {/* Main Payment Container */}
      <div className="my-5 flex-1 flex flex-col items-center justify-center space-y-4">
        {/* Timer */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {t('common.status', 'Hết hạn sau')}: <strong>{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</strong>
          </span>
        </div>

        {!bankReady ? (
          <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300 text-center">
            {t('bank.notConfiguredNotice', 'Quán chưa cấu hình tài khoản ngân hàng. Vui lòng thanh toán tiền mặt tại quầy.')}
          </div>
        ) : (
        <>
        {/* Dynamic VietQR Display Card */}
        <div className="bg-white p-5 rounded-3xl shadow-2xl flex flex-col items-center border-4 border-amber-500/40">
          <QRCodeSVG value={qrString} size={220} level="H" includeMargin />
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-600 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>VietQR Chuẩn NAPAS 247</span>
          </div>
        </div>

        <p className="text-xs text-zinc-400 text-center max-w-xs">
          {t('pos.scanToPay', 'Mở ứng dụng Ngân hàng bất kỳ hoặc Ví điện tử để quét mã thanh toán tự động')}
        </p>
        </>
        )}

        {bankReady && (
        <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
            <span className="text-zinc-400">{t('bank.bankName', 'Ngân hàng')}</span>
            <span className="font-semibold text-zinc-200">{bankInfo.bankName}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
            <span className="text-zinc-400">{t('bank.accountNo', 'Số tài khoản')}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-400">{bankInfo.accountNo}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(bankInfo.accountNo)}
                className="text-zinc-400 hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
            <span className="text-zinc-400">{t('bank.accountName', 'Chủ tài khoản')}</span>
            <span className="font-semibold text-zinc-200">{bankInfo.accountName}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
            <span className="text-zinc-400">{t('common.price', 'Số tiền')}</span>
            <span className="font-bold text-amber-400 text-sm">
              {bankInfo.amount.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-zinc-400">{t('bank.memo', 'Nội dung chuyển')}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-emerald-400">{bankInfo.memo}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(bankInfo.memo)}
                className="text-zinc-400 hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        )}

        {copied && (
          <div className="text-xs text-emerald-400 font-medium animate-in fade-in">
            ✓ {t('common.success', 'Đã sao chép vào bộ nhớ tạm!')}
          </div>
        )}
      </div>

      {/* Manual Test Complete Button for Demo */}
      <button
        type="button"
        onClick={async () => {
          try {
            await apiFetch(`/sessions/${encodeURIComponent(tableId)}/demo-pay`, {
              method: 'POST',
            });
          } catch (err) {
            console.warn('[TablePaymentPage] Demo settle failed:', err);
          }
          setIsPaid(true);
        }}
        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition cursor-pointer"
      >
        Mô phỏng: Đã nhận tiền thành công (Demo)
      </button>
    </div>
  );
}
