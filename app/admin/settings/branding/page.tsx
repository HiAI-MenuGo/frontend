'use client';

import React, { useState } from 'react';
import { Palette, Save, Image as ImageIcon, Wifi, Sparkles } from 'lucide-react';
import apiFetch from '../../../../lib/api';

export default function AdminBrandingPage() {
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop');
  const [primaryColor, setPrimaryColor] = useState('#f59e0b');
  const [secondaryColor, setSecondaryColor] = useState('#d97706');
  const [wifiSsid, setWifiSsid] = useState('HiAI-MenuGo_Guest_5G');
  const [wifiPassword, setWifiPassword] = useState('menugovietnam');
  const [footerText, setFooterText] = useState('Cảm ơn Quý Khách & Hẹn Gặp Lại!');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    try {
      await apiFetch('/branding', {
        method: 'PUT',
        body: JSON.stringify({
          logoUrl,
          bannerUrl,
          primaryColor,
          secondaryColor,
          wifiSsid,
          wifiPassword,
          footerText,
        }),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
          NHẬN DIỆN THƯƠNG HIỆU & GIAO DIỆN QUÁN
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Tùy biến logo, màu sắc chủ đạo, ảnh bìa và thông tin wifi hiển thị trên toàn bộ QR Menu & POS
        </p>
      </div>

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
                Màu Nhấn Chủ Đạo (Primary Color - Nút CTA, Tabs, Highlights)
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
                className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-300">Đường dẫn Banner Ảnh Bìa (URL)</label>
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
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
                className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="font-semibold text-zinc-300">Mật khẩu Wifi</label>
              <input
                type="text"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          {isSaved ? (
            <span className="text-xs text-emerald-400 font-bold">
              ✓ Đã cập nhật nhận diện thương hiệu thành công!
            </span>
          ) : <div />}

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Thay Đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
