'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Printer, CheckCircle, AlertCircle, DollarSign, QrCode, RefreshCw, Download } from 'lucide-react';
import apiFetch from '../../../lib/api';

interface ShiftPreview {
  cashRevenue: number;
  qrRevenue: number;
  cardRevenue: number;
  totalRevenue: number;
  orderCount: number;
  voidedCount: number;
  totalDiscount: number;
}

interface ZReportHistoryItem {
  id: string;
  shiftName: string;
  createdAt: string;
  totalRevenue: number;
  cashRevenue: number;
  qrRevenue: number;
  actualCash: number;
  discrepancy: number;
  note?: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AdminZReportPage() {
  const [shiftName, setShiftName] = useState('Ca Sáng (07:00 - 15:00)');
  const [openingCash, setOpeningCash] = useState<number>(2000000);
  const [actualCash, setActualCash] = useState<number>(2000000);
  const [note, setNote] = useState('');

  const [preview, setPreview] = useState<ShiftPreview>({
    cashRevenue: 0,
    qrRevenue: 0,
    cardRevenue: 0,
    totalRevenue: 0,
    orderCount: 0,
    voidedCount: 0,
    totalDiscount: 0,
  });

  const [history, setHistory] = useState<ZReportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchShiftData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prevRes, histRes] = await Promise.all([
        apiFetch<ShiftPreview>('/z-report/shift-summary'),
        apiFetch<ZReportHistoryItem[]>('/z-report/history'),
      ]);

      if (prevRes.success && prevRes.data) {
        setPreview(prevRes.data);
        // Pre-fill actualCash with expected cash if not touched
        setActualCash((prev) => (prev === 2000000 ? 2000000 + (prevRes.data?.cashRevenue || 0) : prev));
      }

      if (histRes.success && Array.isArray(histRes.data)) {
        setHistory(histRes.data);
      }
    } catch {
      setError('Lỗi kết nối khi tải số liệu ca làm việc');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShiftData();
  }, [fetchShiftData]);

  const expectedCash = openingCash + (preview.cashRevenue || 0);
  const discrepancy = actualCash - expectedCash;

  const handleCloseShift = async () => {
    if (!shiftName.trim()) return;
    setIsClosing(true);
    try {
      const res = await apiFetch('/z-report/close-shift', {
        method: 'POST',
        body: JSON.stringify({
          shiftName,
          startTime: new Date(Date.now() - 8 * 3600000).toISOString(),
          openingCash: Number(openingCash),
          actualCash: Number(actualCash),
          note,
        }),
      });

      if (res.success) {
        setSuccessMessage('Chốt ca làm việc và lưu Z-Report thành công!');
        fetchShiftData();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        alert(res.message || 'Không thể chốt ca làm việc');
      }
    } catch {
      alert('Lỗi kết nối khi gửi yêu cầu chốt ca');
    } finally {
      setIsClosing(false);
    }
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const exportUrl = `${apiUrl}/z-report/export?format=${format}`;

    if (format === 'pdf') {
      // Open print-ready HTML window
      const printWindow = window.open(exportUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    } else {
      // Direct download
      window.open(exportUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            BÁO CÁO KẾT CA & ĐỐI SOÁT (Z-REPORT)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Tổng kết doanh thu ca, đối soát tiền mặt thực thu với số liệu hệ thống và chốt ca thu ngân
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchShiftData}
            disabled={isLoading}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xuất Excel</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>In Khổ 80mm</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-400 animate-in fade-in">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between gap-2.5 text-xs text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchShiftData}
            className="underline font-bold text-red-300 hover:text-white"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Main Grid: Live Shift Closing & KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form for Closing Shift */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-extrabold text-sm text-zinc-200 flex items-center gap-2 pb-3 border-b border-zinc-800">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Chốt Sổ Ca Hiện Tại</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-zinc-300">Tên ca làm việc</label>
              <input
                type="text"
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-300">Tiền quỹ đầu ca (VNĐ)</label>
              <input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(Number(e.target.value))}
                className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-300">Tiền mặt thực tế đếm được (VNĐ)</label>
              <input
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(Number(e.target.value))}
                className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-300">Ghi chú bàn giao</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm về lý do chênh lệch hoặc tồn tiền lẻ..."
                rows={2}
                className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseShift}
            disabled={isClosing}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            {isClosing ? 'Đang xử lý...' : 'Xác Nhận & Đóng Ca'}
          </button>
        </div>

        {/* Right: Live Calculation & Cash Discrepancy Reconciliation */}
        <div className="lg:col-span-2 space-y-4">
          {/* Revenue Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Tiền Mặt (Hệ Thống)</span>
              </div>
              <p className="text-xl font-black text-emerald-400">
                {preview.cashRevenue.toLocaleString('vi-VN')}đ
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <QrCode className="w-4 h-4 text-sky-400" />
                <span>VietQR Chuyển Khoản</span>
              </div>
              <p className="text-xl font-black text-sky-400">
                {preview.qrRevenue.toLocaleString('vi-VN')}đ
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Tổng Doanh Thu Ca</span>
              </div>
              <p className="text-xl font-black text-amber-400">
                {preview.totalRevenue.toLocaleString('vi-VN')}đ
              </p>
            </div>
          </div>

          {/* Cash Discrepancy Box */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
            <h4 className="font-bold text-xs text-zinc-200 uppercase tracking-wider">
              Đối Soát Tiền Mặt Thực Tế vs Hệ Thống
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 block">Tiền két dự kiến:</span>
                <span className="font-bold text-zinc-200 font-mono">
                  {expectedCash.toLocaleString('vi-VN')}đ
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  (Quỹ đầu ca + Tiền mặt thu)
                </span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 block">Tiền mặt thực đếm:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {actualCash.toLocaleString('vi-VN')}đ
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  discrepancy === 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : discrepancy > 0
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                <span className="block font-semibold">
                  {discrepancy === 0 ? '✓ Khớp 100%' : discrepancy > 0 ? 'Dư két' : 'Thiếu hụt'}
                </span>
                <span className="font-black text-sm font-mono">
                  {discrepancy > 0 ? '+' : ''}
                  {discrepancy.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
              <span>Đơn hoàn tất: <strong className="text-zinc-200">{preview.orderCount}</strong></span>
              <span>Đơn hủy: <strong className="text-zinc-200">{preview.voidedCount}</strong></span>
              <span>Giảm giá khuyến mãi: <strong className="text-zinc-200">{preview.totalDiscount.toLocaleString('vi-VN')}đ</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <h3 className="font-extrabold text-sm text-zinc-100">Lịch Sử Các Ca Đã Chốt Sổ</h3>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">
            Chưa có lịch sử chốt ca nào được ghi nhận trên hệ thống.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-3">Tên Ca / Thời Gian</th>
                  <th className="py-3 px-3">Người Chốt</th>
                  <th className="py-3 px-3 text-right">Tiền Mặt</th>
                  <th className="py-3 px-3 text-right">VietQR</th>
                  <th className="py-3 px-3 text-right">Tổng Doanh Thu</th>
                  <th className="py-3 px-3 text-right">Thực Thu</th>
                  <th className="py-3 px-3 text-center">Chênh Lệch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-3">
                      <span className="font-bold text-zinc-200 block">{item.shiftName}</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-300">
                      {item.user?.name || 'Thu ngân'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-300">
                      {item.cashRevenue.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sky-400">
                      {item.qrRevenue.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                      {item.totalRevenue.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-200">
                      {item.actualCash.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.discrepancy === 0
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {item.discrepancy === 0 ? 'Khớp' : `${item.discrepancy.toLocaleString('vi-VN')}đ`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
