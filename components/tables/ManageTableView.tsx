'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Users, X, Armchair, Clock, CheckCircle, Building2, Layers, MapPin } from 'lucide-react';
import { fetchTables, updateTableStatus, toBackendStatus, createTable } from '@/lib/api/tables.api';
import type { UiTable } from '@/lib/api/types';
import { useHeaderStore } from '@/stores/header.store';
import { useAuthStore } from '@/stores/auth.store';
import { useBranchStore } from '@/stores/branch.store';
import { useSocket } from '@/context/SocketContext';
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

  const { on, off, isConnected } = useSocket();

  // Đồng bộ realtime trạng thái bàn khi khách đặt món hoặc khi nhân viên đổi trạng thái
  useEffect(() => {
    if (!isConnected) return;

    const handleStatusChanged = (payload: { tableId?: string; status?: 'EMPTY' | 'OCCUPIED' | 'RESERVED' }) => {
      if (!payload?.tableId) return;
      const targetId = payload.tableId;
      const newStatus = payload.status;
      const newUiStatus: UiTable['status'] =
        newStatus === 'EMPTY' ? 'AVAILABLE' : newStatus === 'OCCUPIED' ? 'ON_DINE' : 'RESERVED';

      setTables((prev) =>
        prev.map((t) =>
          t.id === targetId || t.backendId === targetId
            ? {
                ...t,
                status: newUiStatus,
                ...(newStatus === 'EMPTY' ? { currentCustomer: undefined } : {}),
              }
            : t
        )
      );

      setSelected((prev) =>
        prev && (prev.id === targetId || prev.backendId === targetId)
          ? {
              ...prev,
              status: newUiStatus,
              ...(newStatus === 'EMPTY' ? { currentCustomer: undefined } : {}),
            }
          : prev
      );
    };

    on('table:status-changed', handleStatusChanged);
    return () => {
      off('table:status-changed', handleStatusChanged);
    };
  }, [isConnected, on, off]);

  const setCustomAction = useHeaderStore((s) => s.setCustomAction);
  const availableCount = tables.filter((t) => t.status === 'AVAILABLE').length;
  const onDineCount = tables.filter((t) => t.status === 'ON_DINE').length;

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
  }, [setCustomAction, availableCount, onDineCount]);

  const changeStatus = async (table: UiTable, status: UiTable['status']) => {
    setSaving(true);
    try {
      const updated = await updateTableStatus(table.id, toBackendStatus(status), table.branchId);
      const isAvailable = status === 'AVAILABLE';
      setTables((prev) =>
        prev.map((t) =>
          t.id === table.id
            ? {
                ...t,
                ...updated,
                status,
                ...(isAvailable ? { currentCustomer: undefined } : {}),
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
              ...(isAvailable ? { currentCustomer: undefined } : {}),
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
        branchId: targetBranch,
      };

      setTables((prev) => [...prev, newTableEntry]);
      setShowAddTable(false);
      setTableForm({ name: '', capacity: 4, branchId: '' });
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

    // Khi ở "Tổng chi nhánh": hiển thị từng khối cho từng chi nhánh lấy từ Cài đặt chi nhánh
    if (branches.length === 0) {
      return [
        {
          id: 'all',
          name: 'Tổng chi nhánh (Toàn hệ thống)',
          code: 'ALL',
          address: '',
          tables,
        },
      ];
    }

    const groups = branches.map((b) => {
      const branchTables = tables.filter((t) => t.branchId === b.id);
      return {
        id: b.id,
        name: b.name, // Tên chi nhánh chuẩn lấy từ Cài đặt chi nhánh
        code: b.code || '',
        address: b.address || '',
        tables: branchTables,
      };
    });

    // Các bàn chưa gán branchId hoặc có branchId legacy ('default-branch'):
    // Tự động phân bổ vào chi nhánh đầu tiên của hệ thống để đồng bộ hiển thị
    const unassigned = tables.filter(
      (t) => !t.branchId || t.branchId === 'default-branch' || !branches.some((b) => b.id === t.branchId)
    );
    if (unassigned.length > 0) {
      if (groups.length > 0) {
        groups[0].tables.push(...unassigned);
      } else {
        groups.push({
          id: 'unassigned',
          name: 'Chi nhánh chính',
          code: 'CN-CHINH',
          address: '',
          tables: unassigned,
        });
      }
    }

    return groups;
  }, [isAllBranches, selectedBranchId, branches, tables]);

  const statusLabels: Record<UiTable['status'], string> = {
    AVAILABLE: 'Trống',
    ON_DINE: 'Đang dùng',
    RESERVED: 'Đang dùng',
  };

  const statusColors: Record<UiTable['status'], string> = {
    AVAILABLE: 'bg-[#E6F7F4] text-[#00A389]',
    ON_DINE: 'bg-[#FFEDD5] text-[#EA580C]',
    RESERVED: 'bg-[#FFEDD5] text-[#EA580C]',
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
    <div className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-4 lg:px-6 py-4 lg:py-5 space-y-4 lg:space-y-5 max-w-[1720px] mx-auto w-full view-scroll">
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
        <div className={isAllBranches && branchGroups.length > 1 ? 'grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 items-start min-w-0' : 'space-y-6 min-w-0'}>
          {branchGroups.map((group) => {
            return (
              <div
                key={group.id}
                className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xs overflow-hidden pt-6 pb-7 px-5 sm:px-6 flex flex-col justify-between"
              >
                {/* Header hiển thị thông tin & tổng số bàn của chi nhánh - Tự động thích ứng trên mọi màn hình */}
                <div
                  className={`pb-5 mb-6 border-b border-slate-100 flex ${
                    isAllBranches && branchGroups.length > 1
                      ? 'flex-col gap-3.5'
                      : 'flex-col sm:flex-row sm:items-center justify-between gap-3.5'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6F7F4] text-[#00A389] flex items-center justify-center font-bold shadow-2xs shrink-0 mt-0.5 sm:mt-0">
                      <Building2 size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-[15.5px] sm:text-[16px] text-[#0F172A] leading-snug">
                          {group.name}
                        </h3>
                        {group.code && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[#475569] text-[10.5px] sm:text-[11px] font-extrabold uppercase shrink-0">
                            {group.code}
                          </span>
                        )}
                      </div>
                      {group.address ? (
                        <p className="text-[12px] text-[#64748B] font-medium flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="line-clamp-1 sm:line-clamp-2">{group.address}</span>
                        </p>
                      ) : (
                        <p className="text-[11.5px] text-[#94A3B8] font-medium mt-0.5">
                          Chi nhánh hệ thống trong Cài đặt
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Div thống kê tổng số bàn của chi nhánh đó - Đảm bảo không bao giờ bị vỡ dòng chữ trên mọi kích thước màn hình */}
                  <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[11.5px] sm:text-[12px] font-bold shrink-0 whitespace-nowrap self-start sm:self-auto max-w-full overflow-x-auto">
                    <span className="text-[#0F172A] font-black whitespace-nowrap shrink-0">
                      Tổng: {group.tables.length} bàn
                    </span>
                    <span className="text-slate-300 shrink-0">•</span>
                    <span className="text-[#00A389] font-extrabold flex items-center gap-1 whitespace-nowrap shrink-0">
                      <span className="w-2 h-2 rounded-full bg-[#00A389] shrink-0" />
                      {group.tables.filter((t) => t.status === 'AVAILABLE').length} trống
                    </span>
                    <span className="text-slate-300 shrink-0">•</span>
                    <span className="text-[#EA580C] font-extrabold flex items-center gap-1 whitespace-nowrap shrink-0">
                      <span className="w-2 h-2 rounded-full bg-[#EA580C] shrink-0" />
                      {group.tables.filter((t) => t.status === 'ON_DINE').length} đang dùng
                    </span>
                  </div>
                </div>

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
                    <div
                      className={
                        isAllBranches
                          ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-y-6 gap-x-3 lg:gap-x-4 justify-items-center min-w-0'
                          : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-6 lg:gap-y-7 gap-x-3 sm:gap-x-4 lg:gap-x-6 justify-items-center min-w-0'
                      }
                    >
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
                            className="flex flex-col items-center cursor-pointer hover:scale-[1.03] transition-all w-full max-w-[170px] sm:max-w-[190px]"
                          >
                            {/* Hàng ghế có chiều cao cố định để tất cả các bàn thẳng hàng */}
                            <div className="h-4.5 flex items-center justify-center gap-1.5 mb-1.5">
                              {Array.from({
                                length:
                                  table.status === 'AVAILABLE'
                                    ? Math.min(table.capacity || table.chairs || 4, 4)
                                    : Math.min(table.customerCount || 1, 4),
                              }).map((_, i) => (
                                <Armchair key={i} size={14} className={tc} />
                              ))}
                            </div>

                            {/* Thẻ bàn có kích thước đồng nhất */}
                            <div
                              className={`w-full h-[86px] rounded-3xl border-2 ${bg} flex flex-col items-center justify-center px-3 sm:px-4 py-2 text-center transition-all shadow-2xs`}
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
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-[28px] w-full max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92dvh] my-auto p-5 sm:p-7 lg:p-8 relative shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden modal-panel">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>

            <div className="overflow-y-auto pr-1 flex-1 modal-body">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-7 lg:gap-8 mb-6">
                {/* Cột 1: Thông tin bàn */}
                <div className="md:col-span-7">
                  <h4 className="font-black text-[17px] text-[#0F172A] mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00A389]" />
                    Thông tin bàn
                  </h4>

                  <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] space-y-3">
                    <div className="flex justify-between items-center text-[13.5px] pb-2.5 border-b border-[#E2E8F0]/70">
                      <span className="text-[#64748B] font-medium">Bàn</span>
                      <span className="font-black text-[#0F172A] text-[14px]">
                        {selected.tableName.replace(/\s*\([^)]*\)/g, '').trim()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[13.5px] pb-2.5 border-b border-[#E2E8F0]/70">
                      <span className="text-[#64748B] font-medium">Mã số bàn</span>
                      <span className="font-bold text-[#0F172A]">#{selected.tableNumber}</span>
                    </div>

                    <div className="flex justify-between items-center text-[13.5px] pb-2.5 border-b border-[#E2E8F0]/70">
                      <span className="text-[#64748B] font-medium">Sức chứa</span>
                      <span className="font-bold text-[#0F172A]">
                        {selected.capacity} khách
                      </span>
                    </div>


                    <div className="flex justify-between items-center text-[13.5px] pb-2.5 border-b border-[#E2E8F0]/70 gap-3 min-w-0">
                      <span className="text-[#64748B] font-medium shrink-0">Chi nhánh</span>
                      <span
                        className="font-bold text-[#0F172A] text-right sm:whitespace-nowrap truncate sm:overflow-visible"
                        title={branches.find((b) => b.id === selected.branchId)?.name || selected.branchName || 'Chi nhánh hệ thống'}
                      >
                        {branches.find((b) => b.id === selected.branchId)?.name || selected.branchName || 'Chi nhánh hệ thống'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[13.5px]">
                      <span className="text-[#64748B] font-medium">Trạng thái</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${statusColors[selected.status]}`}>
                        {statusLabels[selected.status]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cột 2: Tác vụ */}
                <div className="md:col-span-5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-[17px] text-[#0F172A] mb-4 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                      Tác vụ
                    </h4>

                    <div className="space-y-3.5">
                      {selected.status === 'AVAILABLE' && (
                        <button
                          onClick={() => changeStatus(selected, 'ON_DINE')}
                          disabled={saving}
                          className="w-full h-12 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white text-[13.5px] font-extrabold flex items-center justify-center shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <span>Mở bàn</span>
                        </button>
                      )}

                      {selected.status === 'ON_DINE' && (
                        <>
                          <div className="w-full h-12 rounded-2xl bg-[#FFEDD5] border border-[#FED7AA] text-[#EA580C] text-[13.5px] font-extrabold flex items-center justify-center gap-2">
                            <Clock size={17} strokeWidth={2.5} />
                            <span>Đang phục vụ</span>
                          </div>

                          <button
                            onClick={() => changeStatus(selected, 'AVAILABLE')}
                            disabled={saving}
                            className="w-full h-12 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#00A389] text-[13.5px] font-bold flex items-center justify-center gap-2 border border-emerald-200 transition-all active:scale-[0.98] cursor-pointer"
                          >
                            <CheckCircle size={16} />
                            <span>Trả bàn về Trống</span>
                          </button>
                        </>
                      )}

                      {/* Nút Xem / In Mã QR Gọi Món Cho Bàn */}
                      <button
                        onClick={() => setQrTable(selected)}
                        className="w-full h-12 rounded-2xl bg-[#E6F7F4] hover:bg-[#D0F2EB] text-[#00A389] text-[13.5px] font-extrabold flex items-center justify-center border border-[#B6EADF] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <span>Mã QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          <div className="pt-4 border-t border-[#F1F5F9]">
              <button
                onClick={() => setSelected(null)}
                className="w-full h-11 rounded-2xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[13.5px] font-extrabold text-[#64748B] hover:text-[#0F172A] transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Bàn Mới */}
      {showAddTable && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-md w-full max-h-[92dvh] my-auto p-4 sm:p-6 shadow-2xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden modal-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E6F7F4] text-[#00A389] flex items-center justify-center font-bold">
                  <Armchair size={18} />
                </div>
                <div>
                  <h3 className="text-[17px] font-black text-[#0F172A]">Thêm bàn mới</h3>
                </div>
              </div>
              <button
                onClick={() => setShowAddTable(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-3.5 text-[13px] overflow-y-auto pr-1 flex-1 modal-body">
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
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-bold text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden"
                />
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
        tenantId={qrTable?.tenantId || user?.tenantId}
        branchId={qrTable?.branchId || (selectedBranchId !== 'ALL' ? selectedBranchId : user?.branchId)}
      />
    </div>
  );
}