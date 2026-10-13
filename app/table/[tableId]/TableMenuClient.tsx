'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import MenuItemList from './MenuItemList';
import { MenuItemView, useMenuSoldOut } from '../hooks/useMenuSoldOut';
import useCartStore, { SelectedModifier } from '../../../stores/cart.store';

const CustomerItemOptionsModal = dynamic(() => import('./CustomerItemOptionsModal'), {
  ssr: false,
});
const CartDrawer = dynamic(() => import('./CartDrawer'), {
  ssr: false,
});
const CustomerOrderHistoryModal = dynamic(() => import('./CustomerOrderHistoryModal'), {
  ssr: false,
});
import {
  MapPin,
  Menu as MenuIcon,
  Pencil,
  ChevronRight,
  Wallet,
  UserCheck,
  Star,
  PhoneCall,
  X,
  CheckCircle2,
  Phone,
  Sparkles,
  Crown,
  Bell,
  Heart,
  ArrowLeft,
  ShoppingCart,
  History,
} from 'lucide-react';
import {
  getOrderHistoryFromCookie,
  getAggregatedItemsFromHistory,
  updateOrderStatusInCookie,
  clearOrderHistoryCookie,
} from '@/lib/orderHistoryCookie';
import { fetchActiveTableSession } from '@/lib/api/sessions.api';
import { useI18n } from '../../../context/i18nContext';
import apiFetch from '../../../lib/api';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { lookupPublicCustomer } from '@/lib/api/customers.api';
import type { LoyaltyCustomerDTO } from '@/lib/api/types';
import { sendCustomerCall, sendCustomerReview } from '@/lib/api/customerRequests.api';
import { useSocket } from '@/context/SocketContext';
import { getSocket } from '@/lib/socket';

// Memory cache module để chống chớp giật layout khi chuyển trang/lướt lại menu
const menuCache = new Map<string, MenuItemView[]>();
const categoriesCache = new Map<string, Array<{ id: string; name: string }>>();
const brandingCache = new Map<string, Record<string, any>>();

interface TableMenuClientProps {
  tableId: string;
  tenantId?: string;
  branchId?: string;
  initialView?: 'home' | 'menu';
}

export default function TableMenuClient({
  tableId,
  tenantId: initialTenantId,
  branchId: initialBranchId,
  initialView = 'home',
}: TableMenuClientProps) {
  const router = useRouter();
  const { t, setLocale } = useI18n();
  const { emit, on, off, isConnected } = useSocket();
  const menuSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Menu gọi món khách quét QR luôn sử dụng tiếng Việt
    setLocale('vi');
  }, [setLocale]);

  const [currentView, setCurrentView] = useState<'home' | 'menu'>(initialView);

  // Lắng nghe nút Back trên trình duyệt / điện thoại để chuyển view mượt mà 0ms không remount
  useEffect(() => {
    const onPopState = () => {
      if (typeof window !== 'undefined') {
        const isMenuRoute = window.location.pathname.endsWith('/menu');
        setCurrentView(isMenuRoute ? 'menu' : 'home');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const cachedItems = menuCache.get(tableId);
  const cachedCats = categoriesCache.get(tableId);
  const cachedBrand = brandingCache.get(tableId);

  const [isMenuLoading, setIsMenuLoading] = useState<boolean>(!cachedItems);

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>(
    cachedCats || []
  );

  const [rawItems, setRawItems] = useState<MenuItemView[]>(cachedItems || []);

  const [branding, setBranding] = useState(
    cachedBrand || {
      restaurantName: '',
      address: '',
      primaryColor: '#00A389',
      logoUrl: '',
      wifiSsid: '',
      wifiPassword: '',
      enablePaymentCall: true,
      enableStaffCall: true,
    }
  );

  const { items: menuItems } = useMenuSoldOut(rawItems, tableId);
  const [selectedItem, setSelectedItem] = useState<MenuItemView | null>(null);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tenantId, setTenantId] = useState<string | undefined>(initialTenantId);
  const [branchId, setBranchId] = useState<string | undefined>(initialBranchId);

  // Trạng thái khách hàng & bàn
  const [guestName, setGuestName] = useState('Quý khách');
  const [showEditName, setShowEditName] = useState(false);
  const [tempGuestName, setTempGuestName] = useState('');

  // Tích điểm hội viên
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [inputPhone, setInputPhone] = useState('');
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<LoyaltyCustomerDTO | null>(null);
  const [lookingUpPhone, setLookingUpPhone] = useState(false);
  const [loyaltyMessage, setLoyaltyMessage] = useState<string | null>(null);

  // Modal Gọi nhân viên
  const [showCallStaffModal, setShowCallStaffModal] = useState(false);
  const [callStaffReason, setCallStaffReason] = useState('');
  const [callStaffDone, setCallStaffDone] = useState(false);

  // Modal Gọi thanh toán
  const [showCallPaymentModal, setShowCallPaymentModal] = useState(false);
  const [paymentMethodChoice, setPaymentMethodChoice] = useState<'CASH' | 'VIETQR'>('VIETQR');
  const [callPaymentDone, setCallPaymentDone] = useState(false);

  // Modal Đánh giá
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Modal Thông tin quán / Wifi
  const [showRestaurantInfo, setShowRestaurantInfo] = useState(false);

  // Modal Lịch sử các món đã gọi (lưu trong cookie)
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);
  const [historyItemsCount, setHistoryItemsCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const history = getOrderHistoryFromCookie(tableId);
      const agg = getAggregatedItemsFromHistory(history);
      const total = agg.reduce((s, it) => s + it.totalQuantity, 0);
      setHistoryItemsCount(total);
    };

    // Kiểm tra phiên hoạt động của bàn: Nếu không có phiên active nào (bàn trống), dọn sạch cache cũ
    fetchActiveTableSession(tableId)
      .then((sess) => {
        if (!sess) {
          clearOrderHistoryCookie(tableId);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`menugo_order_${tableId}`);
          }
          useCartStore.getState().clearCart();
          setHistoryItemsCount(0);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('menugo:order_history_changed'));
          }
        } else {
          updateCount();
        }
      })
      .catch(() => {
        updateCount();
      });

    const handleOpenHistory = () => {
      setShowOrderHistoryModal(true);
      showToast('Đã gửi món thành công! Bếp đang thực hiện.');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('menugo:order_history_changed', updateCount);
      window.addEventListener('menugo:open_order_history', handleOpenHistory);
      return () => {
        window.removeEventListener('menugo:order_history_changed', updateCount);
        window.removeEventListener('menugo:open_order_history', handleOpenHistory);
      };
    }
  }, [tableId]);

  // ========================================================
  // REALTIME ORDER STATUS UPDATES (Socket.IO)
  // ========================================================
  useEffect(() => {
    if (!isConnected || !tableId) return;

    // Handle order status updates (order-level: PENDING -> PREPARING -> READY -> DONE)
    const handleOrderUpdated = (payload: { orderId: string; status: string; branchId?: string }) => {
      console.log('[TableMenuClient] Received order:updated', payload);
      // Update the order status in cookie for this table
      const updated = updateOrderStatusInCookie(tableId, payload.orderId, payload.status);
      if (updated) {
        showToast(`Đơn ${payload.orderId}: ${getStatusText(payload.status)}`);
        // Notify open modal to refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('menugo:order_history_changed'));
        }
      }
    };

    // Handle item status updates (item-level: PENDING -> PREPARING -> READY -> DONE)
    const handleItemStatusUpdated = (payload: { orderId: string; itemId: string; status: string; branchId?: string }) => {
      console.log('[TableMenuClient] Received order:item-status', payload);
      // For item status, we also update the order status if needed
      const updated = updateOrderStatusInCookie(tableId, payload.orderId, payload.status);
      if (updated) {
        showToast(`Món ${payload.itemId}: ${getStatusText(payload.status)}`);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('menugo:order_history_changed'));
        }
      }
    };

    on('order:updated', handleOrderUpdated);
    on('order:item-status', handleItemStatusUpdated);

    // Xử lý khi bàn được chuyển về trống từ nhân viên / quản lý
    const handleTableReset = (payload?: { tableId?: string; status?: string }) => {
      console.log('[TableMenuClient] Received table:reset', payload);
      if (!payload?.tableId || payload.tableId === tableId) {
        clearCustomerData();
      }
    };

    const handleTableStatusChanged = (payload: { tableId?: string; status?: string }) => {
      console.log('[TableMenuClient] Received table:status-changed', payload);
      if (payload.status === 'EMPTY' && (!payload.tableId || payload.tableId === tableId)) {
        clearCustomerData();
      }
    };

    const clearCustomerData = () => {
      clearOrderHistoryCookie(tableId);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`menugo_order_${tableId}`);
      }
      useCartStore.getState().clearCart();
      setHistoryItemsCount(0);
      setShowOrderHistoryModal(false);
      setIsCartOpen(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('menugo:order_history_changed'));
      }
      showToast('Bàn đã được chuyển về trống. Bộ nhớ tạm đã được làm mới!');
    };

    on('table:status-changed', handleTableStatusChanged);
    on('table:reset', handleTableReset);

    return () => {
      off('order:updated', handleOrderUpdated);
      off('order:item-status', handleItemStatusUpdated);
      off('table:status-changed', handleTableStatusChanged);
      off('table:reset', handleTableReset);
    };
  }, [isConnected, tableId, on, off]);

  // Toast thông báo ngắn
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper: Chuyển trạng thái sang tiếng Việt
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PREPARING': return 'Đang chế biến';
      case 'READY': return 'Sẵn sàng';
      case 'SERVED': return 'Đã phục vụ';
      case 'DONE': return 'Đã làm xong';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const { addItem, getTotalCount, getTotalAmount } = useCartStore();

  // Xác định lời chào theo buổi
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return '☀️ Chào buổi sáng';
    if (hour >= 11 && hour < 14) return '🌤️ Chào buổi trưa';
    if (hour >= 14 && hour < 18) return '☕ Chào buổi chiều';
    return '🌙 Chào buổi tối';
  }, []);

  // Chuẩn hóa tên bàn hiển thị
  const displayTableName = useMemo(() => {
    const clean = tableId.trim().toUpperCase();
    if (clean.startsWith('BÀN ')) {
      return clean;
    }
    const stripped = clean.replace(/^(BÀN|BAN|TABLE)[_\s-]*/i, '');
    return stripped ? `BÀN ${stripped}` : `BÀN ${clean}`;
  }, [tableId]);

  useEffect(() => {
    // Tải thông tin khách nếu có lưu trong local storage
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('menugo_guest_phone');
      const savedName = localStorage.getItem('menugo_guest_name');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedName) setGuestName(savedName);
      if (savedPhone) {
        setInputPhone(savedPhone);
        lookupPublicCustomer(savedPhone, tableId, savedName || undefined)
          .then((cust) => setLoyaltyCustomer(cust))
          .catch(() => {});
      }
    }
  }, [tableId]);

  useEffect(() => {
    // Resolve QR token nếu tableId là chuỗi JWT hoặc token đã mã hóa
    const resolveTableToken = async () => {
      try {
        if (tableId.length > 20 || tableId.includes('.')) {
          const res = await apiFetch<{ tenantId?: string; branchId?: string; tableId?: string }>(
            `/tables/resolve?token=${encodeURIComponent(tableId)}`
          );
          if (res?.data?.tenantId) {
            setTenantId(res.data.tenantId);
          }
          if (res?.data?.branchId) {
            setBranchId(res.data.branchId);
          }
        }
      } catch (err) {
        console.warn('Could not resolve table token:', err);
      }
    };
    resolveTableToken();

    // Bàn chỉ chuyển sang có khách (OCCUPIED) khi khách thực sự đặt món qua giỏ hàng

    useCartStore.getState().setTableContext(
      tenantId || initialTenantId || 'default-tenant',
      branchId || initialBranchId || 'default-branch',
      tableId,
      displayTableName
    );

    const fetchMenu = async () => {
      try {
        setIsMenuLoading(true);
        // Scope menu theo đúng bàn QR (chặn leak menu cross-tenant)
        const res = await apiFetch<Array<Record<string, unknown>>>(
          `/menu/items?tableId=${encodeURIComponent(tableId)}`
        );
        let list = res?.data || (Array.isArray(res) ? res : []);

        // Fallback: nếu gọi theo tableId không có món, gọi không tham số tableId
        if (!Array.isArray(list) || list.length === 0) {
          const fallbackRes = await apiFetch<Array<Record<string, unknown>>>('/menu/items');
          list = fallbackRes?.data || (Array.isArray(fallbackRes) ? fallbackRes : []);
        }

        if (Array.isArray(list) && list.length > 0) {
          const normalized: MenuItemView[] = list.map((item: Record<string, unknown>, idx: number) => {
            const catObj =
              typeof item.category === 'object' && item.category !== null
                ? (item.category as Record<string, unknown>)
                : null;
            return {
              id: (item.id as string) || `item-${idx}`,
              name: (item.name as string) || 'Món',
              description: (item.description as string) || '',
              basePrice: Number(item.basePrice ?? item.price ?? 0),
              imageUrl: (item.imageUrl as string) || null,
              isSoldOut: Boolean(item.isSoldOut),
              categoryId: catObj
                ? String(catObj.id || catObj.name)
                : String(item.categoryId || item.category || 'Món chính'),
              category: catObj
                ? {
                    id: String(catObj.id || 'cat'),
                    name: String(catObj.name || 'Món'),
                    isDrink: Boolean(catObj.isDrink),
                  }
                : { id: String(item.category || 'all'), name: String(item.category || 'Món chính'), isDrink: false },
              modifierGroups: (item.modifierGroups as MenuItemView['modifierGroups']) || [],
            };
          });
          menuCache.set(tableId, normalized);
          setRawItems(normalized);

          // Trích xuất danh mục
          const catMap = new Map<string, string>();
          normalized.forEach((it) => {
            const catName = it.category?.name || (typeof it.category === 'string' ? it.category : 'Món chính');
            const catId = it.categoryId || catName;
            if (catName && !catMap.has(catId)) {
              catMap.set(catId, catName);
            }
          });
          if (catMap.size > 0) {
            const cats = Array.from(catMap.entries()).map(([id, name]) => ({ id, name }));
            categoriesCache.set(tableId, cats);
            setCategories(cats);
          }
        }
      } catch (err) {
        console.warn('Fallback mock menu items:', err);
      } finally {
        setIsMenuLoading(false);
      }
    };

    const fetchBranding = async () => {
      try {
        // Ưu tiên tableId (lookup bàn chính xác); kèm branch/tenant khi đã resolve
        const queryParams = new URLSearchParams();
        queryParams.set('tableId', tableId);
        const effectiveBranch = branchId || initialBranchId;
        const effectiveTenant = tenantId || initialTenantId;
        if (effectiveBranch && effectiveBranch !== 'default-branch') {
          queryParams.set('branchId', effectiveBranch);
        }
        if (effectiveTenant && effectiveTenant !== 'default-tenant') {
          queryParams.set('tenantId', effectiveTenant);
        }
        const endpoint = `/branding/public?${queryParams.toString()}`;
        const res = await apiFetch<Record<string, string>>(endpoint);
        const bData = res?.data;
        if (bData) {
          const brandObj = {
            restaurantName: bData.restaurantName || bData.name || 'MenuGO',
            address: bData.address || '',
            primaryColor: bData.primaryColor || '#00A389',
            logoUrl: bData.logoUrl || '',
            wifiSsid: bData.wifiSsid || '',
            wifiPassword: bData.wifiPassword || '',
            enablePaymentCall: bData.enablePaymentCall ?? true,
            enableStaffCall: bData.enableStaffCall ?? true,
          };
          brandingCache.set(tableId, brandObj);
          setBranding((prev) => ({
            ...prev,
            ...brandObj,
          }));
        }
      } catch (err) {
        console.warn('Fallback mock branding:', err);
      }
    };

    fetchMenu();
    fetchBranding();
  }, [tableId]);

  // Lắng nghe cập nhật logo / branding thời gian thực từ trang quản trị Cài đặt
  useEffect(() => {
    if (!isConnected) return;
    const handleBrandingUpdated = (updated: any) => {
      if (!updated) return;
      const brandObj = {
        restaurantName: updated.tenant?.name || updated.restaurantName || branding.restaurantName,
        address: updated.address || branding.address,
        primaryColor: updated.primaryColor || branding.primaryColor,
        logoUrl: updated.logoUrl || '',
        wifiSsid: updated.wifiSsid || '',
        wifiPassword: updated.wifiPassword || '',
        enablePaymentCall: updated.enablePaymentCall ?? branding.enablePaymentCall ?? true,
        enableStaffCall: updated.enableStaffCall ?? branding.enableStaffCall ?? true,
      };
      brandingCache.set(tableId, brandObj);
      setBranding((prev) => ({
        ...prev,
        ...brandObj,
      }));
    };
    on('branding:updated', handleBrandingUpdated);
    return () => {
      off('branding:updated', handleBrandingUpdated);
    };
  }, [isConnected, tableId, on, off, branding.restaurantName, branding.address, branding.primaryColor]);

  const handleSelectItem = (item: MenuItemView) => {
    setSelectedItem(item);
    setIsOptionsModalOpen(true);
  };

  const handleAddToCart = (
    item: MenuItemView,
    quantity: number,
    modifiers: SelectedModifier[],
    note: string
  ) => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      basePrice: item.basePrice,
      quantity,
      selectedModifiers: modifiers,
      note,
      imageUrl: item.imageUrl,
    });
    showToast(`Đã thêm ${quantity}x "${item.name}" vào giỏ hàng`);
  };

  // Tra cứu / Đăng ký SĐT tích điểm
  const handleLookupPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputPhone.trim();
    if (!clean) return;
    setLookingUpPhone(true);
    setLoyaltyMessage(null);
    try {
      const cust = await lookupPublicCustomer(
        clean,
        tableId,
        guestName !== 'Quý khách' ? guestName : undefined
      );
      setLoyaltyCustomer(cust);
      if (typeof window !== 'undefined') {
        localStorage.setItem('menugo_guest_phone', clean);
        if (cust.name) {
          localStorage.setItem('menugo_guest_name', cust.name);
          setGuestName(cust.name);
        }
      }
      const tierName = cust.tier?.name || 'Hội viên';
      setLoyaltyMessage(
        cust.points > 50
          ? `Chào mừng ${cust.name || clean}! Bạn đang có ${cust.points} điểm (${tierName}).`
          : `Đã kích hoạt tích điểm cho SĐT ${clean}! Bạn được tặng ${cust.points} điểm chào mừng (${tierName}).`
      );
      setTimeout(() => setShowLoyaltyModal(false), 1500);
    } catch (err: any) {
      setLoyaltyMessage(err?.message || 'Không thể tra cứu thông tin hội viên lúc này');
    } finally {
      setLookingUpPhone(false);
    }
  };

  // Gửi gọi nhân viên
  const handleCallStaff = async () => {
    const finalReason = callStaffReason.trim() || 'Gặp nhân viên hỗ trợ';
    try {
      await sendCustomerCall({
        tableId,
        tableName: displayTableName,
        type: 'STAFF',
        reason: finalReason,
      });
    } catch {}
    setCallStaffDone(true);
    setTimeout(() => {
      setCallStaffDone(false);
      setShowCallStaffModal(false);
      setCallStaffReason('');
      showToast(`Đã gửi yêu cầu "${finalReason}" tới nhân viên phục vụ!`);
    }, 1200);
  };

  // Gửi gọi thanh toán
  const handleCallPayment = async () => {
    try {
      await sendCustomerCall({
        tableId,
        tableName: displayTableName,
        type: 'PAYMENT',
        paymentMethod: paymentMethodChoice,
        reason: `Phương thức: ${paymentMethodChoice === 'VIETQR' ? 'Chuyển khoản' : 'Tiền mặt'}`,
      });
    } catch {}
    setCallPaymentDone(true);
    setTimeout(() => {
      setCallPaymentDone(false);
      setShowCallPaymentModal(false);
      showToast('Đã gửi thông báo thanh toán tới thu ngân quầy!');
    }, 1200);
  };

  // Gửi đánh giá
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendCustomerReview({
        tableId,
        tableName: displayTableName,
        rating,
        comment: reviewNote,
        customerName: guestName !== 'Quý khách' ? guestName : undefined,
        customerPhone: inputPhone || undefined,
      });
    } catch {}
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewSubmitted(false);
      setShowReviewModal(false);
      showToast('Cảm ơn bạn đã đóng góp ý kiến đánh giá!');
    }, 1500);
  };

  const effectiveTenantId = tenantId || initialTenantId;
  const effectiveBranchId = branchId || initialBranchId;
  const basePath =
    effectiveTenantId && effectiveBranchId
      ? `/${effectiveTenantId}/${effectiveBranchId}/table/${tableId}`
      : `/table/${tableId}`;

  const handleGoToMenu = () => {
    setCurrentView('menu');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `${basePath}/menu`);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleGoToHome = () => {
    setCurrentView('home');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', basePath);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const totalCartCount = getTotalCount();
  const totalCartAmount = getTotalAmount();

  // Màn hình Loading tối giản: chỉ 1 vòng tròn màu xanh lá ở giữa
  if (isMenuLoading && rawItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00A389]/20 border-t-[#00A389] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0F172A] flex flex-col justify-start">
      {/* Toast thông báo nhanh */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-[#0F172A] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in slide-in-from-top duration-200 text-[13px] font-semibold">
          <CheckCircle2 size={17} className="text-[#00A389] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Wrapper canh giữa theo khung điện thoại di động */}
      <div className="w-full max-w-md mx-auto bg-white min-h-screen flex flex-col shadow-sm relative pb-16">
        {currentView === 'home' ? (
          <>
              {/* ========================================================= */}
            {/* TOP HEADER TRANG CHỦ: Menu, Tên thương hiệu, Địa chỉ       */}
            {/* ========================================================= */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  onClick={() => setShowRestaurantInfo(true)}
                  className="p-1.5 -ml-1 text-[#334155] hover:text-[#0F172A] rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                  aria-label="Thông tin nhà hàng"
                >
                  <MenuIcon size={22} />
                </button>

                {branding.logoUrl ? (
                  <div className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={branding.logoUrl}
                      alt={branding.restaurantName || 'Logo quán'}
                      className="w-full h-full object-contain p-0.5"
                    />
                  </div>
                ) : null}

                <div className="min-w-0 flex-1">
                  <h1 className="font-black text-[16px] text-[#0F172A] tracking-tight uppercase truncate">
                    {branding.restaurantName || 'Thực đơn gọi món'}
                  </h1>
                  {branding.address ? (
                    <div className="flex items-center gap-1 text-[11.5px] text-[#64748B] truncate">
                      <MapPin size={11} className="text-[#00A389] shrink-0" />
                      <span className="truncate">{branding.address}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </header>

            {/* Nội dung trang chủ QR */}
            <div className="p-4 space-y-4">
              {/* ========================================================= */}
              {/* 1. HERO PROMO BANNER (Như hình iPOS O2O)                   */}
              {/* ========================================================= */}
              <div className="relative rounded-[26px] overflow-hidden shadow-sm border border-amber-200/60 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-5 aspect-[16/9] flex flex-col justify-between group">
                <div className="absolute inset-0 z-0">
                  <Image
                    src="/images/o2o_menu_banner.jpg"
                    alt="Menu Điện Tử"
                    fill
                    priority
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-amber-200 border border-white/20">
                      Quét QRCode tại bàn
                    </div>
                    {branding.restaurantName ? (
                      <h2 className="text-[20px] font-black text-white leading-tight drop-shadow-sm">
                        {branding.restaurantName}
                      </h2>
                    ) : null}
                    <div className="text-[17px] font-black text-amber-300 drop-shadow-sm tracking-wide">
                      MENU ĐIỆN TỬ
                    </div>
                    <p className="text-[11.5px] font-medium text-slate-100 drop-shadow-sm max-w-[210px] leading-snug">
                      “Gọi món”, “gọi nhân viên” trên chính điện thoại của bạn
                    </p>
                  </div>

                  {branding.logoUrl ? (
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/95 p-1.5 shadow-md border border-white/50 flex items-center justify-center overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={branding.logoUrl}
                        alt={branding.restaurantName || 'Logo quán'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="relative z-10 flex items-center gap-1.5 pt-2">
                  <span className="w-5 h-1.5 rounded-full bg-white" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                </div>
              </div>

              {/* ========================================================= */}
              {/* 2. LỜI CHÀO & VỊ TRÍ BÀN                                  */}
              {/* ========================================================= */}
              <div className="text-center space-y-1 pt-1 pb-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[16px] font-bold text-[#0F172A]">
                    {greetingText}{' '}
                    <span className="text-[#00A389] font-black">{guestName}</span>
                  </span>
                  <button
                    onClick={() => {
                      setTempGuestName(guestName === 'Quý khách' ? '' : guestName);
                      setShowEditName(true);
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-[#00A389] transition-colors"
                    title="Thay đổi tên xưng hô"
                  >
                    <Pencil size={13} />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[13px] text-[#475569] font-medium">
                  <span>Chúng tôi sẽ trả đồ cho bạn tại bàn:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-black text-white font-mono font-black text-[12px] tracking-wide shadow-2xs">
                    {displayTableName}
                  </span>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 3. THẺ TÍCH ĐIỂM HỘI VIÊN (Màu pastel xanh cyan/teal)     */}
              {/* ========================================================= */}
              <div
                onClick={() => setShowLoyaltyModal(true)}
                className="p-3.5 sm:p-4 rounded-[22px] bg-gradient-to-r from-[#E0F2FE] via-[#E6F7F4] to-[#F0FDFA] border border-[#BAE6FD]/80 hover:border-[#00A389]/60 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#00A389] text-white flex items-center justify-center shadow-xs shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div className="min-w-0">
                    {loyaltyCustomer ? (
                      <>
                        <div className="flex items-center gap-1.5 font-black text-[13px] text-[#0369A1] truncate">
                          <Crown size={13} className="text-amber-500" />
                          <span>{loyaltyCustomer.phone}</span>
                          <span className="text-[10.5px] px-1.5 py-0.2 rounded-md bg-white/80 font-bold border border-sky-200">
                            {loyaltyCustomer.tier?.name || 'Hội viên'}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-[#0284C7] font-medium mt-0.5">
                          Tích luỹ: <strong className="font-mono">{loyaltyCustomer.points} điểm</strong>{' '}
                          {loyaltyCustomer.discountRate > 0 && `(Giảm ${loyaltyCustomer.discountRate}%)`}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-black text-[13.5px] text-[#0284C7] tracking-tight">
                          Nhập số điện thoại để tích điểm
                        </h3>
                        <p className="text-[11.5px] text-[#0369A1]/80 font-medium mt-0.5">
                          Nhận ưu đãi giảm giá và điểm thưởng trên hoá đơn
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#0284C7] shrink-0" />
              </div>

              {/* ========================================================= */}
              {/* NÚT CHỨC NĂNG: Gọi thanh toán, Gọi nhân viên, Đánh giá (ẩn/hiện theo Cài đặt) */}
              {/* ========================================================= */}
              <div className={`grid gap-2.5 ${branding.enablePaymentCall === false && branding.enableStaffCall === false ? 'grid-cols-1' : branding.enablePaymentCall === false || branding.enableStaffCall === false ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {/* Gọi thanh toán */}
                {branding.enablePaymentCall !== false && (
                <button
                  onClick={() => setShowCallPaymentModal(true)}
                  className="p-3.5 rounded-[22px] bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] border border-[#BBF7D0] hover:border-emerald-300 text-left flex flex-col justify-between shadow-2xs hover:shadow-xs active:scale-[0.97] transition-all h-28"
                >
                  <span className="font-black text-[12.5px] text-[#166534] leading-tight">
                    Gọi thanh toán
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-xs flex items-center justify-center text-emerald-600 self-end">
                    <Wallet size={20} />
                  </div>
                </button>
                )}

                {/* Gọi nhân viên */}
                {branding.enableStaffCall !== false && (
                <button
                  onClick={() => setShowCallStaffModal(true)}
                  className="p-3.5 rounded-[22px] bg-gradient-to-b from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] hover:border-blue-300 text-left flex flex-col justify-between shadow-2xs hover:shadow-xs active:scale-[0.97] transition-all h-28"
                >
                  <span className="font-black text-[12.5px] text-[#1E40AF] leading-tight">
                    Gọi nhân viên
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-xs flex items-center justify-center text-blue-600 self-end">
                    <UserCheck size={20} />
                  </div>
                </button>
                )}

                {/* Đánh giá */}
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="p-3.5 rounded-[22px] bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7] border border-[#FDE68A] hover:border-amber-300 text-left flex flex-col justify-between shadow-2xs hover:shadow-xs active:scale-[0.97] transition-all h-28"
                >
                  <span className="font-black text-[12.5px] text-[#92400E] leading-tight">
                    Đánh giá
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-xs flex items-center justify-center text-amber-500 self-end">
                    <Star size={20} className="fill-amber-400 text-amber-400" />
                  </div>
                </button>
              </div>

              {/* ========================================================= */}
              {/* 5. BANNER CTA LỚN: Xem Menu - Gọi món                      */}
              {/* ========================================================= */}
              <div
                onClick={handleGoToMenu}
                className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-[#00A389] via-[#059669] to-[#047857] text-white shadow-md shadow-[#00A389]/25 flex items-center justify-between gap-4 cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all relative overflow-hidden"
              >
                <span className="text-[17px] font-black tracking-wide">
                  Xem Menu - Gọi món
                </span>

                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                  <ChevronRight size={22} className="text-white" strokeWidth={2.5} />
                </div>            </div>
            </div>
          </>
        ) : (
          <>
            {/* ========================================================= */}
            {/* TOP HEADER MENU: Chuẩn phong cách Mobile OrderScreen       */}
            {/* ========================================================= */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-[#F1F5F9] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={handleGoToHome}
                  className="w-9 h-9 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] hover:bg-slate-200 text-[#0F172A] flex items-center justify-center shrink-0 active:scale-95 transition-all"
                  aria-label="Về trang chủ"
                >
                  <ArrowLeft size={18} color="#0F172A" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-extrabold text-[#0F172A] leading-tight truncate">
                    {branding.restaurantName || 'Thao Tác Gọi Món'}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-bold text-[#64748B]">Bàn:</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#E6F7F4] text-[#00A389] font-mono font-bold text-[11px]">
                      {displayTableName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="w-9 h-9 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] text-[#00A389] hover:bg-[#E6F7F4] flex items-center justify-center relative active:scale-95 transition-all"
                  title="Xem giỏ hàng"
                  aria-label="Xem giỏ hàng"
                >
                  <ShoppingCart size={19} className="text-[#00A389]" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[9.5px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                      {totalCartCount}
                    </span>
                  )}
                </button>
              </div>
            </header>

            {/* Nội dung trang Thực đơn gọi món */}
            <div className="p-4 space-y-3.5">
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00A389]" />
                  <h3 className="font-black text-[16px] text-[#0F172A]">Thực đơn quán</h3>
                </div>
                <span className="text-[12px] font-bold text-[#64748B]">
                  {menuItems.length} món ngon
                </span>
              </div>

              <MenuItemList
                items={menuItems}
                categories={categories}
                isLoading={isMenuLoading && menuItems.length === 0}
                onSelectItem={handleSelectItem}
                primaryColor={branding.primaryColor}
              />
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* NÚT LỊCH SỬ MÓN ĐÃ GỌI FLOATING GÓC DƯỚI BÊN PHẢI (Cookie)  */}
        {/* ========================================================= */}
        <button
          type="button"
          onClick={() => setShowOrderHistoryModal(true)}
          className="fixed z-40 w-13 h-13 rounded-full bg-white hover:bg-slate-50 border-2 border-[#00A389] text-[#00A389] shadow-xl flex items-center justify-center active:scale-95 transition-all duration-300 ease-in-out right-4 bottom-6"
          title="Lịch sử"
          aria-label="Lịch sử"
        >
          <History size={23} strokeWidth={2.4} />
          {historyItemsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white text-[10px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              {historyItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: TÍCH ĐIỂM HỘI VIÊN BẰNG SĐT                      */}
      {/* ========================================================= */}
      {showLoyaltyModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="font-black text-[16px] text-[#0F172A]">Tích điểm hội viên</h4>
                  <p className="text-[11.5px] text-[#64748B]">Áp dụng cho bàn {displayTableName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoyaltyModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleLookupPhone} className="space-y-3.5 text-[13px]">
              <div>
                <label className="block font-bold text-[#0F172A] mb-1">Số điện thoại của bạn</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="tel"
                    required
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-bold text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden"
                  />
                </div>
              </div>

              {loyaltyMessage && (
                <div className="p-3 bg-[#E6F7F4] border border-[#00A389]/30 rounded-xl text-[12px] text-[#00A389] font-bold flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{loyaltyMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLoyaltyModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] font-bold text-[#64748B]"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={lookingUpPhone}
                  className="px-5 py-2 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold shadow-sm disabled:opacity-50"
                >
                  {lookingUpPhone ? 'Đang kiểm tra...' : 'Xác nhận tích điểm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: GỌI NHÂN VIÊN                                     */}
      {/* ========================================================= */}
      {showCallStaffModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h4 className="font-black text-[16px] text-[#0F172A]">Gọi nhân viên</h4>
                  <p className="text-[11.5px] text-[#64748B]">Phục vụ bàn {displayTableName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCallStaffModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="staffReasonInput" className="block font-bold text-[13px] text-[#0F172A]">
                Nội dung yêu cầu cần hỗ trợ:
              </label>
              <textarea
                id="staffReasonInput"
                rows={3}
                value={callStaffReason}
                onChange={(e) => setCallStaffReason(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-[13.5px] text-[#0F172A] placeholder:text-slate-400 focus:outline-hidden focus:border-[#00A389] focus:ring-2 focus:ring-[#00A389]/20 transition-all resize-none font-medium leading-relaxed bg-[#F8FAFC] focus:bg-white"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCallStaffModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] font-bold text-[#64748B] hover:bg-slate-50 transition-colors text-[13px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCallStaff}
                disabled={callStaffDone}
                className="px-5 py-2.5 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold shadow-sm active:scale-95 transition-all text-[13px] disabled:opacity-50"
              >
                {callStaffDone ? 'Đã gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: GỌI THANH TOÁN                                   */}
      {/* ========================================================= */}
      {showCallPaymentModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet size={18} />
                </div>
                <div>
                  <h4 className="font-black text-[16px] text-[#0F172A]">Gọi thanh toán</h4>
                  <p className="text-[11.5px] text-[#64748B]">Bàn {displayTableName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCallPaymentModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-2 text-[12.5px]">
              <span className="block font-bold text-[#0F172A] mb-1">Hình thức thanh toán dự kiến:</span>
              <button
                type="button"
                onClick={() => setPaymentMethodChoice('VIETQR')}
                className={`w-full p-3 rounded-xl border text-left font-bold transition-all flex items-center justify-between ${
                  paymentMethodChoice === 'VIETQR'
                    ? 'border-[#00A389] bg-[#E6F7F4] text-[#00A389]'
                    : 'border-slate-200 text-[#475569] hover:bg-slate-50'
                }`}
              >
                <span>Chuyển khoản</span>
                {paymentMethodChoice === 'VIETQR' && <CheckCircle2 size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethodChoice('CASH')}
                className={`w-full p-3 rounded-xl border text-left font-bold transition-all flex items-center justify-between ${
                  paymentMethodChoice === 'CASH'
                    ? 'border-[#00A389] bg-[#E6F7F4] text-[#00A389]'
                    : 'border-slate-200 text-[#475569] hover:bg-slate-50'
                }`}
              >
                <span>Tiền mặt tại bàn</span>
                {paymentMethodChoice === 'CASH' && <CheckCircle2 size={16} />}
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCallPaymentModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] font-bold text-[#64748B]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCallPayment}
                disabled={callPaymentDone}
                className="px-5 py-2 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold shadow-sm"
              >
                {callPaymentDone ? 'Đã thông báo...' : 'Báo thu ngân'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ĐÁNH GIÁ & GÓP Ý                                  */}
      {/* ========================================================= */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Star size={18} className="fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-black text-[16px] text-[#0F172A]">Đánh giá trải nghiệm</h4>
                  <p className="text-[11.5px] text-[#64748B]">Bàn {displayTableName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3.5">
              <div className="flex justify-center items-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1.5 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={28}
                      className={
                        s <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-100 text-slate-300'
                      }
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[12.5px] font-bold text-[#0F172A] mb-1">
                  Ý kiến đóng góp (tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden resize-none"
                />
              </div>

              {reviewSubmitted && (
                <div className="p-3 bg-[#E6F7F4] border border-[#00A389]/30 rounded-xl text-[12px] text-[#00A389] font-bold flex items-center gap-2">
                  <Heart size={16} className="fill-[#00A389] text-[#00A389]" />
                  <span>Cảm ơn bạn! Đánh giá đã được gửi.</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] font-bold text-[#64748B] text-[13px]"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitted}
                  className="px-5 py-2 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] shadow-sm disabled:opacity-50"
                >
                  Gửi đánh giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: ĐỔI TÊN XƯNG HÔ                                  */}
      {/* ========================================================= */}
      {showEditName && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-xs w-full p-5 shadow-2xl border border-[#E2E8F0] space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-black text-[15px] text-[#0F172A]">Tên xưng hô của bạn</h4>
            <input
              type="text"
              value={tempGuestName}
              onChange={(e) => setTempGuestName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] font-bold text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditName(false)}
                className="px-3.5 py-2 rounded-xl border text-[12px] font-bold text-[#64748B]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const final = tempGuestName.trim() || 'Quý khách';
                  setGuestName(final);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('menugo_guest_name', final);
                  }
                  setShowEditName(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#00A389] text-white text-[12px] font-extrabold"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: THÔNG TIN NHÀ HÀNG & WIFI                        */}
      {/* ========================================================= */}
      {showRestaurantInfo && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-[16px] text-[#0F172A]">Thông tin quán</h4>
              <button
                onClick={() => setShowRestaurantInfo(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-3 text-[12.5px] bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
              {branding.logoUrl ? (
                <div className="w-16 h-16 rounded-2xl border border-[#E2E8F0] bg-white p-1.5 mx-auto flex items-center justify-center shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={branding.logoUrl}
                    alt={branding.restaurantName || 'Logo quán'}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : null}
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-[#00A389] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#0F172A] block">{branding.restaurantName}</span>
                  <span className="text-[#64748B] text-[12px]">{branding.address}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <PhoneCall size={13} className="text-[#00A389]" />
                  <span>Bàn phục vụ:</span>
                </span>
                <span className="font-black text-[#0F172A] font-mono">{displayTableName}</span>
              </div>
            </div>

            <button
              onClick={() => setShowRestaurantInfo(false)}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-extrabold text-[12.5px]"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TÙY CHỌN MÓN & GIỎ HÀNG                                   */}
      {/* ========================================================= */}
      <CustomerItemOptionsModal
        item={selectedItem}
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        onAddToCart={handleAddToCart}
        primaryColor={branding.primaryColor}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tableId={tableId}
        tableName={displayTableName}
        tenantId={tenantId}
        branchId={branchId}
        primaryColor={branding.primaryColor}
        onOrderSuccess={() => {
          setIsCartOpen(false);
          setShowOrderHistoryModal(true);
          showToast('Đã gửi món thành công! Bếp đang thực hiện.');
        }}
      />

      <CustomerOrderHistoryModal
        isOpen={showOrderHistoryModal}
        onClose={() => setShowOrderHistoryModal(false)}
        tableId={tableId}
        displayTableName={displayTableName}
        tenantId={tenantId}
        branchId={branchId}
        onGoToMenu={handleGoToMenu}
        primaryColor={branding.primaryColor}
        paymentEnabled={branding.enablePaymentCall !== false}
      />
    </div>
  );
}
