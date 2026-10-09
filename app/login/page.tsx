'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await loginApi(email.trim(), password);
      setAuth(
        {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role as 'ADMIN' | 'MANAGER' | 'KITCHEN' | 'CASHIER' | 'PLATFORM_ADMIN',
          tenantId: result.user.tenantId,
          branchId: result.user.branchId,
        },
        result.accessToken
      );
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F6F8] px-4">
      <div className="w-full max-w-md bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm p-8">
        <h1 className="text-[22px] font-black text-[#0F172A] text-center">Đăng nhập</h1>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhap@email.com"
                className="w-full h-11 pl-10 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] focus:outline-none focus:border-[#00A389] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full h-11 pl-10 pr-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] focus:outline-none focus:border-[#00A389] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-[12.5px] font-semibold text-[#DC2626]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn size={16} />
            <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
          </button>
        </form>

        <p className="text-center text-[11px] text-[#94A3B8] mt-6">powered by HiAI</p>
      </div>
    </div>
  );
}
