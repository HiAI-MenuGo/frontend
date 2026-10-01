'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Save, ShieldCheck, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import apiFetch from '../../../../lib/api';
import { useI18n } from '../../../../context/i18nContext';

interface BrandingBankData {
  bankCode?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
}

export default function AdminBankSettingsPage() {
  const { t } = useI18n();
  const [bankCode, setBankCode] = useState('MB');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchBankInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<BrandingBankData>('/branding');
      if (res.success && res.data) {
        if (res.data.bankCode) setBankCode(res.data.bankCode);
        if (res.data.bankAccountNo) {
          setAccountNo(res.data.bankAccountNo);
          setIsConfigured(true);
        }
        if (res.data.bankAccountName) setAccountName(res.data.bankAccountName);
      } else if (res.errorCode !== 'NETWORK_ERROR') {
        setError(res.message || t('bank.errorLoading', 'Không thể tải cấu hình ngân hàng'));
      }
    } catch {
      setError(t('errors.network', 'Lỗi kết nối khi tải cấu hình ngân hàng'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBankInfo();
  }, [fetchBankInfo]);

  const handleSave = async () => {
    setIsSaving(true);
    setActionError(null);
    try {
      const res = await apiFetch('/branding', {
        method: 'PUT',
        body: JSON.stringify({
          bankCode,
          bankAccountNo: accountNo.trim(),
          bankAccountName: accountName.trim().toUpperCase(),
        }),
      });

      if (res.success) {
        setMessage(t('bank.saveSuccess', 'Đã lưu cấu hình tài khoản VietQR thành công!'));
        setIsConfigured(true);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setActionError(res.message || t('bank.saveFailed', 'Không thể lưu thông tin ngân hàng'));
      }
    } catch {
      setActionError(t('errors.network', 'Lỗi kết nối khi lưu cấu hình'));
    } finally {
      setIsSaving(false);
    }
  };

  const previewQrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=100000&addInfo=PREVIEW%20CHECK&accountName=${encodeURIComponent(
    accountName
  )}`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            {t('bank.title', 'CẤU HÌNH TÀI KHOẢN NGÂN HÀNG THỤ HƯỞNG (VIETQR)')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('bank.subtitle', 'Thiết lập tài khoản nhận tiền chuyển khoản tự động qua mã VietQR chuẩn Napas 247')}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBankInfo}
          disabled={isLoading}
          className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition disabled:opacity-50"
          title={t('common.refresh', 'Làm mới')}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-red-400 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-400 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={fetchBankInfo} className="underline font-bold">{t('common.retry', 'Thử lại')}</button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-72" />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-72" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Input Form */}
          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-zinc-200 flex items-center gap-2 pb-3 border-b border-zinc-800">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <span>{t('bank.accountInfoTitle', 'Thông Tin Tài Khoản Doanh Nghiệp')}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-300">{t('bank.beneficiaryBank', 'Ngân hàng thụ hưởng')}</label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-semibold focus:outline-none"
                >
                  <option value="MB">MBBank — Ngân hàng Quân Đội</option>
                  <option value="VCB">Vietcombank — Ngân hàng Ngoại Thương</option>
                  <option value="ACB">ACB — Ngân hàng Á Châu</option>
                  <option value="TCB">Techcombank — Ngân hàng Kỹ Thương</option>
                  <option value="TPB">TPBank — Ngân hàng Tiên Phong</option>
                  <option value="BIDV">BIDV — Đầu tư và Phát triển</option>
                  <option value="CTG">VietinBank — Công Thương Việt Nam</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-300">{t('bank.accountNumber', 'Số tài khoản')}</label>
                <input
                  type="text"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-300">{t('bank.accountHolder', 'Tên chủ tài khoản (Viết hoa không dấu)')}</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 uppercase font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                {t('bank.qrNotice', 'Tài khoản này sẽ được dùng để tạo mã VietQR động chứa số tiền chính xác trên màn hình gọi món tại bàn và POS thu ngân.')}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? t('common.saving', 'Đang lưu...') : t('bank.saveConfig', 'Lưu Cấu Hình Ngân Hàng')}</span>
              </button>
            </div>
          </div>

          {/* Right: VietQR Live Preview Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col items-center justify-between text-center space-y-3">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                {t('bank.previewTitle', 'Xem Trước VietQR Live')}
              </span>
              <span className="text-xs text-zinc-500">{t('bank.previewSubtitle', 'Mẫu QR hiển thị cho khách')}</span>
            </div>

            {!isConfigured || !accountNo ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300">
                {t('bank.notConfiguredNotice', 'Chưa cấu hình tài khoản ngân hàng — VietQR sẽ không hoạt động cho đến khi bạn lưu thông tin bên trái.')}
              </div>
            ) : (
              <>
                <div className="relative w-48 h-48 bg-white p-2 rounded-2xl shadow-inner flex items-center justify-center overflow-hidden">
                  <Image
                    src={previewQrUrl}
                    alt="VietQR Preview"
                    width={192}
                    height={192}
                    unoptimized
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-zinc-200">{bankCode} - {accountNo}</p>
                  <p className="text-[11px] text-zinc-400">{accountName}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
