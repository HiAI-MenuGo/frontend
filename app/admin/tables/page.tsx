'use client';

import React, { useState } from 'react';
import TableQRCode from '../../../components/floor/TableQRCode';
import { Plus, QrCode, Users, Layers, X, Eye } from 'lucide-react';

interface FloorTable {
  id: string;
  code: string;
  name: string;
  areaName: string;
  capacity: number;
  status: 'EMPTY' | 'OCCUPIED' | 'RESERVED';
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState<FloorTable[]>([
    { id: 'tbl-01', code: 'Bàn 01', name: 'Góc Cửa Sổ', areaName: 'Tầng Trệt', capacity: 2, status: 'EMPTY' },
    { id: 'tbl-02', code: 'Bàn 02', name: 'Trung Tâm', areaName: 'Tầng Trệt', capacity: 4, status: 'OCCUPIED' },
    { id: 'tbl-03', code: 'Bàn 03', name: 'Góc Ấm Cúng', areaName: 'Tầng Trệt', capacity: 4, status: 'EMPTY' },
    { id: 'tbl-04', code: 'Bàn 04', name: 'Nhóm Lớn', areaName: 'Tầng Trệt', capacity: 6, status: 'EMPTY' },
    { id: 'tbl-05', code: 'Bàn 05', name: 'Hiên Trà Ngoài Trời', areaName: 'Sân Vườn', capacity: 4, status: 'EMPTY' },
    { id: 'tbl-06', code: 'Bàn 06', name: 'Cạnh Hồ Cá', areaName: 'Sân Vườn', capacity: 4, status: 'EMPTY' },
    { id: 'tbl-vip-01', code: 'VIP-01', name: 'Hoàng Gia VIP', areaName: 'Phòng VIP', capacity: 10, status: 'RESERVED' },
  ]);

  const [activeArea, setActiveArea] = useState('all');
  const [selectedTableForQr, setSelectedTableForQr] = useState<FloorTable | null>(null);

  const filtered = tables.filter((t) => activeArea === 'all' || t.areaName === activeArea);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            SƠ ĐỒ BÀN ĂN & TẠO MÃ QR TẠI BÀN
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Quản lý vị trí bàn, trạng thái phục vụ và xuất file in standee mã QR Level H độ nét cao
          </p>
        </div>
      </div>

      {/* Area Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {['all', 'Tầng Trệt', 'Sân Vườn', 'Phòng VIP'].map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => setActiveArea(area)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeArea === area
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {area === 'all' ? 'Tất Cả Khu Vực' : area}
          </button>
        ))}
      </div>

      {/* Table Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-extrabold text-base text-zinc-100">{t.code}</span>
                <p className="text-xs text-zinc-400 mt-0.5">{t.name}</p>
                <span className="text-[10px] text-zinc-500 font-semibold">{t.areaName}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  t.status === 'EMPTY'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : t.status === 'OCCUPIED'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                }`}
              >
                {t.status === 'EMPTY' ? 'TRỐNG' : t.status === 'OCCUPIED' ? 'CÓ KHÁCH' : 'ĐÃ ĐẶT'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
              <span className="text-zinc-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                <span>{t.capacity} chỗ</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedTableForQr(t)}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 font-semibold rounded-lg flex items-center gap-1 transition"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Mã QR</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Standee Modal */}
      {selectedTableForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSelectedTableForQr(null)}
              className="absolute -top-3 -right-3 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full shadow-lg z-10 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
            <TableQRCode
              tableCode={selectedTableForQr.code}
              tableName={selectedTableForQr.name}
              tableId={selectedTableForQr.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
