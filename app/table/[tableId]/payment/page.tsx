'use client';

import React, { useState, useEffect, use } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getSocket } from '../../../../lib/socket';
import { ArrowLeft, CheckCircle2, Copy, ShieldCheck, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../../../context/i18nContext';
import apiFetch from '../../../../lib/api';

interface PageProps {
  params: Promise<{ tableId: string }>;
}

export default function TablePaymentPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const tableId = resolvedParams.tableId;
  const router = useRouter();
  const { t } = useI18n();

  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(890); // ~15 minutes
  const [isPaid, setIsPaid] = useState(false);

  // Bank Info & QR parameters từ TenantBranding (chỉ render QR khi branding thật về)
  const [bankReady, setBankReady] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    bankCode: '',
    accountNo: '',
    accountName: '',
    amount: 125000,
    memo: `MENUGO ${tableId.toUpperCase()} 101`,
  });

  useEffect(() => {
    const loadBranding = async () => {
      try {
        let branchId = 'default-branch';
        let tenantId: string | undefined;

        if (tableId.length > 20 || tableId.includes('.')) {
          const res = await apiFetch<any>(`/tables/resolve?token=${encodeURIComponent(tableId)}`);
          if (res?.data?.branchId) branchId = res.data.branchId;
          if (res?.data?.tenantId) tenantId = res.data.tenantId;
        }

        const endpoint = tenantId ? `/branding/${tenantId}` : `/branding/public?branchId=${branchId}`;
        const res = await apiFetch<any>(endpoint);
        const data = res?.data;
        if (data?.bankCode && data?.bankAccountNo) {
          setBankInfo((prev) => ({
            ...prev,
            bankCode: data.bankCode,
            bankName: data.bankCode === 'MB' ? 'Ngân hàng Quân Đội (MBBank)' : data.bankCode,
            accountNo: data.bankAccountNo,
            accountName: data.bankAccountName || prev.accountName,
          }));
          setBankReady(true);
        }
      } catch (err) {
        console.warn('Could not load branding for payment QR:', err);
        setBankReady(false);
      }
    };
    loadBranding();
  }, [tableId]);

  // VietQR Quicklink payload
  const qrString = `https://img.vietqr.io/image/${bankInfo.bankCode}-${bankInfo.accountNo}-compact2.png?amount=${bankInfo.amount}&addInfo=${encodeURIComponent(
    bankInfo.memo
  )}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const socket = getSocket();

    const handlePaymentCompleted = () => {
      setIsPaid(true);
      setTimeout(() => {
        router.push(`/receipt/SES-DEMO-${tableId.toUpperCase()}`);
      }, 1500);
    };

    socket.on('payment:completed', handlePaymentCompleted);

    return () => {
      clearInterval(timer);
      socket.off('payment:completed', handlePaymentCompleted);
    };
  }, [tableId, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (isPaid) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('payment.success', 'Thanh toán thành công!')}
        </h2>
        <p className="text-sm text-zinc-400">{t('common.loading', 'Đang chuyển tới hóa đơn điện tử...')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 sm:p-6 max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <Link
          href={`/table/${tableId}/order-status`}
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
            <span className="text-zinc-400">{t('menu.note', 'Nội dung chuyển')}</span>
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
        onClick={() => {
          setIsPaid(true);
          setTimeout(() => {
            router.push(`/receipt/SES-DEMO-${tableId.toUpperCase()}`);
          }, 1200);
        }}
        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition"
      >
        Mô phỏng: Đã nhận tiền thành công (Demo)
      </button>
    </div>
  );
}
