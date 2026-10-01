'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Palette, Save, Image as ImageIcon, Wifi, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import apiFetch from '../../../../lib/api';

interface BrandingData {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  footerText?: string;
}

export default function AdminBrandingPage() {
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#f59e0b');
  const [secondaryColor, setSecondaryColor] = useState('#d97706');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [footerText, setFooterText] = useState('Cảm ơn Quý Khách & Hẹn Gặp Lại!');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchBranding = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<BrandingData>('/branding');
      if (res.success && res.data) {
        const d = res.data;
        if (d.logoUrl) setLogoUrl(d.logoUrl);
        if (d.bannerUrl) setBannerUrl(d.bannerUrl);
        if (d.primaryColor) setPrimaryColor(d.primaryColor);
        if (d.secondaryColor) setSecondaryColor(d.secondaryColor);
        if (d.wifiSsid) setWifiSsid(d.wifiSsid);
        if (d.wifiPassword) setWifiPassword(d.wifiPassword);
        if (d.footerText) setFooterText(d.footerText);
      }
    } catch {
      setError('Lỗi kết nối khi tải nhận diện thương hiệu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await apiFetch('/branding', {
        method: 'PUT',
        body: JSON.stringify({
          logoUrl: logoUrl.trim() || undefined,
          bannerUrl: bannerUrl.trim() || undefined,
          primaryColor,
          secondaryColor,
          wifiSsid: wifiSsid.trim() || undefined,
          wifiPassword: wifiPassword.trim() || undefined,
          footerText: footerText.trim() || undefined,
        }),
      });

      if (res.success) {
        setSuccessMessage('Đã lưu cấu hình nhận diện thương hiệu vào hệ thống!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        alert(res.message || 'Không thể lưu cấu hình branding');
      }
    } catch {
      alert('Lỗi kết nối khi lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            NHẬN DIỆN THƯƠNG HIỆU & GIAO DIỆN QUÁN
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Tùy biến logo, màu sắc chủ đạo, ảnh bìa và thông tin wifi hiển thị trên toàn bộ QR Menu & POS
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBranding}
          disabled={isLoading}
          className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition disabled:opacity-50"
          title="Tải lại"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-400 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={fetchBranding} className="underline font-bold">Thử lại</button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6 animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-40" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-zinc-950/60 rounded-2xl border border-zinc-800/80" />
            <div className="h-20 bg-zinc-950/60 rounded-2xl border border-zinc-800/80" />
          </div>
          <div className="h-24 bg-zinc-950/60 rounded-2xl border border-zinc-800/80" />
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
          {/* Colors Section */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-zinc-200 flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>Bảng Màu Thương Hiệu</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Màu Nhấn Chủ Đạo (Primary Color - CTA, Highlights)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 font-mono w-28 uppercase"
                  />
                </div>
              </div>

              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Màu Phụ Trợ (Secondary Gradient)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 font-mono w-28 uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Media URLs Section */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h3 className="font-extrabold text-sm text-zinc-200 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <span>Hình Ảnh & Logo Thương Hiệu</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-300">Đường dẫn Logo Nhà Hàng (URL)</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-300">Đường dẫn Banner Ảnh Bìa (URL)</label>
                <input
                  type="text"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Wifi Info */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h3 className="font-extrabold text-sm text-zinc-200 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>Thông Tin Wifi Cho Khách Hàng</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-zinc-300">Tên mạng Wifi (SSID)</label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="Vd: HiAI_MenuGo_5G"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="font-semibold text-zinc-300">Mật khẩu Wifi</label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Mật khẩu truy cập"
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
