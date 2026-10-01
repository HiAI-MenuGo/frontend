'use client';

import React, { useState } from 'react';
import { FileText, Printer, CheckCircle, AlertCircle, DollarSign, QrCode } from 'lucide-react';
import apiFetch from '../../../lib/api';

interface ZReportItem {
  id: string;
  shiftName: string;
  cashierName: string;
  date: string;
  cashRevenue: number;
  qrRevenue: number;
  totalRevenue: number;
  actualCash: number;
  discrepancy: number;
}

export default function AdminZReportPage() {
  const [shiftName, setShiftName] = useState('Ca Sáng (07:00 - 15:00)');
  const [openingCash, setOpeningCash] = useState<number>(2000000);
  const [actualCash, setActualCash] = useState<number>(6450000);
  const [note, setNote] = useState('');

  // Live calculated mock for current active shift
  const currentShift = {
    systemCashRevenue: 4450000,
    systemQrRevenue: 9570000,
    totalDiscounts: 350000,
    orderCount: 142,
    voidedCount: 2,
  };

  const expectedCash = openingCash + currentShift.systemCashRevenue;
  const discrepancy = actualCash - expectedCash;

  const [history, setHistory] = useState<ZReportItem[]>([
    {
      id: 'ZR-20261001-01',
      shiftName: 'Ca Tối (30/09)',
      cashierName: 'Nguyễn Thị Mai',
      date: '30/09/2026 22:30',
      cashRevenue: 5120000,
      qrRevenue: 11450000,
      totalRevenue: 16570000,
      actualCash: 7120000,
      discrepancy: 0,
    },
    {
      id: 'ZR-20260930-01',
      shiftName: 'Ca Sáng (30/09)',
      cashierName: 'Lê Thanh Hải',
      date: '30/09/2026 15:15',
      cashRevenue: 3890000,
      qrRevenue: 8200000,
      totalRevenue: 12090000,
      actualCash: 5880000,
      discrepancy: -10000,
    },
  ]);

  const [closedSuccess, setClosedSuccess] = useState(false);

  const handleCloseShift = async () => {
    try {
      await apiFetch('/z-report', {
        method: 'POST',
        body: JSON.stringify({
          shiftName,
          startTime: new Date(Date.now() - 8 * 3600000).toISOString(),
          openingCash,
          actualCash,
          note,
        }),
      });

      const newRecord: ZReportItem = {
        id: `ZR-${Date.now().toString().slice(-6)}`,
        shiftName,
        cashierName: 'Nguyễn Thị Mai (Hiện tại)',
        date: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        cashRevenue: currentShift.systemCashRevenue,
        qrRevenue: currentShift.systemQrRevenue,
        totalRevenue: currentShift.systemCashRevenue + currentShift.systemQrRevenue,
        actualCash,
        discrepancy,
      };

      setHistory([newRecord, ...history]);
      setClosedSuccess(true);
      setTimeout(() => setClosedSuccess(false), 3000);
    } catch {
      // fallback local update
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
          BÁO CÁO KẾT CA & ĐỐI SOÁT TÀI CHÍNH (Z-REPORT)
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Đối soát tiền mặt thực tế trong két so với doanh thu phần mềm tính toán trước khi bàn giao ca
        </p>
      </div>

      {/* Active Shift Closing Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="font-extrabold text-sm text-zinc-100">Chốt Ca Hiện Tại</h2>
            <span className="text-xs text-amber-400 font-semibold">Thu ngân phụ trách: Nguyễn Thị Mai</span>
          </div>
          <select
            value={shiftName}
            onChange={(e) => setShiftName(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
          >
            <option value="Ca Sáng (07:00 - 15:00)">Ca Sáng (07:00 - 15:00)</option>
            <option value="Ca Chiều / Tối (15:00 - 23:00)">Ca Chiều / Tối (15:00 - 23:00)</option>
            <option value="Chốt Cả Ngày">Chốt Cả Ngày</option>
          </select>
        </div>

        {/* Live System Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-2xl">
            <span className="text-zinc-500">Doanh thu tiền mặt</span>
            <p className="text-base font-bold text-zinc-100 mt-1">
              {currentShift.systemCashRevenue.toLocaleString('vi-VN')}đ
            </p>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-2xl">
            <span className="text-zinc-500">Doanh thu VietQR</span>
            <p className="text-base font-bold text-amber-400 mt-1">
              {currentShift.systemQrRevenue.toLocaleString('vi-VN')}đ
            </p>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-2xl">
            <span className="text-zinc-500">Tổng hóa đơn ca</span>
            <p className="text-base font-bold text-sky-400 mt-1">
              {currentShift.orderCount} đơn ({currentShift.voidedCount} hủy)
            </p>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-2xl">
            <span className="text-zinc-500">Tiền giảm voucher</span>
            <p className="text-base font-bold text-emerald-400 mt-1">
              {currentShift.totalDiscounts.toLocaleString('vi-VN')}đ
            </p>
          </div>
        </div>

        {/* Cash Audit Calculations */}
        <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-zinc-400 font-semibold">Tiền mặt đầu ca (Két dự phòng)</label>
            <input
              type="number"
              value={openingCash}
              onChange={(e) => setOpeningCash(Number(e.target.value))}
              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="text-zinc-400 font-semibold">Tiền mặt đếm thực tế trong két</label>
            <input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(Number(e.target.value))}
              className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none"
            />
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-zinc-400 font-semibold">Chênh lệch két (Thừa / Thiếu):</span>
            <span
              className={`text-lg font-black font-mono mt-1 ${
                discrepancy === 0
                  ? 'text-emerald-400'
                  : discrepancy > 0
                  ? 'text-sky-400'
                  : 'text-red-400'
              }`}
            >
              {discrepancy === 0
                ? '0đ (Khớp 100%)'
                : `${discrepancy > 0 ? '+' : ''}${discrepancy.toLocaleString('vi-VN')}đ`}
            </span>
          </div>
        </div>

        {/* Note and Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú bàn giao ca (nếu có)..."
            className="w-full sm:w-96 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none"
          />

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {closedSuccess && (
              <span className="text-xs text-emerald-400 font-bold">✓ Đã lưu Z-Report thành công!</span>
            )}
            <button
              type="button"
              onClick={handleCloseShift}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
            >
              Xác Nhận Chốt Ca & Lưu Z-Report
            </button>
          </div>
        </div>
      </div>

      {/* Historical Z-Reports Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-lg">
        <h3 className="font-extrabold text-sm text-zinc-100">Lịch Sử Các Ca Đã Chốt</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-3">Mã Báo Cáo</th>
                <th className="py-3 px-3">Tên Ca</th>
                <th className="py-3 px-3">Thu Ngân</th>
                <th className="py-3 px-3">Thời Gian Chốt</th>
                <th className="py-3 px-3 text-right">Tiền Mặt</th>
                <th className="py-3 px-3 text-right">VietQR</th>
                <th className="py-3 px-3 text-right">Tổng Thu</th>
                <th className="py-3 px-3 text-right">Chênh Lệch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/30">
                  <td className="py-3 px-3 font-mono font-bold text-amber-400">{row.id}</td>
                  <td className="py-3 px-3 text-zinc-200">{row.shiftName}</td>
                  <td className="py-3 px-3 text-zinc-300">{row.cashierName}</td>
                  <td className="py-3 px-3 text-zinc-400">{row.date}</td>
                  <td className="py-3 px-3 text-right text-zinc-300">
                    {row.cashRevenue.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-300">
                    {row.qrRevenue.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-zinc-100">
                    {row.totalRevenue.toLocaleString('vi-VN')}đ
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-bold font-mono ${
                      row.discrepancy === 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {row.discrepancy === 0 ? '0đ' : `${row.discrepancy.toLocaleString('vi-VN')}đ`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
