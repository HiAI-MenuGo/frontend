'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Users, X, Armchair, Clock, CheckCircle, QrCode, Building2, Layers } from 'lucide-react';
import { fetchTables, updateTableStatus, toBackendStatus, createTable } from '@/lib/api/tables.api';
import type { UiTable } from '@/lib/api/types';
import { useHeaderStore } from '@/stores/header.store';
import { useAuthStore } from '@/stores/auth.store';
import { useBranchStore } from '@/stores/branch.store';
import { formatVND } from '@/lib/format';
import TableQRModal from './TableQRModal';

export default function ManageTableView() {
  const user = useAuthStore((s) => s.user);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const branches = useBranchStore((s) => s.branches);
  const fetchBranches = useBranchStore((s) => s.fetchBranches);

  const [tables, setTables] = useState<UiTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UiTable | null>(null);
  const [qrTable, setQrTable] = useState<UiTable | null>(null);

  // Modal Thêm bàn mới
  const [showAddTable, setShowAddTable] = useState(false);
  const [tableForm, setTableForm] = useState({
    name: '',
    capacity: 4,
    area: 'MAIN_DINING' as 'MAIN_DINING' | 'TERRACE' | 'OUTDOOR',
    branchId: '',
  });
  const [savingTable, setSavingTable] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTables(selectedBranchId === 'ALL' ? 'ALL' : selectedBranchId);
      setTables(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được bàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    void load();
  }, [selectedBranchId]);

  const setCustomAction = useHeaderStore((s) => s.setCustomAction);
  const availableCount = tables.filter((t) => t.status === 'AVAILABLE').length;
  const onDineCount = tables.filter((t) => t.status === 'ON_DINE').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVED').length;

  // Đưa nút thêm bàn và bộ đếm trạng thái lên topbar
  useEffect(() => {
    setCustomAction(
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        <div className="hidden sm:flex items-center gap-3.5 px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[12px] font-bold text-[#475569]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00A389]" />
            <span>Trống ({availableCount})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A59]" />
            <span>Đang dùng ({onDineCount})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#064E3B]" />
            <span>Đã đặt ({reservedCount})</span>
          </span>
        </div>

        <button
          onClick={() => setShowAddTable(true)}
          className="h-10 px-4 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center gap-2 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98] shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Thêm bàn</span>
        </button>
      </div>
    );
    return () => setCustomAction(null);
  }, [setCustomAction, availableCount, onDineCount, reservedCount]);

  const changeStatus = async (table: UiTable, status: UiTable['status']) => {
    setSaving(true);
    try {
      const updated = await updateTableStatus(table.id, toBackendStatus(status));
      const isAvailable = status === 'AVAILABLE';
      setTables((prev) =>
        prev.map((t) =>
          t.id === table.id
            ? {
                ...t,
                ...updated,
                status,
                ...(isAvailable ? { currentSessionId: undefined, currentCustomer: undefined, totalAmount: 0 } : {}),
              }
            : t
        )
      );
      setSelected((prev) =>
        prev && prev.id === table.id
          ? {
              ...prev,
              ...updated,
              status,
              ...(isAvailable ? { currentSessionId: undefined, currentCustomer: undefined, totalAmount: 0 } : {}),
            }
          : prev
      );
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Đổi trạng thái thất bại');
    } finally {
      setSaving(false);
    }
  };

  // Tạo bàn mới
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableForm.name.trim()) return;

    setSavingTable(true);
    try {
      const targetBranch = tableForm.branchId || (selectedBranchId !== 'ALL' ? selectedBranchId : branches[0]?.id || undefined);
      let createdTable: UiTable | null = null;
      try {
        createdTable = await createTable({
          name: tableForm.name.trim(),
          capacity: tableForm.capacity,
          branchId: targetBranch,
        });
      } catch {
        // Fallback local memory table
      }

      const numMatch = tableForm.name.match(/(\d+)/);
      const tableNumber = numMatch ? parseInt(numMatch[1], 10) : tables.length + 1;

      const newTableEntry: UiTable = createdTable || {
        id: `tbl-${Date.now()}`,
        backendId: `tbl-${Date.now()}`,
        tableNumber,
        tableName: tableForm.name.trim(),
        status: 'AVAILABLE',
        capacity: tableForm.capacity,
        chairs: tableForm.capacity,
        area: tableForm.area,
        branchId: targetBranch,
      };

      setTables((prev) => [...prev, newTableEntry]);
      setShowAddTable(false);
      setTableForm({ name: '', capacity: 4, area: 'MAIN_DINING', branchId: '' });
    } catch {
      alert('Không thể tạo bàn mới');
    } finally {
      setSavingTable(false);
    }
  };

  const isAllBranches = selectedBranchId === 'ALL' || !selectedBranchId;

  // Gom nhóm bàn theo từng chi nhánh khi ở chế độ "Tổng chi nhánh"
  const branchGroups = useMemo(() => {
    if (!isAllBranches) {
      // Khi chọn 1 chi nhánh con cụ thể
      const cur = branches.find((b) => b.id === selectedBranchId);
      return [
        {
          id: selectedBranchId,
          name: cur?.name || 'Chi nhánh hiện tại',
          code: cur?.code || '',
          address: cur?.address || '',
          tables: tables.filter((t) => t.branchId === selectedBranchId || !t.branchId),
        },
      ];
    }

    // Khi ở "Tổng chi nhánh": hiển thị từng div cho từng chi nhánh
    if (branches.length === 0) {
      return [
        {
          id: 'all',
          name: 'Tổng chi nhánh (Toàn công ty)',
          code: 'ALL',
          address: '',
          tables,
        },
      ];
    }

    const groups = branches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      address: b.address || '',
      tables: tables.filter((t) => t.branchId === b.id),
    }));

    // Các bàn chưa phân chi nhánh hoặc id không khớp
    const unassigned = tables.filter((t) => !t.branchId || !branches.some((b) => b.id === t.branchId));
    if (unassigned.length > 0) {
      groups.push({
        id: 'unassigned',
        name: 'Khu vực bàn khác / Chưa phân chi nhánh',
        code: 'OTHER',
        address: '',
        tables: unassigned,
      });
    }

    return groups;
  }, [isAllBranches, selectedBranchId, branches, tables]);

  const statusLabels: Record<UiTable['status'], string> = {
    AVAILABLE: 'Trống',
    ON_DINE: 'Đang dùng',
    RESERVED: 'Đã đặt',
  };

  const statusColors: Record<UiTable['status'], string> = {
    AVAILABLE: 'bg-[#E6F7F4] text-[#00A389]',
    ON_DINE: 'bg-[#FFEDD5] text-[#EA580C]',
    RESERVED: 'bg-[#E2F0EC] text-[#064E3B]',
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm font-bold text-slate-500">
        Đang tải sơ đồ bàn...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="font-bold text-slate-700">Không tải được bàn: {error}</p>
        <button
          onClick={load}
          className="px-5 py-2.5 bg-[#00A389] text-white rounded-xl text-sm font-semibold"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-7 py-5 space-y-5 max-w-7xl mx-auto w-full">
      {tables.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-12 text-center space-y-3">
          <p className="text-sm font-bold text-slate-400">Chưa có bàn nào trong sơ đồ phục vụ.</p>
          <button
            onClick={() => setShowAddTable(true)}
            className="px-4 py-2 bg-[#00A389] text-white rounded-xl text-sm font-bold inline-flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Thêm bàn đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {branchGroups.map((group) => {
            return (
              <div
                key={group.id}
                className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xs overflow-hidden pt-6 pb-8 px-5 sm:px-8"
              >
                {isAllBranches && branchGroups.length > 1 && (
                  <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
                    <Building2 size={16} className="text-[#00A389]" />
                    <span className="font-black text-[14px] text-[#0F172A]">{group.name}</span>
                    <span className="text-[12px] font-bold text-slate-400">({group.tables.length} bàn)</span>
                  </div>
                )}

                {/* Grid danh sách bàn thuộc chi nhánh này */}
                <div>
                  {group.tables.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <p className="text-[13px] text-slate-400 font-medium">Chi nhánh này hiện chưa có bàn nào trong sơ đồ.</p>
                      <button
                        onClick={() => {
                          setTableForm((prev) => ({
                            ...prev,
                            branchId: group.id !== 'all' && group.id !== 'unassigned' ? group.id : '',
                          }));
                          setShowAddTable(true);
                        }}
                        className="px-3.5 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] rounded-xl text-[12px] font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Plus size={14} />
                        <span>Thêm bàn cho chi nhánh này</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-y-7 gap-x-6 justify-items-center">
                      {group.tables.map((table) => {
                        const bg =
                          table.status === 'AVAILABLE'
                            ? 'bg-[#E6F7F4] border-[#B6EADF]'
                            : table.status === 'ON_DINE'
                            ? 'bg-[#FFEDD5] border-[#FED7AA]'
                            : 'bg-[#E2F0EC] border-[#A7D8CC]';
                        const tc =
                          table.status === 'AVAILABLE'
                            ? 'text-[#00A389]'
                            : table.status === 'ON_DINE'
                            ? 'text-[#EA580C]'
                            : 'text-[#064E3B]';

                        return (
                          <div
                            key={table.id}
                            onClick={() => setSelected(table)}
                            className="flex flex-col items-center cursor-pointer hover:scale-[1.03] transition-all w-[185px] sm:w-[205px]"
                          >
                            {/* Hàng ghế có chiều cao cố định để tất cả các bàn thẳng hàng */}
                            <div className="h-4.5 flex items-center justify-center gap-1.5 mb-1.5">
                              {Array.from({ length: Math.min(table.chairs || 2, 4) }).map((_, i) => (
                                <Armchair key={i} size={14} className={tc} />
                              ))}
                            </div>

                            {/* Thẻ bàn có kích thước đồng nhất */}
                            <div
                              className={`w-full h-[86px] rounded-3xl border-2 ${bg} flex flex-col items-center justify-center px-4 py-2 text-center transition-all shadow-2xs`}
                            >
                              <h4
                                className={`font-black text-[13.5px] ${tc} truncate w-full px-1`}
                                title={table.tableName}
                              >
                                {table.tableName}
                              </h4>
                              <div className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-[#64748B] mt-1">
                                <Users size={12} />
                                <span>{table.capacity}</span>
                                {table.totalAmount ? (
                                  <>
                                    <span className="text-[#CBD5E1]">•</span>
                                    <span className={`text-[10.5px] font-bold ${tc}`}>
                                      {table.totalAmount.toLocaleString('vi-VN')}đ
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Chi tiết bàn & Tác vụ */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-xl w-full p-6 sm:p-7 relative shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Cột 1: Thông tin bàn */}
              <div>
                <h4 className="font-black text-[16px] text-[#0F172A] mb-3.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00A389]" />
                  Thông tin bàn
                </h4>

                <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E2E8F0] space-y-2.5">
                  <div className="flex justify-between items-center text-[13px] pb-2 border-b border-[#E2E8F0]/70">
                    <span className="text-[#64748B] font-medium">Bàn</span>
                    <span className="font-black text-[#0F172A] text-[13.5px]">{selected.tableName}</span>
                  </div>

                  <div className="flex justify-between items-center text-[13px] pb-2 border-b border-[#E2E8F0]/70">
                    <span className="text-[#64748B] font-medium">Mã số bàn</span>
                    <span className="font-bold text-[#0F172A]">#{selected.tableNumber}</span>
                  </div>

                  <div className="flex justify-between items-center text-[13px] pb-2 border-b border-[#E2E8F0]/70">
                    <span className="text-[#64748B] font-medium">Sức chứa</span>
                    <span className="font-bold text-[#0F172A]">
                      {selected.capacity} khách ({selected.chairs || selected.capacity} ghế)
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[13px] pb-2 border-b border-[#E2E8F0]/70">
                    <span className="text-[#64748B] font-medium">Khu vực</span>
                    <span className="font-bold text-[#0F172A]">
                      {selected.area === 'TERRACE' ? 'Sân thượng' : selected.area === 'OUTDOOR' ? 'Ngoài trời' : 'Sảnh chính'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[13px] pb-2 border-b border-[#E2E8F0]/70">
                    <span className="text-[#64748B] font-medium">Trạng thái</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${statusColors[selected.status]}`}>
                      {statusLabels[selected.status]}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[13px] pb-2 border-b border-[#E2E8F0]/70">
                    <span className="text-[#64748B] font-medium">Doanh thu</span>
                    <span className="font-bold text-[#00A389]">
                      {selected.totalAmount ? formatVND(selected.totalAmount) : 'Chưa có'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#64748B] font-medium">Phiên hiện tại</span>
                    <span className="font-mono text-[11px] text-[#64748B] truncate max-w-[120px]">
                      {selected.currentSessionId || 'Chưa có'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cột 2: Tác vụ */}
              <div className="flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-[16px] text-[#0F172A] mb-3.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                    Tác vụ
                  </h4>

                  <div className="space-y-3">
                    {selected.status === 'AVAILABLE' && (
                      <>
                        <button
                          onClick={() => changeStatus(selected, 'ON_DINE')}
                          disabled={saving}
                          className="w-full h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white text-[13px] font-extrabold flex items-center justify-center gap-2 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98]"
                        >
                          <Clock size={15} />
                          <span>Mở bàn (Đang dùng)</span>
                        </button>

                        <button
                          onClick={() => changeStatus(selected, 'RESERVED')}
                          disabled={saving}
                          className="w-full h-11 rounded-2xl bg-[#E2F0EC] hover:bg-[#d0e8e2] text-[#064E3B] text-[13px] font-bold flex items-center justify-center gap-2 border border-[#A7D8CC] transition-all active:scale-[0.98]"
                        >
                          <Users size={15} />
                          <span>Đặt trước bàn này</span>
                        </button>
                      </>
                    )}

                    {selected.status === 'ON_DINE' && (
                      <>
                        <div className="w-full h-11 rounded-2xl bg-[#FFEDD5] border border-[#FED7AA] text-[#EA580C] text-[13px] font-extrabold flex items-center justify-center gap-2">
                          <Clock size={16} strokeWidth={2.5} />
                          <span>Đang phục vụ thực khách</span>
                        </div>

                        <button
                          onClick={() => changeStatus(selected, 'AVAILABLE')}
                          disabled={saving}
                          className="w-full h-11 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#00A389] text-[13px] font-bold flex items-center justify-center gap-2 border border-emerald-200 transition-all active:scale-[0.98]"
                        >
                          <CheckCircle size={15} />
                          <span>Trả bàn về Trống</span>
                        </button>
                      </>
                    )}

                    {selected.status === 'RESERVED' && (
                      <>
                        <button
                          onClick={() => changeStatus(selected, 'ON_DINE')}
                          disabled={saving}
                          className="w-full h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white text-[13px] font-extrabold flex items-center justify-center gap-2 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98]"
                        >
                          <CheckCircle size={16} strokeWidth={2.5} />
                          <span>Khách nhận bàn</span>
                        </button>

                        <button
                          onClick={() => changeStatus(selected, 'AVAILABLE')}
                          disabled={saving}
                          className="w-full h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold flex items-center justify-center gap-2 border border-slate-200 transition-all active:scale-[0.98]"
                        >
                          <X size={15} />
                          <span>Huỷ giữ bàn</span>
                        </button>
                      </>
                    )}

                    {/* Nút Xem / In Mã QR Gọi Món Cho Bàn */}
                    <button
                      onClick={() => setQrTable(selected)}
                      className="w-full h-11 rounded-2xl bg-[#E6F7F4] hover:bg-[#D0F2EB] text-[#00A389] text-[13px] font-extrabold flex items-center justify-center gap-2 border border-[#B6EADF] shadow-xs transition-all active:scale-[0.98]"
                    >
                      <QrCode size={16} />
                      <span>Mã QR Gọi Món (Order từ xa)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F1F5F9]">
              <button
                onClick={() => setSelected(null)}
                className="w-full h-11 rounded-2xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[13.5px] font-extrabold text-[#64748B] hover:text-[#0F172A] transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Bàn Mới */}
      {showAddTable && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E6F7F4] text-[#00A389] flex items-center justify-center font-bold">
                  <Armchair size={18} />
                </div>
                <div>
                  <h3 className="text-[17px] font-black text-[#0F172A]">Thêm bàn mới</h3>
                  <p className="text-[12px] text-[#64748B]">Tạo thêm bàn trong sơ đồ phục vụ</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTable(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-3.5 text-[13px]">
              <div>
                <label className="block font-bold text-[#0F172A] mb-1">
                  Tên bàn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tableForm.name}
                  onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-bold text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden"
                  placeholder="Ví dụ: Bàn 09, VIP-01, Ngoài trời 02..."
                />
              </div>

              {branches.length > 0 && (
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Thuộc chi nhánh</label>
                  <select
                    value={tableForm.branchId || (selectedBranchId !== 'ALL' ? selectedBranchId : branches[0]?.id || '')}
                    onChange={(e) => setTableForm({ ...tableForm, branchId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-bold text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code || 'CN'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">
                    Số khách / Ghế <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={tableForm.capacity}
                    onChange={(e) =>
                      setTableForm({ ...tableForm, capacity: parseInt(e.target.value, 10) || 2 })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-bold font-mono text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Khu vực</label>
                  <select
                    value={tableForm.area}
                    onChange={(e) =>
                      setTableForm({
                        ...tableForm,
                        area: e.target.value as 'MAIN_DINING' | 'TERRACE' | 'OUTDOOR',
                      })
                    }
                    className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-bold text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden"
                  >
                    <option value="MAIN_DINING">Sảnh chính</option>
                    <option value="OUTDOOR">Ngoài trời</option>
                    <option value="TERRACE">Sân thượng</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTable(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingTable}
                  className="px-5 py-2.5 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {savingTable ? 'Đang tạo...' : 'Tạo bàn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal hiển thị mã QR gọi món từ xa cho bàn */}
      <TableQRModal
        isOpen={!!qrTable}
        onClose={() => setQrTable(null)}
        table={qrTable}
        tenantId={user?.tenantId}
        branchId={user?.branchId || qrTable?.branchId}
      />
    </div>
  );
}