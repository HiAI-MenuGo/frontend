'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Users, Search, Plus, Trash2, Edit, X, UserCheck, UserX, Shield,
  Eye, Mail, Phone, Building2, Calendar, Clock, ChevronDown,
} from 'lucide-react';
import { fetchStaff, fetchStaffRoles, createStaff, updateStaff, deleteStaff } from '@/lib/api/users.api';
import type { StaffUser, StaffRole } from '@/lib/api/users.api';
import { fetchBranches, type Branch } from '@/lib/api/branches.api';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CASHIER',
    branchId: '',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, r, b] = await Promise.all([
        fetchStaff(),
        fetchStaffRoles(),
        fetchBranches().catch(() => []),
      ]);
      setStaff(users);
      setRoles(r);
      setBranches(b);
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
            placeholder="Tìm theo tên hoặc email..."
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
          <div className="overflow-x-auto">
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
                        {roles.find((r) => r.role === user.role)?.label ?? user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {user.branch?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {user.isActive ? <UserCheck size={11} /> : <UserX size={11} />}
                        {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[12px]">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedStaff(user)}
                        className="h-8.5 px-3 rounded-xl bg-[#F8FAFC] hover:bg-teal-50 hover:text-[#00A389] hover:border-teal-200 border border-[#E2E8F0] font-bold text-[12px] text-[#475569] inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-[0.98] whitespace-nowrap cursor-pointer"
                        title="Xem chi tiết nhân viên"
                      >
                        <Eye size={13} className="shrink-0" />
                        <span>Chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT NHÂN VIÊN */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[26px] max-w-lg w-full p-6 sm:p-7 relative shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150 space-y-6">
            {/* Nút đóng */}
            <button
              onClick={() => setSelectedStaff(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-[#94A3B8] hover:text-[#0F172A] transition-colors cursor-pointer"
              aria-label="Đóng chi tiết"
            >
              <X size={18} />
            </button>

            {/* Header hồ sơ */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
                {selectedStaff.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Hồ sơ nhân viên
                </span>
                <h3 className="text-[19px] font-black text-[#0F172A] truncate mt-0.5">
                  {selectedStaff.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${ROLE_BADGE[selectedStaff.role] ?? 'bg-slate-100 text-slate-600'}`}>
                    <Shield size={11} />
                    {roles.find((r) => r.role === selectedStaff.role)?.label ?? selectedStaff.role}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${selectedStaff.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                    {selectedStaff.isActive ? <UserCheck size={11} /> : <UserX size={11} />}
                    {selectedStaff.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </div>
              </div>
            </div>

            {/* Chi tiết thông tin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-[13px]">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Mail size={12} /> Email
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
                  <span className="flex items-center gap-1.5"><Building2 size={12} /> Chi nhánh</span>
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
                  <Calendar size={12} /> Ngày tham gia
                </div>
                <div className="font-semibold text-slate-800">
                  {selectedStaff.createdAt ? formatDisplayDate(selectedStaff.createdAt) : '—'}
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-1 border-t border-slate-200/60">
                <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                  <Clock size={12} /> Hoạt động lần cuối
                </div>
                <div className="font-semibold text-slate-700">
                  {selectedStaff.lastLoginAt ? formatDisplayDateTime(selectedStaff.lastLoginAt) : 'Chưa đăng nhập'}
                </div>
              </div>
            </div>

            {/* Thao tác tác vụ */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  const staffToEdit = selectedStaff;
                  setSelectedStaff(null);
                  openEdit(staffToEdit);
                }}
                className="h-10 px-4 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98] cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="font-extrabold text-[18px] mb-1">{editing ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}</h3>
            <p className="text-[12px] text-slate-500 mb-5">
              {editing ? 'Cập nhật thông tin, vai trò hoặc đặt lại mật khẩu.' : 'Tạo tài khoản để nhân viên đăng nhập vào hệ thống.'}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Họ tên *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
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
                  placeholder="nhanvien@email.com"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:border-[#00A389] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Số điện thoại</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="09xx xxx xxx"
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
                  placeholder={editing ? 'Để trống nếu giữ nguyên' : 'Ít nhất 6 ký tự'}
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
