'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  Users,
  CreditCard,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import apiFetch from '../../lib/api';

interface TenantOverview {
  id: string;
  code: string;
  name: string;
  ownerEmail: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED';
  branchesCount: number;
  usersCount: number;
  createdAt: string;
}

export default function PlatformAdminPage() {
  const [stats, setStats] = useState({
    totalTenants: 12,
    activeTenants: 11,
    suspendedTenants: 1,
    monthlySaaSRevenue: 34500000,
  });

  const [tenants, setTenants] = useState<TenantOverview[]>([
    {
      id: 't-1',
      code: 'MENUGO_DEMO',
      name: 'Nhà Hàng Mẫu HiAI-MenuGo',
      ownerEmail: 'admin@menu-go.vn',
      plan: 'PRO',
      status: 'ACTIVE',
      branchesCount: 3,
      usersCount: 14,
      createdAt: '15/08/2026',
    },
    {
      id: 't-2',
      code: 'THE_COFFEE_HOUSE_Q1',
      name: 'The Coffee Space Flagship',
      ownerEmail: 'contact@coffeespace.vn',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      branchesCount: 5,
      usersCount: 28,
      createdAt: '02/09/2026',
    },
    {
      id: 't-3',
      code: 'PHO_VIET_TRUYEN_THONG',
      name: 'Phở Việt Gia Truyền 1985',
      ownerEmail: 'phoviet1985@gmail.com',
      plan: 'STARTER',
      status: 'ACTIVE',
      branchesCount: 1,
      usersCount: 6,
      createdAt: '20/09/2026',
    },
  ]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newPlan, setNewPlan] = useState<'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'>('PRO');

  const handleOnboardTenant = async () => {
    if (!newCode || !newName || !newEmail) return;

    try {
      await apiFetch('/platform-admin/tenants', {
        method: 'POST',
        body: JSON.stringify({
          code: newCode.toUpperCase(),
          name: newName,
          ownerEmail: newEmail,
          ownerPassword: newPassword,
          plan: newPlan,
        }),
      });

      const newT: TenantOverview = {
        id: `t-${Date.now()}`,
        code: newCode.toUpperCase(),
        name: newName,
        ownerEmail: newEmail,
        plan: newPlan,
        status: 'ACTIVE',
        branchesCount: 1,
        usersCount: 1,
        createdAt: 'Hôm nay',
      };

      setTenants([newT, ...tenants]);
      setIsModalOpen(false);
    } catch {
      // fallback
    }
  };

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Platform Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 flex items-center justify-center font-black">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              QUẢN TRỊ NỀN TẢNG SAAS (SUPER ADMIN)
            </h1>
            <p className="text-xs text-zinc-400">
              Quản trị vòng đời khách thuê (Tenants), gói cước dịch vụ và bảo mật cô lập dữ liệu
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewCode('');
            setNewName('');
            setNewEmail('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Tenant Quán Mới</span>
        </button>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <span className="text-xs text-zinc-400 font-medium">Tổng khách thuê (Tenants)</span>
          <p className="text-2xl font-black text-zinc-100 mt-1">{stats.totalTenants}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <span className="text-xs text-zinc-400 font-medium">Tenants Đang Hoạt Động</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{stats.activeTenants}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <span className="text-xs text-zinc-400 font-medium">Doanh thu SaaS Định Kỳ (MRR)</span>
          <p className="text-2xl font-black text-amber-400 mt-1">
            {stats.monthlySaaSRevenue.toLocaleString('vi-VN')}đ
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <span className="text-xs text-zinc-400 font-medium">Cô Lập Dữ Liệu Multi-Tenant</span>
          <p className="text-2xl font-black text-sky-400 mt-1">100% Strict</p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-extrabold text-sm text-zinc-100">Danh Sách Các Quán Ăn Thuê Nền Tảng</h3>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên quán, code, email..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-3">Tên Thương Hiệu</th>
                <th className="py-3 px-3">Mã Code</th>
                <th className="py-3 px-3">Chủ Quán (Email)</th>
                <th className="py-3 px-3">Gói Cước</th>
                <th className="py-3 px-3">Chi Nhánh</th>
                <th className="py-3 px-3">Nhân Sự</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
                <th className="py-3 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/30">
                  <td className="py-3 px-3 font-bold text-zinc-100">{t.name}</td>
                  <td className="py-3 px-3 font-mono text-amber-400">{t.code}</td>
                  <td className="py-3 px-3 text-zinc-300">{t.ownerEmail}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {t.plan}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-zinc-300">{t.branchesCount} chi nhánh</td>
                  <td className="py-3 px-3 text-zinc-300">{t.usersCount} tài khoản</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/admin/dashboard`}
                      className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Vào Quán</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Tenant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-zinc-100">
              Khởi Tạo Quán Mới & Onboarding Chủ Quán
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold">Tên Quán Ăn / Thương Hiệu</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Cà Phê Mộc Sài Gòn"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold">Mã Code Duy Nhất (In hoa, không dấu)</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="CAPHE_MOC"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold">Email Chủ Quán (ADMIN)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="chuquan@gmail.com"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold">Mật khẩu ban đầu</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold">Gói Dịch Vụ SaaS</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as any)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                >
                  <option value="STARTER">STARTER (1 Chi nhánh, 5 nhân viên)</option>
                  <option value="PRO">PRO (5 Chi nhánh, 25 nhân viên, Đầy đủ tính năng)</option>
                  <option value="ENTERPRISE">ENTERPRISE (Không giới hạn)</option>
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
                onClick={handleOnboardTenant}
                className="px-4 py-2 bg-amber-500 font-bold text-zinc-950 rounded-xl shadow"
              >
                Khởi Tạo Quán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
