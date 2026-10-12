'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Users, Search, Plus, Trash2, Edit, X, UserCheck, UserX, Shield,
  Eye, Mail, Phone, Building2, Calendar, Clock, ChevronDown,
  CheckCircle2, BellRing, Send,
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

const ROLE_FALLBACK_LABELS: Record<string, string> = {
  ADMIN: 'Chủ quán',
  MANAGER: 'Quản lý chi nhánh',
  KITCHEN: 'Bếp / pha chế',
  CASHIER: 'Nhân viên',
  PLATFORM_ADMIN: 'Quản trị hệ thống',
};

export default function StaffView() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PLATFORM_ADMIN';

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const getRoleLabel = (role: string) => {
    return roles.find((r) => r.role === role)?.label || ROLE_FALLBACK_LABELS[role] || role;
  };

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CASHIER',
    branchId: '',
  });

  const [callStaffTarget, setCallStaffTarget] = useState<StaffUser | null>(null);
  const [dispatchTable, setDispatchTable] = useState('Bàn 01');
  const [dispatchReason, setDispatchReason] = useState('Khách gọi phục vụ tại bàn');
  const [dispatchNote, setDispatchNote] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [tablesList, setTablesList] = useState<UiTable[]>([]);

  const openCallStaff = (target: StaffUser) => {
    setCallStaffTarget(target);
    if (tablesList.length > 0) {
      setDispatchTable(tablesList[0].tableName);
    }
    setDispatchReason('Khách gọi phục vụ tại bàn');
    setDispatchNote('');
  };

  const handleConfirmCallStaff = () => {
    if (!callStaffTarget) return;
    setDispatching(true);
    setTimeout(() => {
      setDispatching(false);
      showToast(`🛎️ Đã gửi thông báo gọi nhân viên "${callStaffTarget.name}" phục vụ [${dispatchTable}]!`);
      setCallStaffTarget(null);
    }, 450);
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
      setTablesList(tList);
      if (tList.length > 0) {
        setDispatchTable(tList[0].tableName);
      }
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
                  <th className="py-3 px-4">Trạng thái</th>
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
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {user.branch?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Đang hoạt động</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <UserX size={11} />
                          <span>Đã khóa</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[12px]">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openCallStaff(user)}
                          className="h-8.5 px-3 rounded-xl bg-teal-50 hover:bg-[#00A389] text-[#00A389] hover:text-white border border-teal-200 font-bold text-[12px] inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-[0.98] whitespace-nowrap cursor-pointer"
                          title="Gọi nhân viên phục vụ bàn"
                        >
                          <BellRing size={13} className="shrink-0" />
                          <span>Gọi NV</span>
                        </button>
                        <button
                          onClick={() => setSelectedStaff(user)}
                          className="h-8.5 px-3 rounded-xl bg-[#F8FAFC] hover:bg-teal-50 hover:text-[#00A389] hover:border-teal-200 border border-[#E2E8F0] font-bold text-[12px] text-[#475569] inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-[0.98] whitespace-nowrap cursor-pointer"
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
              onClick={() => setSelectedStaff(null)}
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
                {/* Chấm trạng thái hoạt động */}
                <span
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                    selectedStaff.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  title={selectedStaff.isActive ? 'Đang hoạt động' : 'Tài khoản đã khóa'}
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
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
                    {getRoleLabel(selectedStaff.role)}
                  </span>

                  {/* Trạng thái tài khoản */}
                  {selectedStaff.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>Đang hoạt động</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <UserX size={11} />
                      <span>Đã khóa tài khoản</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* THÔNG TIN CHI TIẾT NHÂN SỰ */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 text-[13px] space-y-4">
              <div className="text-[11.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200/70">
                <Users size={14} className="text-[#00A389]" />
                <span>Thông tin cá nhân & phân công</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="space-y-1 sm:col-span-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <Clock size={12} /> Lần đăng nhập gần nhất
                  </div>
                  <div className="font-semibold text-slate-700">
                    {selectedStaff.lastLoginAt ? formatDisplayDateTime(selectedStaff.lastLoginAt) : 'Chưa từng đăng nhập'}
                  </div>
                </div>
              </div>
            </div>

            {/* THAO TÁC QUẢN TRỊ TÀI KHOẢN */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => openCallStaff(selectedStaff)}
                className="h-10 px-4 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                <BellRing size={14} />
                <span>Gọi nhân viên</span>
              </button>

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
      {/* MODAL GỌI NHÂN VIÊN PHỤC VỤ (ĐIỀU PHỐI TINH GỌN, KHÔNG CÓ BANNER CỒNG KỀNH) */}
      {callStaffTarget && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150 space-y-4 my-auto">
            <button
              onClick={() => setCallStaffTarget(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2 text-[#00A389] text-[12px] font-black uppercase tracking-wider mb-1">
                <BellRing size={14} />
                <span>Gọi nhân viên phục vụ</span>
              </div>
              <h3 className="font-extrabold text-[18px] text-[#0F172A]">
                {callStaffTarget.name}
              </h3>
              <p className="text-[12px] text-slate-500">
                Gửi thông báo điều phối trực tiếp tới nhân viên phục vụ tại bàn.
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  Chọn bàn cần phục vụ *
                </label>
                <div className="relative">
                  <select
                    value={dispatchTable}
                    onChange={(e) => setDispatchTable(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-800 focus:outline-none focus:border-[#00A389] appearance-none cursor-pointer"
                  >
                    {tablesList.length > 0 ? (
                      tablesList.map((t) => (
                        <option key={t.id} value={t.tableName}>
                          {t.tableName} ({t.status === 'ON_DINE' ? 'Đang có khách' : 'Bàn trống'})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Bàn 01">Bàn 01 (Bàn trống)</option>
                        <option value="Bàn 02">Bàn 02 (Đang có khách)</option>
                        <option value="Bàn 03">Bàn 03 (Bàn trống)</option>
                        <option value="Bàn VIP 01">Bàn VIP 01</option>
                      </>
                    )}
                  </select>
                  <ChevronDown size={16} className="text-[#64748B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  Nhiệm vụ / Yêu cầu *
                </label>
                <div className="relative">
                  <select
                    value={dispatchReason}
                    onChange={(e) => setDispatchReason(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-800 focus:outline-none focus:border-[#00A389] appearance-none cursor-pointer"
                  >
                    <option value="Khách gọi phục vụ tại bàn">🛎️ Khách gọi phục vụ tại bàn</option>
                    <option value="Khách yêu cầu thanh toán / in bill">💳 Khách yêu cầu thanh toán / in bill</option>
                    <option value="Dọn dẹp bàn & chuẩn bị đón khách">🧹 Dọn dẹp bàn & sắp xếp bàn</option>
                    <option value="Tiếp thực / Lên món ăn">🍽️ Tiếp thực / Ra món cho khách</option>
                    <option value="Hỗ trợ gấp cho khách tại bàn">⚡ Yêu cầu hỗ trợ gấp</option>
                  </select>
                  <ChevronDown size={16} className="text-[#64748B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">
                  Ghi chú thêm (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                  placeholder="Ví dụ: Khách gọi thêm đá, lấy thêm chén..."
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:border-[#00A389]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCallStaffTarget(null)}
                className="flex-1 h-11 rounded-2xl bg-slate-50 border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={dispatching}
                onClick={handleConfirmCallStaff}
                className="flex-1 h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <Send size={14} />
                <span>{dispatching ? 'Đang gửi...' : 'Gửi lệnh gọi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
