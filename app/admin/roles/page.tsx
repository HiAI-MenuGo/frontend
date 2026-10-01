'use client';

import React, { useState } from 'react';
import { Users, Plus, Shield, Check, X, Lock } from 'lucide-react';
import apiFetch from '../../../lib/api';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'MANAGER' | 'KITCHEN' | 'CASHIER';
  branchName: string;
  isActive: boolean;
}

export default function AdminRolesPage() {
  const [users, setUsers] = useState<StaffUser[]>([
    { id: '1', name: 'Trần Hoàng Đạt', email: 'admin@menu-go.vn', phone: '0901234567', role: 'ADMIN', branchName: 'Tất cả chi nhánh', isActive: true },
    { id: '2', name: 'Lê Thanh Hải', email: 'manager@menu-go.vn', phone: '0912345678', role: 'MANAGER', branchName: 'Chi nhánh Quận 1', isActive: true },
    { id: '3', name: 'Nguyễn Thị Mai', email: 'cashier@menu-go.vn', phone: '0987654321', role: 'CASHIER', branchName: 'Chi nhánh Quận 1', isActive: true },
    { id: '4', name: 'Phạm Văn Bếp', email: 'kitchen@menu-go.vn', phone: '0933445566', role: 'KITCHEN', branchName: 'Chi nhánh Quận 1', isActive: true },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'KITCHEN' | 'CASHIER'>('CASHIER');

  const toggleUserActive = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u))
    );
  };

  const handleCreateUser = () => {
    if (!name || !email || !password) return;
    const newUser: StaffUser = {
      id: `u-${Date.now()}`,
      name,
      email,
      phone: phone || '0900000000',
      role,
      branchName: 'Chi nhánh Quận 1',
      isActive: true,
    };
    setUsers([...users, newUser]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            QUẢN TRỊ NHÂN SỰ & PHÂN QUYỀN VAI TRÒ (RBAC)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Thiết lập tài khoản nhân viên, gán chi nhánh và phân quyền bảo mật 5 tầng
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setName('');
            setEmail('');
            setPassword('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nhân Viên</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <h3 className="font-extrabold text-sm text-zinc-100">Danh Sách Nhân Sự Trong Quán</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-3">Họ Và Tên</th>
                <th className="py-3 px-3">Email Đăng Nhập</th>
                <th className="py-3 px-3">Số Điện Thoại</th>
                <th className="py-3 px-3">Chi Nhánh</th>
                <th className="py-3 px-3">Vai Trò (Role)</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-800/30">
                  <td className="py-3 px-3 font-bold text-zinc-100">{u.name}</td>
                  <td className="py-3 px-3 font-mono text-zinc-300">{u.email}</td>
                  <td className="py-3 px-3 text-zinc-400">{u.phone}</td>
                  <td className="py-3 px-3 text-zinc-300">{u.branchName}</td>
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
                      onClick={() => toggleUserActive(u.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition border ${
                        u.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                      } ${u.role === 'ADMIN' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {u.isActive ? 'HOẠT ĐỘNG' : 'TẠM KHÓA'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Permission Matrix Reference */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
        <h3 className="font-extrabold text-sm text-zinc-100 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-amber-500" />
          <span>Ma Trận Phân Quyền Vận Hành (RBAC Standard)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
            <span className="font-bold text-amber-400 uppercase text-[11px]">Chủ Quán (ADMIN)</span>
            <p className="text-zinc-400 text-[11px]">
              Toàn quyền cấu hình thực đơn, BOM, giá bán, nhân sự, tài khoản ngân hàng, báo cáo tổng thể.
            </p>
          </div>
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
            <span className="font-bold text-sky-400 uppercase text-[11px]">Quản Lý (MANAGER)</span>
            <p className="text-zinc-400 text-[11px]">
              Kiểm kê kho, xuất báo cáo ca Z-Report, giám sát nhân sự tại chi nhánh được giao.
            </p>
          </div>
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
            <span className="font-bold text-emerald-400 uppercase text-[11px]">Thu Ngân (CASHIER)</span>
            <p className="text-zinc-400 text-[11px]">
              Bán hàng POS, tạo đơn tại quầy, áp dụng voucher, thu tiền mặt / VietQR, in hóa đơn.
            </p>
          </div>
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5">
            <span className="font-bold text-purple-400 uppercase text-[11px]">Bếp (KITCHEN)</span>
            <p className="text-zinc-400 text-[11px]">
              Màn hình KDS, nhận đơn chế biến, đổi trạng thái món, bật/tắt báo hết món (sold out).
            </p>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-extrabold text-sm text-zinc-100">Thêm Tài Khoản Nhân Viên Mới</h3>
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
                <label className="text-zinc-300 font-semibold">Họ và tên</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn B"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold">Email đăng nhập</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@menu-go.vn"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold">Số điện thoại</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold">Mật khẩu ban đầu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold">Vai trò phụ trách</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                >
                  <option value="CASHIER">Thu Ngân (CASHIER)</option>
                  <option value="KITCHEN">Đầu Bếp / Pha Chế (KITCHEN)</option>
                  <option value="MANAGER">Quản Lý Ca / Chi Nhánh (MANAGER)</option>
                </select>
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
                onClick={handleCreateUser}
                className="px-4 py-2 bg-amber-500 font-bold text-zinc-950 rounded-xl shadow"
              >
                Tạo Tài Khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
