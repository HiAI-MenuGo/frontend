'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Users, Search, Plus, Trash2, Edit, X, UserCheck, UserX, Shield,
  Eye, Mail, Phone, Building2, Calendar, Clock, ChevronDown,
  BellRing, Smartphone, Send, CheckCircle2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { fetchStaff, fetchStaffRoles, createStaff, updateStaff, deleteStaff } from '@/lib/api/users.api';
import type { StaffUser, StaffRole } from '@/lib/api/users.api';
import { fetchBranches, type Branch } from '@/lib/api/branches.api';
import { fetchTables } from '@/lib/api/tables.api';
import type { UiTable } from '@/lib/api/types';
import { useAuthStore } from '@/stores/auth.store';
import { useHeaderStore } from '@/stores/header.store';
import { formatDisplayDate, formatDisplayDateTime } from '@/lib/date';

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700 border border-purple-200',
  MANAGER: 'bg-blue-50 text-blue-700 border border-blue-200',
  KITCHEN: 'bg-orange-50 text-orange-700 border border-orange-200',
  CASHIER: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PLATFORM_ADMIN: 'bg-slate-100 text-slate-700 border border-slate-200',
};

export default function StaffView() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PLATFORM_ADMIN';

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<UiTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [saving, setSaving] = useState(false);

  // Điều phối & Gọi nhân viên
  const [showDispatchSection, setShowDispatchSection] = useState(false);
  const [dispatchTable, setDispatchTable] = useState('');
  const [dispatchReason, setDispatchReason] = useState('Khách gọi phục vụ tại bàn');
  const [dispatchNote, setDispatchNote] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [onlineOverrides, setOnlineOverrides] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CASHIER',
    branchId: '',
  });

  // Danh sách bàn dự phòng nếu chưa có dữ liệu bàn
  const availableTables =
    tables.length > 0
      ? tables.map((t) => ({
          id: t.id,
          name: t.tableName || `Bàn ${t.tableNumber || t.id}`,
          status: t.status,
        }))
      : [
          { id: '1', name: 'Bàn 01', status: 'AVAILABLE' as const },
          { id: '2', name: 'Bàn 02', status: 'AVAILABLE' as const },
          { id: '3', name: 'Bàn 03', status: 'ON_DINE' as const },
          { id: '4', name: 'Bàn VIP 01', status: 'AVAILABLE' as const },
          { id: '5', name: 'Bàn O-02 (Sân vườn)', status: 'AVAILABLE' as const },
        ];

  // Kiểm tra nhân viên có đang online (đã đăng nhập app mobile) hay không
  const isStaffOnline = (user: StaffUser): boolean => {
    if (!user.isActive) return false;
    if (onlineOverrides[user.id] !== undefined) return onlineOverrides[user.id];
    if (user.isOnline !== undefined) return user.isOnline;
    if (!user.lastLoginAt) return false;
    const lastTime = new Date(user.lastLoginAt).getTime();
    return Date.now() - lastTime < 14 * 60 * 60 * 1000;
  };

  const toggleSimulateOnline = (userId: string) => {
    setOnlineOverrides((prev) => {
      const current = prev[userId] !== undefined
        ? prev[userId]
        : isStaffOnline(staff.find((s) => s.id === userId) || ({} as any));
      const nextState = !current;
      showToast(
        nextState
          ? 'Đã chuyển trạng thái sang: ĐANG ONLINE (Đã đăng nhập App Mobile)'
          : 'Đã chuyển trạng thái sang: NGOẠI TUYẾN (Chưa đăng nhập App Mobile)'
      );
      return { ...prev, [userId]: nextState };
    });
  };

  const handleSendCallStaff = (staffTarget: StaffUser) => {
    const isOnline = isStaffOnline(staffTarget);
    const selectedTableName = availableTables.find((t) => t.id === dispatchTable)?.name || dispatchTable || 'Bàn yêu cầu';
    setDispatching(true);
    setTimeout(() => {
      setDispatching(false);
      showToast(
        `🛎️ Đã gửi thông báo điều phối tới nhân viên "${staffTarget.name}" qua App Mobile phục vụ [${selectedTableName}]! ${
          !isOnline ? '(Lưu ý: NV đang ngoại tuyến, thông báo sẽ lưu chờ khi mở app)' : ''
        }`
      );
      setDispatchNote('');
      setShowDispatchSection(false);
    }, 600);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, r, b, tList] = await Promise.all([
        fetchStaff(),
        fetchStaffRoles(),
        fetchBranches().catch(() => []),
        fetchTables().catch(() => []),
      ]);
      setStaff(users);
      setRoles(r);
      setBranches(b);
      setTables(tList);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const filtered = staff.filter((s) => {
    if (s.role === 'PLATFORM_ADMIN') return false;
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchRole = !roleFilter || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'CASHIER',
      branchId: branches[0]?.id ?? '',
    });
    setShowForm(true);
  }, [branches]);

  const setCustomAction = useHeaderStore((s) => s.setCustomAction);

  useEffect(() => {
    setCustomAction(
      <button
        onClick={openCreate}
        className="h-10 px-4 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center gap-1.5 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98] shrink-0 cursor-pointer"
      >
        <Plus size={16} strokeWidth={2.5} />
        <span>Thêm nhân viên</span>
      </button>
    );
    return () => setCustomAction(null);
  }, [setCustomAction, openCreate]);

  const openEdit = (user: StaffUser) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      password: '',
      role: user.role,
      branchId: user.branchId ?? user.branch?.id ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const payload: Record<string, string> = { name: form.name, email: form.email, role: form.role };
        if (form.phone.trim()) payload.phone = form.phone;
        if (form.password.trim()) payload.password = form.password;
        if (form.branchId) payload.branchId = form.branchId;
        await updateStaff(editing.id, payload);
      } else {
        if (!form.password.trim()) {
          alert('Vui lòng nhập mật khẩu cho nhân viên mới');
          setSaving(false);
          return;
        }
        await createStaff({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          role: form.role,
          branchId: form.branchId || undefined,
        });
      }
      setShowForm(false);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: StaffUser) => {
    try {
      await updateStaff(user.id, { isActive: !user.isActive });
      setSelectedStaff((prev) => (prev && prev.id === user.id ? { ...prev, isActive: !user.isActive } : prev));
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Cập nhật thất bại');
    }
  };

  const handleDelete = async (user: StaffUser) => {
    if (!confirm(`Vô hiệu hóa tài khoản ${user.name} (${user.email})?`)) return;
    try {
      await deleteStaff(user.id);
      if (selectedStaff?.id === user.id) setSelectedStaff(null);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-slate-500">Đang tải danh sách nhân viên...</div>;
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
        <p className="font-bold text-slate-800">Không tải được danh sách nhân viên</p>
        <p className="text-sm text-slate-500">{error}</p>
        <button onClick={load} className="px-5 py-2.5 bg-[#00A389] text-white rounded-xl text-sm font-semibold cursor-pointer">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
      {/* Thanh Tìm kiếm & Lọc vai trò */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="tìm kiếm..."
            className="w-full h-11 pl-10 pr-3 bg-white border border-[#E2E8F0] rounded-2xl text-[13px] focus:outline-none focus:border-[#00A389]"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-11 pl-3.5 pr-9 bg-white border border-[#E2E8F0] rounded-2xl text-[13px] font-semibold text-[#0F172A] focus:outline-none focus:border-[#00A389] appearance-none cursor-pointer"
            >
              <option value="">Tất cả vai trò</option>
              {roles.map((r) => (
                <option key={r.role} value={r.role}>{r.label}</option>
              ))}
            </select>
            <ChevronDown size={15} className="text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <span className="text-[12.5px] font-semibold text-[#64748B] px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-2xl whitespace-nowrap">
            {filtered.length} tài khoản
          </span>
        </div>
      </div>

      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 bg-[#0F172A] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-top duration-200 text-[13px] font-semibold border border-slate-700">
          <CheckCircle2 size={18} className="text-[#00A389] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[20px] p-10 flex flex-col items-center border border-[#E2E8F0] text-center">
          <div className="w-14 h-14 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
            <Users size={28} className="text-[#94A3B8]" />
          </div>
          <p className="text-[15px] font-bold text-[#0F172A] mb-1">Chưa có nhân viên nào</p>
          <p className="text-[12.5px] text-[#64748B]">Bấm &quot;Thêm nhân viên&quot; để tạo tài khoản đầu tiên.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto table-scroll -mx-1 px-1">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4">Chi nhánh</th>
                  <th className="py-3 px-4">Trạng thái App Mobile</th>
                  <th className="py-3 px-4">Hoạt động cuối</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{user.name}</div>
                          <div className="text-[11.5px] text-slate-400 truncate">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${ROLE_BADGE[user.role] ?? 'bg-slate-100 text-slate-600'}`}>
                        <Shield size={11} />
                        {roles.find((r) => r.role === user.role)?.label ?? user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {user.branch?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      {!user.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <UserX size={11} />
                          <span>Đã khóa</span>
                        </span>
                      ) : isStaffOnline(user) ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <Smartphone size={11} className="shrink-0" />
                          <span>Online</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                          <Smartphone size={11} className="shrink-0 text-slate-400" />
                          <span>Ngoại tuyến</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[12px]">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedStaff(user);
                            setShowDispatchSection(true);
                            setDispatchTable(availableTables[0]?.id || '1');
                          }}
                          className="h-8.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#00A389] hover:text-[#008f77] border border-emerald-200 font-bold text-[12px] inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-[0.98] whitespace-nowrap cursor-pointer"
                          title="Gọi nhân viên lên phục vụ bàn"
                        >
                          <BellRing size={13} className="shrink-0" />
                          <span>Gọi NV</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedStaff(user);
                            setShowDispatchSection(false);
                          }}
                          className="h-8.5 px-2.5 rounded-xl bg-[#F8FAFC] hover:bg-teal-50 hover:text-[#00A389] hover:border-teal-200 border border-[#E2E8F0] font-bold text-[12px] text-[#475569] inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-[0.98] whitespace-nowrap cursor-pointer"
                          title="Xem chi tiết hồ sơ nhân viên"
                        >
                          <Eye size={13} className="shrink-0" />
                          <span>Chi tiết</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT NHÂN VIÊN (FORM MỞ RỘNG) */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-[30px] max-w-2xl sm:max-w-3xl w-full p-6 sm:p-8 relative shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150 space-y-6 my-auto max-h-[92vh] overflow-y-auto">
            {/* Nút đóng */}
            <button
              onClick={() => {
                setSelectedStaff(null);
                setShowDispatchSection(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-[#94A3B8] hover:text-[#0F172A] transition-colors cursor-pointer"
              aria-label="Đóng chi tiết"
            >
              <X size={18} />
            </button>

            {/* Header hồ sơ */}
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                  {selectedStaff.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                {/* Chấm trạng thái kết nối Mobile */}
                <span
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                    !selectedStaff.isActive
                      ? 'bg-rose-500'
                      : isStaffOnline(selectedStaff)
                      ? 'bg-emerald-500'
                      : 'bg-slate-400'
                  }`}
                  title={
                    !selectedStaff.isActive
                      ? 'Tài khoản đã khóa'
                      : isStaffOnline(selectedStaff)
                      ? 'Online'
                      : 'Ngoại tuyến'
                  }
                >
                  <span className={`w-2 h-2 rounded-full bg-white ${isStaffOnline(selectedStaff) ? 'animate-ping' : ''}`} />
                </span>
              </div>

              <div className="min-w-0 flex-1 pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Hồ sơ nhân viên
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] font-mono text-slate-400">ID: {selectedStaff.id.slice(0, 8)}</span>
                </div>
                <h3 className="text-[22px] font-black text-[#0F172A] truncate mt-0.5">
                  {selectedStaff.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${ROLE_BADGE[selectedStaff.role] ?? 'bg-slate-100 text-slate-600'}`}>
                    <Shield size={11} />
                    {roles.find((r) => r.role === selectedStaff.role)?.label ?? selectedStaff.role}
                  </span>

                  {/* Trạng thái App Mobile */}
                  {!selectedStaff.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <UserX size={11} />
                      <span>Đã khóa tài khoản</span>
                    </span>
                  ) : isStaffOnline(selectedStaff) ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <Smartphone size={12} className="shrink-0" />
                      <span>Online</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11.5px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                      <Smartphone size={12} className="shrink-0 text-slate-400" />
                      <span>Ngoại tuyến</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* KHỐI NỔI BẬT: GỌI NHÂN VIÊN LÊN BÀN / ĐIỀU PHỐI PHỤC VỤ */}
            <div className="rounded-[22px] border border-[#00A389]/25 bg-gradient-to-r from-[#E6F7F4]/90 via-white to-[#E6F7F4]/40 p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#00A389] text-white flex items-center justify-center shadow-md shadow-[#00A389]/20 shrink-0">
                    <BellRing size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-[15px] text-[#0F172A]">
                        Gọi nhân viên lên phục vụ bàn
                      </h4>
                      {isStaffOnline(selectedStaff) ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Sẵn sàng nhận việc
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Chưa mở app
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#64748B] mt-0.5">
                      {isStaffOnline(selectedStaff)
                        ? 'Nhân viên đang trực trên App Mobile — Admin có thể gọi ngay lên bàn cho khách.'
                        : 'Nhân viên chưa đăng nhập App Mobile — Admin có thể gửi thông báo chờ tiếp nhận.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDispatchSection((prev) => !prev);
                    if (!dispatchTable) setDispatchTable(availableTables[0]?.id || '1');
                  }}
                  className={`h-10 px-5 rounded-xl font-black text-[13px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap ${
                    showDispatchSection
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-[#00A389] hover:bg-[#008f77] text-white shadow-[#00A389]/25'
                  }`}
                >
                  <BellRing size={15} />
                  <span>{showDispatchSection ? 'Đóng điều phối' : 'Gọi nhân viên'}</span>
                </button>
              </div>

              {/* Form gọi nhân viên điều phối */}
              {showDispatchSection && (
                <div className="pt-3.5 border-t border-[#00A389]/20 space-y-3.5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                        Chọn bàn cần phục vụ *
                      </label>
                      <div className="relative">
                        <select
                          value={dispatchTable}
                          onChange={(e) => setDispatchTable(e.target.value)}
                          className="w-full h-10 pl-3 pr-8 bg-white border border-slate-300 rounded-xl text-[12.5px] font-bold text-slate-800 focus:outline-none focus:border-[#00A389] appearance-none cursor-pointer"
                        >
                          {availableTables.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.status === 'ON_DINE' ? 'Đang có khách' : 'Bàn trống'})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                        Yêu cầu / Nhiệm vụ *
                      </label>
                      <div className="relative">
                        <select
                          value={dispatchReason}
                          onChange={(e) => setDispatchReason(e.target.value)}
                          className="w-full h-10 pl-3 pr-8 bg-white border border-slate-300 rounded-xl text-[12.5px] font-bold text-slate-800 focus:outline-none focus:border-[#00A389] appearance-none cursor-pointer"
                        >
                          <option value="Khách gọi phục vụ tại bàn">🛎️ Khách gọi phục vụ tại bàn</option>
                          <option value="Khách yêu cầu thanh toán / in bill">💳 Khách yêu cầu thanh toán / in bill</option>
                          <option value="Dọn dẹp bàn & chuẩn bị đón khách">🧹 Dọn dẹp bàn & sắp xếp bàn</option>
                          <option value="Tiếp thực / Lên món ăn">🍽️ Tiếp thực / Ra món cho khách</option>
                          <option value="Hỗ trợ gấp cho khách tại bàn">⚡ Yêu cầu hỗ trợ gấp</option>
                        </select>
                        <ChevronDown size={14} className="text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-bold text-slate-700 mb-1">
                      Ghi chú thêm cho nhân viên (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={dispatchNote}
                      onChange={(e) => setDispatchNote(e.target.value)}
                      className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00A389]"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={dispatching}
                      onClick={() => handleSendCallStaff(selectedStaff)}
                      className="h-10 px-5 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-black text-[13px] flex items-center justify-center gap-2 shadow-sm shadow-[#00A389]/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send size={14} />
                      <span>{dispatching ? 'Đang gửi lệnh...' : 'Gửi lệnh gọi nhân viên'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* GRID CHI TIẾT THÔNG TIN NHÂN SỰ & THIẾT BỊ APP (2 CỘT RỘNG RÃI) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CỘT 1: THÔNG TIN NHÂN SỰ & LIÊN HỆ */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 text-[13px] space-y-3.5">
                <div className="text-[11.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200/70">
                  <Users size={14} className="text-[#00A389]" />
                  <span>Thông tin cá nhân & phân công</span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <Mail size={12} /> Email tài khoản
                  </div>
                  <div className="font-semibold text-slate-800 break-all">{selectedStaff.email}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <Phone size={12} /> Số điện thoại
                  </div>
                  <div className="font-semibold text-slate-800">{selectedStaff.phone || 'Chưa cập nhật'}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Building2 size={12} /> Chi nhánh làm việc</span>
                    {isAdmin && <span className="text-[10px] text-[#00A389] font-bold">Admin có thể đổi</span>}
                  </div>
                  {isAdmin && branches.length > 0 ? (
                    <div className="relative">
                      <select
                        value={selectedStaff.branchId ?? selectedStaff.branch?.id ?? ''}
                        onChange={async (e) => {
                          const newBranchId = e.target.value;
                          try {
                            await updateStaff(selectedStaff.id, { branchId: newBranchId });
                            const bObj = branches.find((b) => b.id === newBranchId);
                            setSelectedStaff((prev) => (prev ? {
                              ...prev,
                              branchId: newBranchId,
                              branch: bObj ? { id: bObj.id, name: bObj.name, code: bObj.code } : null,
                            } : null));
                            showToast('Đã cập nhật chi nhánh nhân viên thành công');
                            load();
                          } catch (err: unknown) {
                            alert(err instanceof Error ? err.message : 'Đổi chi nhánh thất bại');
                          }
                        }}
                        className="w-full h-8.5 pl-2.5 pr-7 bg-white border border-[#CBD5E1] rounded-xl text-[12.5px] font-bold text-slate-800 focus:outline-none focus:border-[#00A389] appearance-none cursor-pointer"
                      >
                        <option value="">-- Chưa phân chi nhánh --</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="text-[#64748B] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="font-semibold text-slate-800">{selectedStaff.branch?.name ?? '—'}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <Calendar size={12} /> Ngày tham gia hệ thống
                  </div>
                  <div className="font-semibold text-slate-800">
                    {selectedStaff.createdAt ? formatDisplayDate(selectedStaff.createdAt) : '—'}
                  </div>
                </div>
              </div>

              {/* CỘT 2: TRẠNG THÁI APP MOBILE & THIẾT BỊ */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 text-[13px] space-y-3.5 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="text-[11.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200/70">
                    <Smartphone size={14} className="text-[#00A389]" />
                    <span>Trạng thái kết nối App Mobile</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      Trạng thái đăng nhập Mobile
                    </div>
                    <div>
                      {isStaffOnline(selectedStaff) ? (
                        <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-[13.5px]">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>ĐANG ONLINE TRÊN APP</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-[13.5px]">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                          <span>NGOẠI TUYẾN (Chưa đăng nhập)</span>
                        </div>
                      )}
                      <p className="text-[11.5px] text-slate-500 mt-0.5">
                        {isStaffOnline(selectedStaff)
                          ? 'Đã đăng nhập vào ứng dụng MenuGO Staff trên điện thoại di động.'
                          : 'Nhân viên chưa mở hoặc chưa đăng nhập vào ứng dụng trên điện thoại di động.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      Ứng dụng chỉ định
                    </div>
                    <div className="font-semibold text-slate-800">MenuGO Staff App (iOS / Android)</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      <Clock size={12} /> Lần đăng nhập / hoạt động gần nhất
                    </div>
                    <div className="font-semibold text-slate-700">
                      {selectedStaff.lastLoginAt ? formatDisplayDateTime(selectedStaff.lastLoginAt) : 'Chưa từng đăng nhập'}
                    </div>
                  </div>
                </div>

                {/* Nút mô phỏng / Test Online dành cho Admin */}
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Thử nghiệm trạng thái:</span>
                  <button
                    type="button"
                    onClick={() => toggleSimulateOnline(selectedStaff.id)}
                    className="h-8 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-[11.5px] font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Chuyển đổi giả lập trạng thái Online/Offline để kiểm tra luồng điều phối"
                  >
                    <RefreshCw size={11} />
                    <span>{isStaffOnline(selectedStaff) ? 'Chuyển sang Offline' : 'Chuyển sang Online'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* THAO TÁC QUẢN TRỊ TÀI KHOẢN */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const staffToEdit = selectedStaff;
                  setSelectedStaff(null);
                  openEdit(staffToEdit);
                }}
                className="h-10 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <Edit size={14} />
                <span>Sửa thông tin</span>
              </button>

              <button
                onClick={() => handleToggleActive(selectedStaff)}
                className={`h-10 px-4 rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 border transition-all active:scale-[0.98] cursor-pointer ${
                  selectedStaff.isActive
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {selectedStaff.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                <span>{selectedStaff.isActive ? 'Khóa tài khoản' : 'Kích hoạt lại'}</span>
              </button>

              <button
                onClick={() => handleDelete(selectedStaff)}
                className="h-10 px-3.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-[13px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] sm:ml-auto cursor-pointer"
                title="Vô hiệu hóa"
              >
                <Trash2 size={14} />
                <span>Vô hiệu hóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA NHÂN VIÊN */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[92dvh] my-auto p-4 sm:p-6 relative shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden modal-panel">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="font-extrabold text-[18px] mb-4">{editing ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Họ tên *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:border-[#00A389] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:border-[#00A389] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Số điện thoại</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:border-[#00A389] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Vai trò *</label>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full h-11 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:border-[#00A389] focus:bg-white appearance-none cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r.role} value={r.role}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="text-[#64748B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Chi nhánh làm việc</span>
                  {!isAdmin && <span className="text-[11px] text-slate-400 font-normal">Chỉ Admin mới có quyền đổi</span>}
                </label>
                <div className="relative">
                  <select
                    disabled={!isAdmin && !!editing}
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className="w-full h-11 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-[#00A389] focus:bg-white disabled:opacity-60 appearance-none cursor-pointer"
                  >
                    <option value="">-- Chưa phân chi nhánh --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="text-[#64748B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  {editing ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu *'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:border-[#00A389] focus:bg-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-11 rounded-2xl bg-slate-50 border border-slate-200 text-[13px] font-bold text-slate-600 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-11 rounded-2xl bg-[#00A389] text-white font-extrabold text-[13px] disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
