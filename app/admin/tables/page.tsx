'use client';

import React, { useState, useEffect, useCallback } from 'react';
import TableQRCode from '../../../components/floor/TableQRCode';
import { QrCode, Users, Layers, X, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import apiFetch from '../../../lib/api';
import { useI18n } from '../../../context/i18nContext';

interface FloorTable {
  id: string;
  code?: string;
  name: string;
  status: 'EMPTY' | 'OCCUPIED' | 'RESERVED';
  branchId?: string;
  capacity?: number;
  customerCount?: number;
  totalAmount?: number;
}

export default function AdminTablesPage() {
  const { t } = useI18n();
  const [tables, setTables] = useState<FloorTable[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedTableForQr, setSelectedTableForQr] = useState<FloorTable | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);

  const handleOpenQr = async (t: FloorTable) => {
    setSelectedTableForQr(t);
    setQrToken(null);
    // Xin token JWT mã hóa cho standee (fallback id thô nếu API chưa sẵn sàng).
    const res = await apiFetch<{ token: string }>(`/tables/${t.id}/qr-token`);
    if (res.success && res.data?.token) setQrToken(res.data.token);
  };

  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<FloorTable[]>('/tables');
      if (res.success && Array.isArray(res.data)) {
        setTables(res.data);
      } else {
        setError(res.message || 'Không thể tải danh sách bàn');
      }
    } catch {
      setError('Lỗi kết nối khi tải sơ đồ bàn');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    // Lấy logo quán để chèn giữa QR standee (TableQRCode level H).
    apiFetch('/branding').then((res) => {
      if (res.success && res.data?.logoUrl) setLogoUrl(res.data.logoUrl);
    });
  }, [fetchTables]);

  const filtered = tables.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.status === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            {t('tables.title', 'SƠ ĐỒ BÀN ĂN & TẠO MÃ QR TẠI BÀN')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Quản lý vị trí bàn, trạng thái phục vụ và xuất file in standee mã QR Level H độ nét cao
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTables}
          disabled={isLoading}
          className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition disabled:opacity-50"
          title="Làm mới"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'all', label: t('tables.all', 'Tất Cả Bàn') },
          { key: 'EMPTY', label: t('tables.empty', 'Bàn Trống') },
          { key: 'OCCUPIED', label: t('tables.occupied', 'Đang Có Khách') },
          { key: 'RESERVED', label: t('tables.reserved', 'Đã Đặt Trước') },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeFilter === tab.key
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 bg-zinc-900 border border-zinc-800 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-zinc-900 border border-red-500/30 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-xs text-zinc-300 font-semibold">{error}</p>
          <button
            type="button"
            onClick={fetchTables}
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-xl inline-flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-2">
          <Layers className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="font-bold text-zinc-300 text-sm">{t('tables.noTables', 'Không tìm thấy bàn nào')}</p>
          <p className="text-xs text-zinc-500">Thử chọn bộ lọc trạng thái khác.</p>
        </div>
      ) : (
        /* Tables Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((tbl) => {
            const isOccupied = tbl.status === 'OCCUPIED';
            const isReserved = tbl.status === 'RESERVED';

            return (
              <div
                key={tbl.id}
                className={`bg-zinc-900 border rounded-2xl p-4 flex flex-col justify-between transition hover:border-amber-500/50 shadow-md ${
                  isOccupied
                    ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent'
                    : isReserved
                    ? 'border-sky-500/40 bg-gradient-to-b from-sky-500/5 to-transparent'
                    : 'border-zinc-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-zinc-100">{tbl.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        isOccupied
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : isReserved
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {isOccupied ? t('tables.occupied', 'CÓ KHÁCH') : isReserved ? t('tables.reserved', 'ĐẶT TRƯỚC') : t('tables.empty', 'TRỐNG')}
                    </span>
                  </div>

                  {tbl.totalAmount ? (
                    <p className="text-xs font-mono font-bold text-amber-400 pt-1">
                      {tbl.totalAmount.toLocaleString('vi-VN')}đ
                    </p>
                  ) : null}
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  {(tbl.capacity ?? tbl.customerCount) !== undefined ? (
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Users className="w-3 h-3 text-zinc-500" />
                      <span>{tbl.capacity ?? tbl.customerCount} {t('tables.seats', 'chỗ')}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-600">{t('tables.unknownCapacity', 'Chưa rõ sức chứa')}</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenQr(tbl)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 font-semibold text-[11px] text-zinc-200 rounded-lg transition"
                    title="Tải Standee QR"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{t('tables.qrCode', 'QR Code')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Standee QR Code Modal */}
      {selectedTableForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-extrabold text-sm text-zinc-100 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-500" />
                <span>Standee {selectedTableForQr.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTableForQr(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <TableQRCode
              tableId={selectedTableForQr.id}
              tableCode={selectedTableForQr.code || selectedTableForQr.name}
              tableName={selectedTableForQr.name}
              logoUrl={logoUrl}
              qrToken={qrToken || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
