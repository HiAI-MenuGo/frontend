'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Eye, EyeOff, Clock, X } from 'lucide-react';
import { loginApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Popup thông báo khi phiên đăng nhập / access token hết hạn
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [expiredMessage, setExpiredMessage] = useState(
    'Phiên làm việc hoặc access token của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục làm việc.'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Phục hồi thông tin đã lưu nếu người dùng từng bật "Lưu đăng nhập"
      const savedEmail =
        localStorage.getItem('hiai_saved_email') || localStorage.getItem('saved_email');
      const isRemember =
        localStorage.getItem('hiai_remember_me') === 'true' ||
        localStorage.getItem('remember_me') === 'true';

      if (savedEmail) {
        setEmail(savedEmail);
      }
      setRememberMe(isRemember);

      // 2. Kiểm tra nếu được chuyển hướng về trang login do hết hạn access token (401 hoặc JWT exp)
      const params = new URLSearchParams(window.location.search);
      const isExpiredParam =
        params.get('expired') === '1' || params.get('reason') === 'expired';
      const savedReason = sessionStorage.getItem('auth_expired_reason');

      if (isExpiredParam || savedReason) {
        if (savedReason) {
          setExpiredMessage(savedReason);
          sessionStorage.removeItem('auth_expired_reason');
        }
        setShowExpiredModal(true);

        // Làm sạch query param trên URL
        const url = new URL(window.location.href);
        url.searchParams.delete('expired');
        url.searchParams.delete('reason');
        window.history.replaceState(
          {},
          '',
          url.pathname + (url.search ? '?' + url.searchParams.toString() : '')
        );
      }
    }
  }, []);

  // Tự động tắt thanh thông báo sau 8 giây nếu người dùng không bấm đóng
  useEffect(() => {
    if (showExpiredModal) {
      const timer = setTimeout(() => {
        setShowExpiredModal(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showExpiredModal]);

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

      // Lưu hoặc xóa thông tin đăng nhập theo lựa chọn của người dùng
      if (typeof window !== 'undefined') {
        if (rememberMe) {
          localStorage.setItem('hiai_saved_email', email.trim());
          localStorage.setItem('hiai_remember_me', 'true');
        } else {
          localStorage.removeItem('hiai_saved_email');
          localStorage.removeItem('hiai_remember_me');
          localStorage.removeItem('saved_email');
          localStorage.removeItem('remember_me');
        }
      }

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
      <div className="w-full max-w-md bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm p-8 relative">
        <h1 className="text-[22px] font-black text-[#0F172A] text-center">Đăng nhập</h1>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhap@email.com"
                className="w-full h-11 pl-10 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] font-medium focus:outline-hidden focus:border-[#00A389] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full h-11 pl-10 pr-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] font-medium focus:outline-hidden focus:border-[#00A389] focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Tính năng Lưu đăng nhập */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-md border-slate-300 text-[#00A389] accent-[#00A389] focus:ring-[#00A389] cursor-pointer"
              />
              <span className="text-[12.5px] font-bold text-[#475569] group-hover:text-[#0F172A] transition-colors">
                Lưu đăng nhập
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-[12.5px] font-semibold text-[#DC2626]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[14px] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            <LogIn size={16} />
            <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
          </button>
        </form>

        <p className="text-center text-[11px] text-[#94A3B8] mt-6">powered by HiAI</p>
      </div>

      {/* Thanh thông báo nhỏ góc trên bên phải khi phiên đăng nhập / Access Token hết hạn */}
      {showExpiredModal && (
        <aside
          role="alert"
          aria-live="assertive"
          className="fixed top-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] sm:w-[380px] bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl shadow-slate-900/10 border border-amber-200/90 flex items-start gap-3 animate-in slide-in-from-top-3 fade-in duration-200 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Clock size={18} />
          </div>

          <div className="flex-1 min-w-0 pr-1 text-left">
            <h4 className="text-[13.5px] font-bold text-[#0F172A] leading-tight">
              Phiên đăng nhập đã hết hạn
            </h4>
            <p className="text-[12px] text-[#64748B] mt-1 leading-relaxed font-medium">
              {expiredMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowExpiredModal(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer shrink-0"
            title="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </aside>
      )}
    </div>
  );
}
