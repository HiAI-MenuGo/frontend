'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Shield, Check, X, Lock, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import apiFetch from '../../../lib/api';
import { useI18n } from '../../../context/i18nContext';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'KITCHEN' | 'CASHIER' | 'PLATFORM_ADMIN';
  branchId?: string | null;
  branchName?: string;
  isActive: boolean;
  createdAt?: string;
}

export default function AdminRolesPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'KITCHEN' | 'CASHIER'>('CASHIER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<StaffUser[]>('/admin/users');
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setError(res.message || t('roles.errorLoading', 'Không thể tải danh sách nhân viên'));
      }
    } catch {
      setError(t('errors.network', 'Lỗi kết nối khi tải danh sách nhân sự'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserActive = async (id: string, currentStatus: boolean, userRole: string) => {
    if (userRole === 'ADMIN') return;
    try {
      const nextStatus = !currentStatus;
      // Optimistic
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: nextStatus } : u))
      );

      const res = await apiFetch(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (!res.success) {
        // Rollback + báo lỗi để user biết thao tác chưa được lưu
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, isActive: currentStatus } : u))
        );
        setActionError(res.message || t('roles.statusFailed', 'Đổi trạng thái nhân viên thất bại — đã hoàn tác.'));
        setTimeout(() => setActionError(null), 4000);
      }
    } catch {
      // Rollback
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: currentStatus } : u))
      );
      setActionError(t('errors.network', 'Lỗi kết nối — đổi trạng thái nhân viên thất bại, đã hoàn tác.'));
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const handleCreateUser = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim() || undefined,
          role,
        }),
      });

      if (res.success) {
        setMessage(`${t('roles.createSuccess', 'Đã tạo tài khoản cho nhân viên')} ${name} ${t('common.success', 'thành công')}`);
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        fetchUsers();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setActionError(res.message || t('roles.createFailed', 'Không thể tạo tài khoản'));
      }
    } catch {
      setActionError(t('errors.network', 'Lỗi kết nối khi tạo tài khoản nhân viên'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            {t('roles.title', 'QUẢN TRỊ NHÂN SỰ & PHÂN QUYỀN VAI TRÒ (RBAC)')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('roles.subtitle', 'Thiết lập tài khoản nhân viên, gán chi nhánh và phân quyền bảo mật 5 tầng')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setName('');
            setEmail('');
            setPassword('');
            setPhone('');
            setActionError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{t('roles.addStaff', 'Thêm Nhân Viên')}</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-red-400 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-400 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-zinc-100">
            {t('roles.staffListTitle', 'Danh Sách Nhân Sự Trong Quán')} ({users.length} {t('roles.accounts', 'tài khoản')})
          </h3>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition disabled:opacity-50"
            title={t('common.refresh', 'Làm mới')}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-zinc-950/60 border border-zinc-800/80 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-xs text-zinc-300 font-semibold">{error}</p>
            <button
              type="button"
              onClick={fetchUsers}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-xl inline-flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('common.retry', 'Thử lại')}</span>
            </button>
          </div>
        ) : users.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="font-bold text-zinc-300 text-sm">{t('roles.empty', 'Chưa có tài khoản nhân sự')}</p>
            <p className="text-xs text-zinc-500">
              {t('roles.emptyDesc', 'Nhấn nút "Thêm Nhân Viên" để tạo tài khoản phân quyền đầu tiên.')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-3">{t('roles.colFullName', 'Họ Và Tên')}</th>
                  <th className="py-3 px-3">{t('roles.colEmail', 'Email Đăng Nhập')}</th>
                  <th className="py-3 px-3">{t('roles.colPhone', 'Số Điện Thoại')}</th>
                  <th className="py-3 px-3">{t('roles.colRole', 'Vai Trò (Role)')}</th>
                  <th className="py-3 px-3 text-center">{t('roles.colStatus', 'Trạng Thái')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-3 font-bold text-zinc-100">{u.name}</td>
                    <td className="py-3 px-3 font-mono text-zinc-300">{u.email}</td>
                    <td className="py-3 px-3 text-zinc-400">{u.phone || t('roles.notUpdated', 'Chưa cập nhật')}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : u.role === 'MANAGER'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                            : u.role === 'KITCHEN'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        disabled={u.role === 'ADMIN'}
                        onClick={() => toggleUserActive(u.id, u.isActive, u.role)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition border ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                        } ${u.role === 'ADMIN' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                      >
                        {u.isActive ? t('roles.active', 'HOẠT ĐỘNG') : t('roles.locked', 'TẠM KHÓA')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RBAC Permission Matrix Reference */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
        <h3 className="font-extrabold text-sm text-zinc-100 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-amber-500" />
          <span>{t('roles.matrixTitle', 'Ma Trận Phân Quyền Vận Hành (RBAC Standard)')}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
            <span className="font-bold text-amber-400 uppercase text-[11px]">{t('roles.roleAdminTitle', 'Chủ Quán (ADMIN)')}</span>
            <p className="text-zinc-400 text-[11px]">
              {t('roles.roleAdminDesc', 'Toàn quyền cấu hình thực đơn, BOM, giá bán, nhân sự, tài khoản ngân hàng, báo cáo tổng thể.')}
            </p>
          </div>
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
            <span className="font-bold text-sky-400 uppercase text-[11px]">{t('roles.roleManagerTitle', 'Quản Lý (MANAGER)')}</span>
            <p className="text-zinc-400 text-[11px]">
              {t('roles.roleManagerDesc', 'Kiểm kê kho, xuất báo cáo ca Z-Report, giám sát nhân sự tại chi nhánh được giao.')}
            </p>
          </div>
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
            <span className="font-bold text-emerald-400 uppercase text-[11px]">{t('roles.roleCashierTitle', 'Thu Ngân (CASHIER)')}</span>
            <p className="text-zinc-400 text-[11px]">
              {t('roles.roleCashierDesc', 'Bán hàng POS, tạo đơn tại quầy, áp dụng voucher, thu tiền mặt / VietQR, in hóa đơn.')}
            </p>
          </div>
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
            <span className="font-bold text-purple-400 uppercase text-[11px]">{t('roles.roleKitchenTitle', 'Bếp (KITCHEN)')}</span>
            <p className="text-zinc-400 text-[11px]">
              {t('roles.roleKitchenDesc', 'Màn hình KDS, nhận đơn chế biến, đổi trạng thái món, bật/tắt báo hết món (sold out).')}
            </p>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-extrabold text-sm text-zinc-100">{t('roles.modalTitle', 'Thêm Tài Khoản Nhân Viên Mới')}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-300">{t('roles.nameLabel', 'Họ và tên')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vd: Nguyễn Văn A"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-300">{t('roles.emailLabel', 'Email đăng nhập')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhanvien@menu-go.vn"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-300">{t('roles.phoneLabel', 'Số điện thoại')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-300">{t('roles.passwordLabel', 'Mật khẩu khởi tạo')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-300">{t('roles.roleLabel', 'Vai trò (Role)')}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                >
                  <option value="CASHIER">CASHIER — Nhân viên Thu Ngân POS</option>
                  <option value="KITCHEN">KITCHEN — Nhân viên Bếp / Bar KDS</option>
                  <option value="MANAGER">MANAGER — Quản Lý Ca Chi Nhánh</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
              >
                {t('common.cancel', 'Hủy')}
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={isSubmitting || !name.trim() || !email.trim() || !password.trim()}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? t('common.creating', 'Đang tạo...') : t('roles.createAccount', 'Tạo Tài Khoản')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
