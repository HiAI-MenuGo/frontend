'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  Crown,
  Sparkles,
  TrendingUp,
  Award,
  X,
  CheckCircle2,
  ChevronRight,
  Receipt,
  Pencil,
  Trash2,
  BellRing,
  Star,
  RefreshCw,
} from 'lucide-react';
import CustomerRequestsView from '@/components/requests/CustomerRequestsView';
import { fetchCustomerCalls } from '@/lib/api/customerRequests.api';
import { getSocket } from '@/lib/socket';
import {
  lookupCustomerByPhone,
  adjustCustomerPoints,
  fetchCustomersList,
  createCustomer as createCustomerApi,
  fetchTiers,
  createTier,
  updateTier,
  deleteTier,
  deleteCustomer,
} from '@/lib/api/customers.api';
import type { MembershipTierDTO } from '@/lib/api/types';
import { formatVND } from '@/lib/format';
import { useHeaderStore } from '@/stores/header.store';

export type CustomersTabType = 'members' | 'calls' | 'reviews';

export interface CustomersViewProps {
  initialTab?: CustomersTabType;
}

export interface Customer {
  id: string;
  code?: string;
  phone: string;
  tier: string;
  totalSpend: number;
  ordersCount: number;
  points: number;
  lastVisit: string;
}

export interface TierItem {
  id: string;
  name: string;
  label?: string;
  minPoints: number;
  discountRate: number;
  color: string;
}

const defaultTiers: TierItem[] = [
  { id: 'tier-diamond', name: 'Kim Cương', label: 'Kim Cương', minPoints: 1000, discountRate: 15, color: '#4F46E5' },
  { id: 'tier-gold', name: 'Vàng', label: 'Vàng', minPoints: 500, discountRate: 10, color: '#D97706' },
  { id: 'tier-silver', name: 'Bạc', label: 'Bạc', minPoints: 200, discountRate: 5, color: '#64748B' },
  { id: 'tier-bronze', name: 'Đồng', label: 'Đồng', minPoints: 0, discountRate: 0, color: '#B45309' },
];

export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.trim().replace(/^\+84\s*/, '0').replace(/^84\s*/, '0').replace(/\s+/g, '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return digits || phone;
}

const TIER_COLOR_PRESETS = [
  { name: 'Kim Cương', hex: '#4F46E5' },
  { name: 'Vàng Kim', hex: '#D97706' },
  { name: 'Bạc Sang', hex: '#64748B' },
  { name: 'Đồng Cổ', hex: '#B45309' },
  { name: 'Lục Bảo', hex: '#059669' },
  { name: 'Hồng Ruby', hex: '#E11D48' },
  { name: 'Tím Hoàng Gia', hex: '#7C3AED' },
  { name: 'Xanh POS', hex: '#00A389' },
];

export default function CustomersView({ initialTab = 'members' }: CustomersViewProps = {}) {
  const [activeTab, setActiveTab] = useState<CustomersTabType>(initialTab);
  const [pendingCallsCount, setPendingCallsCount] = useState(0);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [tierList, setTierList] = useState<TierItem[]>(defaultTiers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Quản lý Modal xác nhận xoá khách hàng
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  // Đếm số lượng cuộc gọi bàn đang chờ phục vụ
  useEffect(() => {
    fetchCustomerCalls({ status: 'PENDING' })
      .then((res) => setPendingCallsCount(res.summary.pending))
      .catch(() => {});

    const socket = getSocket();
    if (!socket) return;

    const onCall = () => {
      setPendingCallsCount((prev) => prev + 1);
    };
    const onUpdated = () => {
      fetchCustomerCalls({ status: 'PENDING' })
        .then((res) => setPendingCallsCount(res.summary.pending))
        .catch(() => {});
    };

    socket.on('call_staff:request', onCall);
    socket.on('call_staff:updated', onUpdated);
    return () => {
      socket.off('call_staff:request', onCall);
      socket.off('call_staff:updated', onUpdated);
    };
  }, []);

  // Quản lý Modal Tạo / Chỉnh sửa Phân Hạng
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState<TierItem | null>(null);
  const [tierForm, setTierForm] = useState({
    name: '',
    minPoints: 0,
    discountRate: 0,
    color: '#00A389',
  });
  const [savingTier, setSavingTier] = useState(false);

  // Điểm cộng/trừ trong modal chi tiết
  const [pointsDelta, setPointsDelta] = useState('50');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustSuccess, setAdjustSuccess] = useState(false);

  // Form đăng ký hội viên mới (chỉ cần SĐT là chính)
  const [formData, setFormData] = useState({
    phone: '',
    tier: 'Đồng',
  });

  const [searchingRemote, setSearchingRemote] = useState(false);
  const [remoteMessage, setRemoteMessage] = useState<string | null>(null);

  const loadCustomersData = React.useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const list = await fetchCustomersList();
      if (Array.isArray(list)) {
        setCustomers(
          list.map((c: any, idx: number) => ({
            id: c.id || `KH-${String(idx + 1).padStart(3, '0')}`,
            code: c.code || `KH-${String(idx + 1).padStart(3, '0')}`,
            phone: formatPhoneDisplay(c.phone),
            tier: c.tier || 'Đồng',
            totalSpend: c.totalSpend ?? c.totalSpent ?? 0,
            ordersCount: c.ordersCount ?? 0,
            points: c.points ?? c.loyaltyPoints ?? 0,
            lastVisit: c.lastVisit || 'Vừa tham gia',
          }))
        );
      }
    } catch (err) {
      console.warn('Could not load customers list from API:', err);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  // Tải danh sách khách hàng từ database
  useEffect(() => {
    loadCustomersData();
  }, [loadCustomersData]);

  // Tải danh sách phân hạng từ backend
  useEffect(() => {
    fetchTiers()
      .then((beTiers: MembershipTierDTO[]) => {
        if (beTiers && beTiers.length > 0) {
          setTierList((prev) => {
            const merged = beTiers.map((bt) => {
              const existing = prev.find(
                (p) => p.name.toLowerCase() === bt.name.toLowerCase() || p.id === bt.id
              );
              return {
                id: bt.id,
                name: bt.name,
                minPoints: bt.minPoints,
                discountRate: bt.discountRate,
                color: bt.color || existing?.color || '#00A389',
              };
            });
            return merged.sort((a, b) => b.minPoints - a.minPoints);
          });
        }
      })
      .catch(() => {});
  }, []);

  const setCustomAction = useHeaderStore((s) => s.setCustomAction);

  useEffect(() => {
    if (activeTab === 'members') {
      setCustomAction(
        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 px-4 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center gap-2 shadow-sm shadow-[#00A389]/20 transition-all active:scale-[0.98] shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Đăng ký thành viên</span>
        </button>
      );
    }
    return () => setCustomAction(null);
  }, [setCustomAction, activeTab]);

  // Helper lấy thông tin & styling hạng thành viên
  const getTierInfo = React.useCallback(
    (tierName: string) => {
      const found =
        tierList.find((t) => t.name.toLowerCase() === tierName.toLowerCase()) ||
        // Dự phòng map tên tiếng Anh cũ
        (tierName.toLowerCase() === 'diamond'
          ? tierList.find((t) => t.name === 'Kim Cương')
          : tierName.toLowerCase() === 'gold'
          ? tierList.find((t) => t.name === 'Vàng')
          : tierName.toLowerCase() === 'silver'
          ? tierList.find((t) => t.name === 'Bạc')
          : tierName.toLowerCase() === 'bronze'
          ? tierList.find((t) => t.name === 'Đồng')
          : null) ||
        tierList[tierList.length - 1] || {
          id: 'tier-default',
          name: tierName,
          minPoints: 0,
          discountRate: 0,
          color: '#64748B',
        };

      return {
        name: found.name,
        minPoints: found.minPoints,
        discountRate: found.discountRate,
        color: found.color,
      };
    },
    [tierList]
  );

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = customers.length;
    const vipCount = customers.filter((c) => {
      const info = getTierInfo(c.tier);
      return info.discountRate >= 10 || info.minPoints >= 500;
    }).length;
    const totalPoints = customers.reduce((sum, c) => sum + c.points, 0);
    const activeRecent = customers.filter(
      (c) => c.lastVisit.includes('Hôm nay') || c.lastVisit.includes('Hôm qua')
    ).length;
    return { total, vipCount, totalPoints, activeRecent };
  }, [customers, getTierInfo]);

  // Bộ lọc khách hàng
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.phone.includes(q) ||
        c.id.toLowerCase().includes(q);

      const info = getTierInfo(c.tier);
      const matchesTier =
        selectedTier === 'All' ||
        c.tier.toLowerCase() === selectedTier.toLowerCase() ||
        info.name.toLowerCase() === selectedTier.toLowerCase();

      return matchesSearch && matchesTier;
    });
  }, [customers, searchQuery, selectedTier, getTierInfo]);

  // Tra cứu số điện thoại từ server nếu không thấy trong danh sách
  const handleRemoteLookup = async () => {
    const cleanPhone = searchQuery.trim();
    if (!cleanPhone) return;
    setSearchingRemote(true);
    setRemoteMessage(null);
    try {
      const remoteCust = await lookupCustomerByPhone(cleanPhone);
      const existingIdx = customers.findIndex((c) => c.phone === remoteCust.phone);
      const mappedTier = remoteCust.tier?.name ?? 'Đồng';

      if (existingIdx >= 0) {
        setSelectedCustomer(customers[existingIdx]);
      } else {
        const newEntry: Customer = {
          id: `KH-${String(customers.length + 1).padStart(3, '0')}`,
          phone: remoteCust.phone,
          tier: mappedTier,
          totalSpend: remoteCust.totalSpent || 0,
          ordersCount: 1,
          points: remoteCust.points,
          lastVisit: 'Vừa tra cứu',
        };
        setCustomers((prev) => [newEntry, ...prev]);
        setSelectedCustomer(newEntry);
      }
      setRemoteMessage(`Tìm thấy hội viên có SĐT: ${remoteCust.phone}`);
    } catch {
      setRemoteMessage('Không tìm thấy hội viên trên máy chủ.');
    } finally {
      setSearchingRemote(false);
    }
  };

  // Tạo hội viên mới (chỉ cần nhập SĐT)
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formData.phone.trim();
    if (!cleanPhone) return;

    try {
      await createCustomerApi({
        phone: cleanPhone,
        name: cleanPhone,
        initialPoints: 50,
      });
      await loadCustomersData();
    } catch {
      await adjustCustomerPoints(cleanPhone, 50, cleanPhone).catch(() => {});
      await loadCustomersData();
    }

    setFormData({ phone: '', tier: 'Đồng' });
    setShowAddModal(false);
  };

  // Điều chỉnh điểm thưởng khách hàng
  const handleAdjustPoints = async () => {
    if (!selectedCustomer) return;
    const delta = parseInt(pointsDelta, 10);
    if (Number.isNaN(delta)) return;

    setAdjusting(true);
    try {
      await adjustCustomerPoints(selectedCustomer.phone, delta, selectedCustomer.phone).catch(() => {});
      await loadCustomersData();

      const newPoints = Math.max(0, selectedCustomer.points + delta);

      // Tự động nâng hạng theo danh sách tierList hiện có
      const sortedTiers = [...tierList].sort((a, b) => b.minPoints - a.minPoints);
      const matchedTier =
        sortedTiers.find((t) => newPoints >= t.minPoints) || sortedTiers[sortedTiers.length - 1];
      const updatedTier = matchedTier ? matchedTier.name : selectedCustomer.tier;

      const updatedCustomer: Customer = {
        ...selectedCustomer,
        points: newPoints,
        tier: updatedTier,
      };

      setCustomers((prev) => prev.map((c) => (c.id === selectedCustomer.id ? updatedCustomer : c)));
      setSelectedCustomer(updatedCustomer);
      setAdjustSuccess(true);
      setTimeout(() => setAdjustSuccess(false), 3000);
    } catch {
      alert('Không thể cập nhật điểm thưởng');
    } finally {
      setAdjusting(false);
    }
  };

  // Xác nhận và thực hiện xoá khách hàng khỏi hệ thống
  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setDeletingCustomer(true);
    try {
      // Gọi API xoá khách hàng từ server (hỗ trợ cả id lẫn phone)
      await deleteCustomer(customerToDelete.id).catch(async () => {
        if (customerToDelete.phone) {
          await deleteCustomer(customerToDelete.phone).catch(() => {});
        }
      });

      // Cập nhật danh sách local ngay lập tức
      setCustomers((prev) =>
        prev.filter((c) => c.id !== customerToDelete.id && c.phone !== customerToDelete.phone)
      );

      // Đóng modal hồ sơ nếu khách đang được xem chi tiết bị xoá
      if (
        selectedCustomer &&
        (selectedCustomer.id === customerToDelete.id || selectedCustomer.phone === customerToDelete.phone)
      ) {
        setSelectedCustomer(null);
      }

      setRemoteMessage(`Đã xoá khách hàng ${customerToDelete.phone} thành công.`);
      setTimeout(() => setRemoteMessage(null), 4000);
      setCustomerToDelete(null);
    } catch (err: any) {
      alert(err?.message || 'Không thể xoá khách hàng lúc này');
    } finally {
      setDeletingCustomer(false);
    }
  };

  // Mở modal tạo hạng mới
  const openCreateTierModal = () => {
    setEditingTier(null);
    setTierForm({
      name: '',
      minPoints: 0,
      discountRate: 0,
      color: '#00A389',
    });
    setShowTierModal(true);
  };

  // Mở modal sửa hạng
  const openEditTierModal = (tier: TierItem) => {
    setEditingTier(tier);
    setTierForm({
      name: tier.name,
      minPoints: tier.minPoints,
      discountRate: tier.discountRate,
      color: tier.color,
    });
    setShowTierModal(true);
  };

  // Lưu tạo / sửa hạng
  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierForm.name.trim()) return;

    setSavingTier(true);
    try {
      if (editingTier) {
        // Cập nhật hạng hiện có
        try {
          await updateTier(editingTier.id, {
            name: tierForm.name.trim(),
            minPoints: Number(tierForm.minPoints) || 0,
            discountRate: Number(tierForm.discountRate) || 0,
            color: tierForm.color,
          });
        } catch {
          // Lưu ý: nếu offline hoặc mock ID vẫn cập nhật state local
        }

        setTierList((prev) =>
          prev
            .map((t) =>
              t.id === editingTier.id
                ? {
                    ...t,
                    name: tierForm.name.trim(),
                    minPoints: Number(tierForm.minPoints) || 0,
                    discountRate: Number(tierForm.discountRate) || 0,
                    color: tierForm.color,
                  }
                : t
            )
            .sort((a, b) => b.minPoints - a.minPoints)
        );
      } else {
        // Tạo hạng mới
        let newId = `tier-${Date.now()}`;
        try {
          const res = await createTier({
            name: tierForm.name.trim(),
            minPoints: Number(tierForm.minPoints) || 0,
            discountRate: Number(tierForm.discountRate) || 0,
            color: tierForm.color,
          });
          if (res?.id) newId = res.id;
        } catch {
          // Mock fallback
        }

        const newTier: TierItem = {
          id: newId,
          name: tierForm.name.trim(),
          minPoints: Number(tierForm.minPoints) || 0,
          discountRate: Number(tierForm.discountRate) || 0,
          color: tierForm.color,
        };

        setTierList((prev) => [...prev, newTier].sort((a, b) => b.minPoints - a.minPoints));
      }

      setShowTierModal(false);
      setEditingTier(null);
    } finally {
      setSavingTier(false);
    }
  };

  // Xóa hạng thành viên
  const handleDeleteTier = async (tierId: string) => {
    if (tierList.length <= 1) {
      alert('Hệ thống cần duy trì ít nhất 1 phân hạng thành viên.');
      return;
    }
    const target = tierList.find((t) => t.id === tierId);
    if (!target) return;
    if (!confirm(`Bạn có chắc chắn muốn xoá hạng "${target.name}" không?`)) return;

    try {
      await deleteTier(tierId).catch(() => {});
      setTierList((prev) => prev.filter((t) => t.id !== tierId));
    } catch {
      alert('Không thể xoá hạng thành viên');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* ======================================================== */}
      {/* THANH TAB BAR: Hội viên & Tích điểm | Yêu cầu gọi bàn | Đánh giá & Rating */}
      {/* ======================================================== */}
      <div className="flex border-b border-[#E2E8F0] gap-4 sm:gap-8 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`pb-3 text-[14.5px] font-black flex items-center gap-2 transition-all relative cursor-pointer ${
            activeTab === 'members'
              ? 'text-[#00A389]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Users size={18} />
          <span>Hội viên & Tích điểm</span>
          {activeTab === 'members' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#00A389] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calls')}
          className={`pb-3 text-[14.5px] font-black flex items-center gap-2 transition-all relative cursor-pointer ${
            activeTab === 'calls'
              ? 'text-[#00A389]'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <BellRing size={18} />
          <span>Yêu cầu</span>
          {pendingCallsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EF4444] text-white animate-pulse shadow-xs">
              {pendingCallsCount} mới
            </span>
          )}
          {activeTab === 'calls' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#00A389] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-[14.5px] font-black flex items-center gap-2 transition-all relative cursor-pointer ${
            activeTab === 'reviews'
              ? 'text-amber-600'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Star size={18} className="fill-amber-400 text-amber-500" />
          <span>Đánh giá</span>
          {activeTab === 'reviews' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'members' ? (
        <>
          {/* 4 Thẻ Thống Kê Tổng Quan */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-3.5 min-w-0">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Tổng thành viên
            </span>
            <span className="text-[20px] font-black text-[#0F172A] tracking-tight block mt-0.5">
              {stats.total} SĐT
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Crown size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Hội viên ưu tiên VIP
            </span>
            <span className="text-[20px] font-black text-amber-600 tracking-tight block mt-0.5">
              {stats.vipCount} khách
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#E6F7F4] text-[#00A389] flex items-center justify-center shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Ghé gần đây
            </span>
            <span className="text-[20px] font-black text-[#00A389] tracking-tight block mt-0.5">
              {stats.activeRecent} lượt
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Tổng điểm tích luỹ
            </span>
            <span className="text-[20px] font-black text-purple-700 tracking-tight font-mono block mt-0.5">
              {stats.totalPoints.toLocaleString('vi-VN')} pts
            </span>
          </div>
        </div>
      </div>

      {/* Thanh Tìm Kiếm & Bộ Lọc Phân Hạng */}
      <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* Phân hạng Tabs động theo tierList */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'All', label: 'Tất cả' },
              ...tierList.map((t) => ({ id: t.name, label: t.name })),
            ].map((t) => {
              const active = selectedTier === t.id;
              const count =
                t.id === 'All'
                  ? customers.length
                  : customers.filter((c) => {
                      const info = getTierInfo(c.tier);
                      return info.name.toLowerCase() === t.id.toLowerCase();
                    }).length;

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTier(t.id)}
                  className={`px-3.5 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#00A389] text-white shadow-xs'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Ô Tìm Kiếm theo Số Điện Thoại & Mã */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="tìm kiếm..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRemoteLookup();
                }}
                className="w-full pl-10 pr-9 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#00A389] focus:outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] p-0.5"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {searchQuery.trim().length >= 8 && (
              <button
                onClick={handleRemoteLookup}
                disabled={searchingRemote}
                title="Tra cứu trực tiếp từ máy chủ"
                className="h-10 px-3.5 rounded-xl bg-[#E6F7F4] hover:bg-[#d0f0eb] text-[#00A389] text-[12px] font-bold border border-[#00A389]/30 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Search size={14} />
                <span>{searchingRemote ? 'Đang dò...' : 'Dò SĐT'}</span>
              </button>
            )}
          </div>
        </div>

        {remoteMessage && (
          <div className="text-[12px] text-[#00A389] font-medium bg-[#E6F7F4] border border-[#00A389]/20 px-3 py-1.5 rounded-xl flex items-center justify-between">
            <span>{remoteMessage}</span>
            <button onClick={() => setRemoteMessage(null)} className="text-[#00A389] hover:underline">
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Bảng Danh Sách Khách Hàng (Định danh SĐT, tinh gọn) */}
      <div className="bg-white rounded-[26px] border border-[#E2E8F0] shadow-2xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto table-scroll -mx-1 px-1">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-5 sm:px-6">Số điện thoại / Mã KH</th>
                <th className="py-3.5 px-4 sm:px-6">Phân hạng</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Điểm tích luỹ</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Tổng chi tiêu</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Lượt ghé</th>
                <th className="py-3.5 px-4 sm:px-6">Ghé gần nhất</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loadingCustomers ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <RefreshCw className="w-6 h-6 text-[#00A389] animate-spin" />
                      <p className="font-bold text-[13px] text-slate-700">Đang tải danh sách khách hàng...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#94A3B8] space-y-2">
                    <p className="font-bold text-[14px]">Không tìm thấy số điện thoại phù hợp</p>
                    <p className="text-[12px]">
                      Thử tìm kiếm với số điện thoại khác hoặc bấm nút &quot;Đăng ký thành viên&quot;.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const tInfo = getTierInfo(c.tier);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Số điện thoại & Mã KH (Định danh chính) */}
                      <td className="py-4 px-5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-[12px] shadow-xs shrink-0"
                            style={{
                              backgroundColor: `${tInfo.color}15`,
                              color: tInfo.color,
                              border: `1px solid ${tInfo.color}35`,
                            }}
                          >
                            <Phone size={15} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono font-black text-[14px] text-[#0F172A] group-hover:text-[#00A389] transition-colors block">
                              {c.phone}
                            </span>
                            <span className="font-mono font-bold text-[11.5px] text-[#94A3B8] block">
                              {c.code || c.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phân hạng với màu động */}
                      <td className="py-4 px-4 sm:px-6">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide border shadow-2xs"
                          style={{
                            backgroundColor: `${tInfo.color}15`,
                            color: tInfo.color,
                            borderColor: `${tInfo.color}40`,
                          }}
                        >
                          <Crown size={12} strokeWidth={2.5} />
                          <span>{tInfo.name}</span>
                        </span>
                      </td>

                      {/* Điểm tích luỹ */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <span className="font-black text-amber-700 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-xl text-[12.5px] font-mono inline-block">
                          {c.points.toLocaleString('vi-VN')} pts
                        </span>
                      </td>

                      {/* Tổng chi tiêu */}
                      <td className="py-4 px-4 sm:px-6 text-right font-black text-[#00A389] font-mono text-[13.5px]">
                        {formatVND(c.totalSpend)}
                      </td>

                      {/* Lượt ghé */}
                      <td className="py-4 px-4 sm:px-6 text-right font-bold text-[#475569]">
                        {c.ordersCount} lần
                      </td>

                      {/* Lần ghé gần nhất */}
                      <td className="py-4 px-4 sm:px-6 text-[#64748B] text-[12px]">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar size={13} className="text-[#94A3B8]" />
                          <span>{c.lastVisit}</span>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(c);
                            }}
                            className="h-8 px-2.5 rounded-lg text-[#00A389] hover:bg-[#E6F7F4] font-bold text-[12px] inline-flex items-center gap-1 transition-all cursor-pointer"
                            title="Xem chi tiết hồ sơ"
                          >
                            <span>Hồ sơ</span>
                            <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomerToDelete(c);
                            }}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer"
                            title={`Xoá khách hàng ${c.phone}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danh Sách Các Hạng Thành Viên & Chính Sách */}
      <div className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#E2E8F0] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F1F5F9] gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6F7F4] text-[#00A389] flex items-center justify-center shrink-0">
              <Award size={20} />
            </div>
            <div>
              <h4 className="text-[15px] font-black text-[#0F172A]">Chính sách & Hạng thành viên</h4>
              <p className="text-[12px] text-[#64748B]">
                Cấu hình phân hạng, ngưỡng điểm nâng cấp và tỷ lệ chiết khấu giảm giá trực tiếp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-[11.5px] font-bold text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
              {tierList.length} phân hạng
            </span>
            <button
              onClick={openCreateTierModal}
              className="h-9 px-3.5 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[12.5px] flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Thêm hạng mới</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-3.5 min-w-0">
          {tierList.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3 hover:border-[#00A389]/40 hover:shadow-2xs transition-all relative group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-[14px] text-[#0F172A]">
                    <Crown size={15} style={{ color: t.color }} />
                    <span>{t.name}</span>
                  </div>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${t.color}15`,
                      color: t.color,
                      borderColor: `${t.color}35`,
                    }}
                  >
                    Hạng {t.name}
                  </span>
                </div>

                <div className="space-y-1 text-[12px]">
                  <p className="text-[#64748B] flex items-center justify-between">
                    <span>Điểm tối thiểu:</span>
                    <strong className="text-[#0F172A] font-mono font-bold">
                      {t.minPoints.toLocaleString('vi-VN')} pts
                    </strong>
                  </p>
                  <p
                    className="font-black pt-1 flex items-center gap-1 text-[12.5px]"
                    style={{ color: t.color }}
                  >
                    <TrendingUp size={13} />
                    <span>Ưu đãi giảm giá -{t.discountRate}%</span>
                  </p>
                </div>
              </div>

              {/* Thanh Thao Tác Chỉnh Sửa & Xoá Hạng */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditTierModal(t)}
                  className="flex-1 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-[#334155] font-bold text-[11.5px] flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <Pencil size={12} className="text-[#64748B]" />
                  <span>Chỉnh sửa</span>
                </button>
                {tierList.length > 1 && (
                  <button
                    onClick={() => handleDeleteTier(t.id)}
                    className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 text-[#94A3B8] hover:text-rose-600 flex items-center justify-center transition-all shadow-2xs shrink-0"
                    title="Xoá hạng này"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Chi Tiết Hồ Sơ Hội Viên */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-lg w-full max-h-[92dvh] my-auto p-4 sm:p-6 lg:p-7 shadow-2xl border border-[#E2E8F0] relative animate-in fade-in zoom-in-95 duration-150 space-y-4 lg:space-y-5 flex flex-col overflow-hidden modal-panel">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
              aria-label="Đóng hồ sơ"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Hồ sơ hội viên tích điểm
              </span>
              <h3 className="text-[20px] font-mono font-black text-[#0F172A] mt-0.5">
                {selectedCustomer.phone}
              </h3>
            </div>

            {/* Thẻ VIP Thành Viên Ảo (Luxury Loyalty Card) */}
            {(() => {
              const tInfo = getTierInfo(selectedCustomer.tier);
              return (
                <div
                  className="rounded-[24px] p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-white/10"
                  style={{
                    background: `linear-gradient(135deg, #0F172A 0%, #1E293B 60%, ${tInfo.color}90 100%)`,
                  }}
                >
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md font-mono font-black text-[15px]"
                          style={{
                            backgroundColor: `${tInfo.color}35`,
                            color: '#ffffff',
                            border: `1px solid ${tInfo.color}60`,
                          }}
                        >
                          <Phone size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[17px] font-mono font-black text-white">
                              {selectedCustomer.phone}
                            </span>
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border"
                              style={{
                                backgroundColor: `${tInfo.color}30`,
                                color: '#ffffff',
                                borderColor: `${tInfo.color}50`,
                              }}
                            >
                              <Crown size={11} />
                              <span>{tInfo.name}</span>
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-300 font-mono block mt-0.5">
                            Mã thẻ: {selectedCustomer.code || selectedCustomer.id}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9.5px] uppercase font-bold text-slate-300 block">
                          Ưu đãi
                        </span>
                        <span className="text-[20px] font-black text-[#00A389]">
                          -{tInfo.discountRate}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
                      <div className="bg-white/5 rounded-xl p-2">
                        <span className="text-[9.5px] uppercase text-slate-300 font-bold block">
                          Điểm thưởng
                        </span>
                        <span className="text-[14px] font-black text-amber-400 font-mono mt-0.5 block">
                          {selectedCustomer.points.toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2">
                        <span className="text-[9.5px] uppercase text-slate-300 font-bold block">
                          Lượt ghé
                        </span>
                        <span className="text-[14px] font-black text-white font-mono mt-0.5 block">
                          {selectedCustomer.ordersCount} lần
                        </span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2">
                        <span className="text-[9.5px] uppercase text-slate-300 font-bold block">
                          Chi tiêu
                        </span>
                        <span className="text-[13px] font-black text-emerald-400 font-mono mt-0.5 block truncate">
                          {formatVND(selectedCustomer.totalSpend)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Chi tiết thông tin */}
            <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] text-[12.5px]">
              <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <Phone size={13} className="text-[#00A389]" />
                  <span>Số điện thoại:</span>
                </span>
                <span className="font-bold text-[#0F172A] font-mono">
                  {selectedCustomer.phone}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <Crown size={13} className="text-amber-600" />
                  <span>Hạng thành viên:</span>
                </span>
                <span className="font-bold text-[#0F172A]">
                  {getTierInfo(selectedCustomer.tier).name}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <Receipt size={13} className="text-[#64748B]" />
                  <span>Lần ghé gần nhất:</span>
                </span>
                <span className="font-bold text-[#0F172A]">{selectedCustomer.lastVisit}</span>
              </div>
            </div>

            {/* Khối Cộng / Trừ Điểm Tích Luỹ */}
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-600" />
                  <span className="text-[13px] font-black text-[#0F172A]">
                    Cộng / Trừ điểm thưởng
                  </span>
                </div>
                {adjustSuccess && (
                  <span className="text-[11.5px] font-bold text-[#00A389] bg-[#E6F7F4] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>Đã cập nhật!</span>
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={pointsDelta}
                    onChange={(e) => setPointsDelta(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-[13.5px] font-black text-[#0F172A] font-mono focus:border-[#00A389] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {['+10', '+50', '+100', '-50'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPointsDelta(val.replace('+', ''))}
                      className="h-10 px-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-slate-300 text-[11.5px] font-bold text-[#475569] transition-all"
                    >
                      {val}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAdjustPoints}
                  disabled={adjusting}
                  className="h-10 px-4 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[12.5px] flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 shrink-0"
                >
                  <Plus size={14} />
                  <span>{adjusting ? 'Lưu...' : 'Cập nhật'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setCustomerToDelete(selectedCustomer)}
                className="w-full sm:flex-1 h-11 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold rounded-2xl text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Xoá khách hàng này</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-full sm:flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-extrabold rounded-2xl text-[13px] transition-all cursor-pointer"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đăng Ký Hội Viên Mới (Chỉ cần SĐT làm định danh chính) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-md w-full max-h-[92dvh] my-auto p-4 sm:p-6 shadow-2xl border border-[#E2E8F0] relative animate-in fade-in zoom-in-95 duration-150 space-y-4 flex flex-col overflow-hidden modal-panel">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#E6F7F4] text-[#00A389] flex items-center justify-center mb-2.5">
                <Phone size={20} />
              </div>
              <h3 className="text-[18px] font-black text-[#0F172A]">Đăng ký hội viên tích điểm</h3>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-[13px]">
              <div>
                <label className="block font-bold text-[#0F172A] mb-1">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-bold text-[#0F172A] font-mono focus:bg-white focus:border-[#00A389] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1">Hạng thành viên ban đầu</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13.5px] font-bold text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden"
                >
                  {tierList.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} (Giảm {t.discountRate}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-10 px-4 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold shadow-sm transition-all active:scale-[0.98]"
                >
                  Lưu thành viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo / Chỉnh Sửa Hạng Thành Viên */}
      {showTierModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-md w-full max-h-[92dvh] my-auto p-4 sm:p-6 shadow-2xl border border-[#E2E8F0] relative animate-in fade-in zoom-in-95 duration-150 space-y-4 flex flex-col overflow-hidden modal-panel">
            <button
              onClick={() => {
                setShowTierModal(false);
                setEditingTier(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
            >
              <X size={18} />
            </button>

            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#E6F7F4] text-[#00A389] flex items-center justify-center mb-2.5">
                <Crown size={20} />
              </div>
              <h3 className="text-[18px] font-black text-[#0F172A]">
                {editingTier ? 'Chỉnh sửa phân hạng' : 'Thêm phân hạng mới'}
              </h3>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-bold text-[#0F172A] mb-1">
                  Tên phân hạng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tierForm.name}
                  onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13.5px] font-bold text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">
                    Điểm tối thiểu (pts) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={tierForm.minPoints}
                    onChange={(e) =>
                      setTierForm({ ...tierForm, minPoints: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13.5px] font-mono font-bold text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">
                    Giảm giá (%) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={tierForm.discountRate}
                      onChange={(e) =>
                        setTierForm({ ...tierForm, discountRate: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13.5px] font-mono font-bold text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#94A3B8]">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1.5">
                  Màu sắc nhận diện
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TIER_COLOR_PRESETS.map((preset) => {
                    const isSelected = tierForm.color.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={preset.hex}
                        onClick={() => setTierForm({ ...tierForm, color: preset.hex })}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          isSelected
                            ? 'border-[#00A389] bg-[#E6F7F4]/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full shadow-2xs"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span className="text-[10px] font-bold text-[#475569] truncate w-full text-center">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Xem trước huy hiệu thẻ */}
              <div className="p-3 rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] space-y-1.5">
                <span className="text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Xem trước huy hiệu
                </span>
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11.5px] font-black px-3 py-1 rounded-full border inline-flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${tierForm.color}15`,
                      color: tierForm.color,
                      borderColor: `${tierForm.color}40`,
                    }}
                  >
                    <Crown size={13} strokeWidth={2.5} />
                    <span>{tierForm.name || 'Tên phân hạng'}</span>
                  </span>
                  <span
                    className="text-[12px] font-black font-mono"
                    style={{ color: tierForm.color }}
                  >
                    Ưu đãi -{tierForm.discountRate}% • từ {tierForm.minPoints} pts
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTierModal(false);
                    setEditingTier(null);
                  }}
                  className="h-10 px-4 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingTier}
                  className="h-10 px-5 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {savingTier
                    ? 'Đang lưu...'
                    : editingTier
                    ? 'Lưu thay đổi'
                    : 'Tạo hạng mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xoá Khách Hàng */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[26px] max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150 space-y-4 my-8">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-[17px] font-black text-[#0F172A]">Xác nhận xoá khách hàng?</h3>
                <p className="text-[12px] text-[#64748B]">Hành động này sẽ xóa dữ liệu và không thể hoàn tác</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[13px] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Số điện thoại:</span>
                <span className="font-mono font-black text-[#0F172A] text-[14px]">{customerToDelete.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Mã khách hàng:</span>
                <span className="font-mono font-bold text-slate-700">{customerToDelete.code || customerToDelete.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Phân hạng:</span>
                <span className="font-black text-purple-700">{customerToDelete.tier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Điểm thưởng tích lũy:</span>
                <span className="font-mono font-black text-amber-600">{customerToDelete.points.toLocaleString('vi-VN')} pts</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deletingCustomer}
                onClick={() => setCustomerToDelete(null)}
                className="h-10.5 px-4.5 rounded-xl border border-slate-200 text-[#64748B] hover:bg-slate-100 font-bold text-[13px] transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deletingCustomer}
                onClick={handleConfirmDeleteCustomer}
                className="h-10.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[13px] shadow-sm transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={15} />
                <span>{deletingCustomer ? 'Đang xoá...' : 'Xác nhận xoá'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <CustomerRequestsView
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t)}
          hideTabBar
          embedded
        />
      )}
    </div>
  );
}
