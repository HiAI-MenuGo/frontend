'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import Image from 'next/image';
import apiFetch from '../../../lib/api';
import { useI18n } from '../../../context/i18nContext';

interface MenuItemAdmin {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  isPopular?: boolean;
  isSoldOut: boolean;
  branchId?: string;
}

export default function AdminMenuPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<MenuItemAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [abNotice, setAbNotice] = useState<string | null>(null);

  const fetchMenuItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<MenuItemAdmin[]>('/menu/items');
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setError(res.message || t('menu.errorLoading', 'Không thể tải danh sách thực đơn'));
      }
    } catch {
      setError(t('errors.network', 'Lỗi kết nối khi tải thực đơn từ máy chủ'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const toggleSoldOut = async (id: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      // Optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isSoldOut: nextStatus } : i))
      );

      const res = await apiFetch(`/menu/items/${id}/sold-out`, {
        method: 'PATCH',
        body: JSON.stringify({ isSoldOut: nextStatus }),
      });

      if (!res.success) {
        // Rollback
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, isSoldOut: currentStatus } : i))
        );
      }
    } catch {
      // Rollback
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isSoldOut: currentStatus } : i))
      );
    }
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            {t('menu.adminTitle', 'QUẢN LÝ THỰC ĐƠN & MÓN ĂN')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('menu.adminSubtitle', 'Cấu hình danh mục, giá bán và trạng thái còn/hết hàng realtime qua Socket.IO')}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setAbNotice(
              'Chức năng Tạo món mới (CRUD đầy đủ) đang được Team A/B hoàn thiện backend API — không tạo dữ liệu giả.'
            )
          }
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{t('menu.createItem', 'Tạo Món Mới')}</span>
        </button>
      </div>

      {/* Team A/B Notice Banner */}
      {abNotice && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-300 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{abNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAbNotice(null)}
            className="text-amber-400 hover:text-white font-bold text-xs"
          >
            {t('common.close', 'Đóng')}
          </button>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('menu.searchPlaceholderAdmin', 'Tìm theo tên hoặc danh mục...')}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchMenuItems}
            disabled={isLoading}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition disabled:opacity-50"
            title={t('common.refresh', 'Làm mới')}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <span className="text-xs text-zinc-400">
            {t('common.total', 'Tổng cộng')}: <strong className="text-zinc-200">{filteredItems.length}</strong> {t('common.items', 'món')}
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-zinc-900 rounded-2xl border border-zinc-800" />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800" />
                  <div className="space-y-1.5">
                    <div className="h-4 bg-zinc-800 rounded w-32" />
                    <div className="h-3 bg-zinc-800 rounded w-20" />
                  </div>
                </div>
                <div className="h-4 bg-zinc-800 rounded w-16" />
                <div className="h-6 bg-zinc-800 rounded-full w-20" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-zinc-900 border border-red-500/30 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-zinc-100 text-sm">{t('menu.errorLoading', 'Không thể tải dữ liệu thực đơn')}</h3>
            <p className="text-xs text-zinc-400">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchMenuItems}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('common.retry', 'Thử lại')}</span>
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-3">
          <Layers className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="font-bold text-zinc-300 text-sm">{t('menu.emptyAdmin', 'Chưa có món ăn nào trong thực đơn')}</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {t('menu.emptyAdminDesc', 'Hiện tại chi nhánh chưa có danh sách món hoặc từ khóa tìm kiếm không khớp.')}
          </p>
        </div>
      ) : (
        /* Menu Table */
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">{t('menu.colItem', 'Món Ăn')}</th>
                  <th className="py-3.5 px-4">{t('menu.colCategory', 'Danh Mục')}</th>
                  <th className="py-3.5 px-4 text-right">{t('menu.colPrice', 'Giá Bán')}</th>
                  <th className="py-3.5 px-4 text-center">{t('menu.colSoldOut', 'Báo Hết Món')}</th>
                  <th className="py-3.5 px-4 text-right">{t('common.actions', 'Thao Tác')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              loading="lazy"
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 text-[10px]">
                            No img
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-zinc-100">{item.name}</span>
                          {item.isPopular && (
                            <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-bold rounded">
                              HOT
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-300">{item.category}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400">
                      {item.price.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSoldOut(item.id, item.isSoldOut)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition border ${
                          item.isSoldOut
                            ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                      >
                        {item.isSoldOut ? t('menu.soldOutUpper', 'HẾT HÀNG') : t('menu.inStockUpper', 'CÒN HÀNG')}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setAbNotice(
                            `Chức năng Sửa chi tiết món "${item.name}" đang được Team A/B hoàn thiện backend API — không tạo dữ liệu giả.`
                          )
                        }
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
                        title={t('common.edit', 'Chỉnh sửa')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
