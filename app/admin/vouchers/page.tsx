'use client';

import React, { useState } from 'react';
import { Ticket, Plus, Search, Tag, CheckCircle, XCircle, X } from 'lucide-react';
import apiFetch from '../../../lib/api';

interface VoucherItem {
  id: string;
  code: string;
  description: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  maxDiscount?: number;
  minOrderVal: number;
  usedCount: number;
  usageLimit?: number;
  isActive: boolean;
  endDate: string;
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([
    {
      id: 'v-1',
      code: 'CHAO2026',
      description: 'Giảm 20% tối đa 50.000đ cho đơn từ 100.000đ',
      type: 'PERCENT',
      value: 20,
      maxDiscount: 50000,
      minOrderVal: 100000,
      usedCount: 142,
      usageLimit: 500,
      isActive: true,
      endDate: '31/12/2026',
    },
    {
      id: 'v-2',
      code: 'GIAM30K',
      description: 'Giảm trực tiếp 30.000đ cho hóa đơn từ 150.000đ',
      type: 'FIXED',
      value: 30000,
      minOrderVal: 150000,
      usedCount: 78,
      usageLimit: 200,
      isActive: true,
      endDate: '30/11/2026',
    },
    {
      id: 'v-3',
      code: 'SUMMER50',
      description: 'Mã khuyến mãi hè giảm 50k',
      type: 'FIXED',
      value: 50000,
      minOrderVal: 200000,
      usedCount: 100,
      usageLimit: 100,
      isActive: false,
      endDate: '31/08/2026',
    },
  ]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [newValue, setNewValue] = useState<number>(15);
  const [newMinOrder, setNewMinOrder] = useState<number>(100000);

  const toggleVoucherActive = (id: string) => {
    setVouchers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isActive: !v.isActive } : v))
    );
  };

  const handleCreateVoucher = () => {
    if (!newCode.trim()) return;
    const v: VoucherItem = {
      id: `v-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      description: newDesc,
      type: newType,
      value: Number(newValue),
      minOrderVal: Number(newMinOrder),
      usedCount: 0,
      usageLimit: 500,
      isActive: true,
      endDate: '31/12/2026',
    };
    setVouchers([v, ...vouchers]);
    setIsModalOpen(false);
  };

  const filtered = vouchers.filter((v) =>
    v.code.toLowerCase().includes(search.toLowerCase()) || v.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            QUẢN LÝ MÃ GIẢM GIÁ & VOUCHER
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Thiết lập chương trình khuyến mãi theo % hoặc số tiền cố định, giới hạn lượt dùng và đơn tối thiểu
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewCode('');
            setNewDesc('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Voucher Mới</span>
        </button>
      </div>

      {/* Vouchers Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã voucher..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-3">Mã Code</th>
                <th className="py-3 px-3">Mô Tả Khuyến Mãi</th>
                <th className="py-3 px-3">Loại / Mức Giảm</th>
                <th className="py-3 px-3">Đơn Tối Thiểu</th>
                <th className="py-3 px-3">Lượt Đã Dùng</th>
                <th className="py-3 px-3">Hạn Dùng</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-zinc-800/30">
                  <td className="py-3 px-3 font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    <span>{v.code}</span>
                  </td>
                  <td className="py-3 px-3 text-zinc-200">{v.description}</td>
                  <td className="py-3 px-3 font-bold text-emerald-400">
                    {v.type === 'PERCENT' ? `${v.value}%` : `${v.value.toLocaleString('vi-VN')}đ`}
                  </td>
                  <td className="py-3 px-3 text-zinc-400">
                    {v.minOrderVal.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="py-3 px-3 text-zinc-300">
                    {v.usedCount} / {v.usageLimit || '∞'}
                  </td>
                  <td className="py-3 px-3 text-zinc-400">{v.endDate}</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleVoucherActive(v.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition border ${
                        v.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}
                    >
                      {v.isActive ? 'KÍCH HOẠT' : 'TẠM KHÓA'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Voucher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-extrabold text-sm text-zinc-100">Tạo Mã Giảm Giá Mới</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold">Mã Voucher (Code)</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: TRIAN50K"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold">Mô tả ngắn</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Giảm 50k cho khách hàng thân thiết..."
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold">Loại giảm giá</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold">Mức giảm</label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold">Giá trị đơn tối thiểu (VNĐ)</label>
                <input
                  type="number"
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(Number(e.target.value))}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateVoucher}
                className="px-4 py-2 bg-amber-500 font-bold text-zinc-950 rounded-xl shadow"
              >
                Lưu Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
