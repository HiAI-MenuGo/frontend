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
import {
  ShoppingBag,
  Wifi,
  MapPin,
  Menu as MenuIcon,
  Pencil,
  ChevronRight,
  Wallet,
  UserCheck,
  Star,
  BookOpen,
  PhoneCall,
  X,
  CheckCircle2,
  Phone,
  Sparkles,
  Crown,
  Bell,
  Heart,
  ArrowLeft,
} from 'lucide-react';
import LanguageSwitcher from '../../../components/common/LanguageSwitcher';
import { useI18n } from '../../../context/i18nContext';
import apiFetch from '../../../lib/api';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { lookupCustomerByPhone } from '@/lib/api/customers.api';
import type { LoyaltyCustomerDTO } from '@/lib/api/types';
import { getSocket } from '@/lib/socket';

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
  const { t } = useI18n();
  const menuSectionRef = useRef<HTMLDivElement>(null);

  const [currentView, setCurrentView] = useState<'home' | 'menu'>(initialView);

  useEffect(() => {
    if (initialView) {
      setCurrentView(initialView);
    }
  }, [initialView]);

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([
    { id: 'cat-1', name: 'Trà Trái Cây' },
    { id: 'cat-2', name: 'Cà Phê' },
    { id: 'cat-3', name: 'Đồ Ăn Nhẹ' },
  ]);

  const [rawItems, setRawItems] = useState<MenuItemView[]>([
    {
      id: 'item-1',
      name: 'Trà Đào Cam Sả',
      description: 'Hương vị đào tươi giòn ngọt kết hợp cam vàng mọng nước và sả thanh mát.',
      basePrice: 45000,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=500&fit=crop',
      isSoldOut: false,
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Trà Trái Cây', isDrink: true },
      modifierGroups: [
        {
          modifierGroup: {
            id: 'mod-size',
            name: 'Kích cỡ (Size)',
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: [
              { id: 'opt-m', name: 'Size M', extraPrice: 0, isDefault: true, isSoldOut: false },
              { id: 'opt-l', name: 'Size L (+10.000đ)', extraPrice: 10000, isDefault: false, isSoldOut: false },
            ],
          },
        },
        {
          modifierGroup: {
            id: 'mod-sugar',
            name: 'Độ ngọt (Đường)',
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: [
              { id: 'opt-s100', name: '100% Đường', extraPrice: 0, isDefault: true, isSoldOut: false },
              { id: 'opt-s70', name: '70% Đường', extraPrice: 0, isDefault: false, isSoldOut: false },
              { id: 'opt-s50', name: '50% Đường', extraPrice: 0, isDefault: false, isSoldOut: false },
              { id: 'opt-s0', name: 'Không đường', extraPrice: 0, isDefault: false, isSoldOut: false },
            ],
          },
        },
        {
          modifierGroup: {
            id: 'mod-ice',
            name: 'Lượng đá',
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: [
              { id: 'opt-i100', name: '100% Đá', extraPrice: 0, isDefault: true, isSoldOut: false },
              { id: 'opt-i50', name: '50% Đá', extraPrice: 0, isDefault: false, isSoldOut: false },
              { id: 'opt-i0', name: 'Không đá', extraPrice: 0, isDefault: false, isSoldOut: false },
            ],
          },
        },
      ],
    },
    {
      id: 'item-2',
      name: 'Cà Phê Muối Đặc Biệt',
      description: 'Cà phê Robusta Đắk Lắk đậm đà hòa quyện cùng lớp kem muối béo ngậy mằn mặn.',
      basePrice: 35000,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&h=500&fit=crop',
      isSoldOut: false,
      categoryId: 'cat-2',
      category: { id: 'cat-2', name: 'Cà Phê', isDrink: true },
    },
    {
      id: 'item-3',
      name: 'Bạc Xỉu Sữa Tươi 3 Tầng',
      description: 'Hòa quyện giữa sữa tươi béo thơm, sữa đặc ngọt ngào và hương cà phê nguyên chất.',
      basePrice: 38000,
      imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&h=500&fit=crop',
      isSoldOut: false,
      categoryId: 'cat-2',
      category: { id: 'cat-2', name: 'Cà Phê', isDrink: true },
    },
    {
      id: 'item-4',
      name: 'Khoai Tây Chiên Phô Mai',
      description: 'Khoai tây cắt ziczac chiên vàng ruộm lắc bột phô mai béo thơm ngất ngây.',
      basePrice: 39000,
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&h=500&fit=crop',
      isSoldOut: false,
      categoryId: 'cat-3',
      category: { id: 'cat-3', name: 'Đồ Ăn Nhẹ', isDrink: false },
    },
    {
      id: 'item-5',
      name: 'Bánh Croissant Bơ Pháp',
      description: 'Bánh sừng bò ngàn lớp thơm lừng bơ Pháp cao cấp, vỏ ngoài giòn xốp bên trong mềm ẩm.',
      basePrice: 42000,
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&h=500&fit=crop',
      isSoldOut: false,
      categoryId: 'cat-3',
      category: { id: 'cat-3', name: 'Đồ Ăn Nhẹ', isDrink: false },
    },
  ]);

  const [branding, setBranding] = useState({
    restaurantName: 'MenuGO',
    address: '170 Bàu Cát, Phường 14, Tân Bình, Hồ Chí Minh',
    primaryColor: '#00A389',
    logoUrl: '',
    wifiSsid: 'MenuGO_Guest_5G',
    wifiPassword: '',
  });

  const { items: menuItems } = useMenuSoldOut(rawItems);
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
  const [callStaffReason, setCallStaffReason] = useState('Gặp nhân viên');
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

  // Toast thông báo ngắn
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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
    if (clean.startsWith('BAN') || clean.startsWith('TABLE') || clean.startsWith('BÀN')) {
      return clean;
    }
    return `BAN${clean}`;
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
        lookupCustomerByPhone(savedPhone)
          .then((cust) => setLoyaltyCustomer(cust))
          .catch(() => {});
      }
    }
  }, []);

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

    useCartStore.getState().setTableContext(
      tenantId || initialTenantId || 'default-tenant',
      branchId || initialBranchId || 'default-branch',
      tableId,
      displayTableName
    );

    const fetchMenu = async () => {
      try {
        const res = await apiFetch<Array<Record<string, unknown>>>('/menu/items');
        const list = res?.data || res;
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
            setCategories(Array.from(catMap.entries()).map(([id, name]) => ({ id, name })));
          }
        }
      } catch (err) {
        console.warn('Fallback mock menu items:', err);
      }
    };

    const fetchBranding = async () => {
      try {
        const res = await apiFetch<Record<string, string>>('/branding');
        const bData = res?.data;
        if (bData) {
          setBranding((prev) => ({
            ...prev,
            restaurantName: bData.name || bData.restaurantName || prev.restaurantName,
            primaryColor: bData.primaryColor || prev.primaryColor,
            logoUrl: bData.logoUrl || prev.logoUrl,
            wifiSsid: bData.wifiSsid || prev.wifiSsid,
            wifiPassword: bData.wifiPassword || prev.wifiPassword,
          }));
        }
      } catch (err) {
        console.warn('Fallback mock branding:', err);
      }
    };

    fetchMenu();
    fetchBranding();
  }, [tableId]);

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
      const cust = await lookupCustomerByPhone(clean);
      setLoyaltyCustomer(cust);
      if (typeof window !== 'undefined') {
        localStorage.setItem('menugo_guest_phone', clean);
        if (cust.name) {
          localStorage.setItem('menugo_guest_name', cust.name);
          setGuestName(cust.name);
        }
      }
      setLoyaltyMessage(`Chào mừng ${cust.name || clean}! Bạn đang có ${cust.points} điểm.`);
      setTimeout(() => setShowLoyaltyModal(false), 1500);
    } catch {
      // Nếu chưa có, kích hoạt đăng ký mới cho khách tại bàn
      const fakeNew: LoyaltyCustomerDTO = {
        id: `cust-${Date.now()}`,
        name: clean,
        phone: clean,
        points: 50,
        discountRate: 0,
        totalSpent: 0,
        tier: { id: 'tier-bronze', name: 'Đồng', discountRate: 0, color: '#B45309' },
      };
      setLoyaltyCustomer(fakeNew);
      if (typeof window !== 'undefined') {
        localStorage.setItem('menugo_guest_phone', clean);
      }
      setLoyaltyMessage('Số điện thoại mới đã được ghi nhận tích điểm cho hoá đơn bàn này!');
      setTimeout(() => setShowLoyaltyModal(false), 1500);
    } finally {
      setLookingUpPhone(false);
    }
  };

  // Gửi gọi nhân viên
  const handleCallStaff = () => {
    try {
      const socket = getSocket();
      socket?.emit('call_staff:request', {
        tableId,
        tableName: displayTableName,
        reason: callStaffReason,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      });
    } catch {}
    setCallStaffDone(true);
    setTimeout(() => {
      setCallStaffDone(false);
      setShowCallStaffModal(false);
      showToast(`Đã gửi yêu cầu "${callStaffReason}" tới nhân viên phục vụ!`);
    }, 1200);
  };

  // Gửi gọi thanh toán
  const handleCallPayment = () => {
    try {
      const socket = getSocket();
      socket?.emit('call_staff:request', {
        tableId,
        tableName: displayTableName,
        reason: `Yêu cầu thanh toán (${paymentMethodChoice === 'VIETQR' ? 'VietQR' : 'Tiền mặt'})`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
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
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
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
    router.push(`${basePath}/menu`);
  };

  const handleGoToHome = () => {
    setCurrentView('home');
    router.push(basePath);
  };

  const totalCartCount = getTotalCount();
  const totalCartAmount = getTotalAmount();

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
      <div className="w-full max-w-md mx-auto bg-white min-h-screen flex flex-col shadow-sm relative pb-28">
        {currentView === 'home' ? (
          <>
            {/* ========================================================= */}
            {/* TOP HEADER TRANG CHỦ: Menu, Tên thương hiệu, Địa chỉ       */}
            {/* ========================================================= */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setShowRestaurantInfo(true)}
                  className="p-1.5 -ml-1 text-[#334155] hover:text-[#0F172A] rounded-xl hover:bg-slate-100 transition-colors"
                  aria-label="Thông tin nhà hàng"
                >
                  <MenuIcon size={22} />
                </button>
                <div className="min-w-0">
                  <h1 className="font-black text-[16px] text-[#0F172A] tracking-tight uppercase truncate">
                    {branding.restaurantName || 'MenuGO'}
                  </h1>
                  <div className="flex items-center gap-1 text-[11.5px] text-[#64748B] truncate">
                    <MapPin size={11} className="text-[#00A389] shrink-0" />
                    <span className="truncate">{branding.address}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <LanguageSwitcher />
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
                    alt="MenuGO O2O Menu Điện Tử"
                    fill
                    priority
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 space-y-1">
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-amber-200 border border-white/20">
                    Quét QRCode tại bàn
                  </div>
                  <h2 className="text-[20px] font-black text-white leading-tight drop-shadow-sm">
                    MenuGO O2O
                  </h2>
                  <div className="text-[17px] font-black text-amber-300 drop-shadow-sm tracking-wide">
                    MENU ĐIỆN TỬ
                  </div>
                  <p className="text-[11.5px] font-medium text-slate-100 drop-shadow-sm max-w-[210px] leading-snug">
                    “Gọi món”, “gọi nhân viên” trên chính điện thoại của bạn
                  </p>
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
                          Tích luỹ: <strong className="font-mono">{loyaltyCustomer.points} pts</strong>{' '}
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
              {/* 4. BA NÚT CHỨC NĂNG: Gọi thanh toán, Gọi nhân viên, Đánh giá */}
              {/* ========================================================= */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Gọi thanh toán */}
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

                {/* Gọi nhân viên */}
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
                <div className="relative z-10 flex items-center gap-3">
                  <span className="text-[17px] font-black tracking-wide">
                    Xem Menu - Gọi món
                  </span>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <ChevronRight size={16} className="text-white" />
                  </div>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                  <BookOpen size={24} className="text-white" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ========================================================= */}
            {/* TOP HEADER MENU: Nút Back về Trang chủ, Tên bàn           */}
            {/* ========================================================= */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3.5 py-3 border-b border-[#F1F5F9] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={handleGoToHome}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[13px] active:scale-95 transition-all shrink-0 shadow-2xs cursor-pointer border border-slate-200/60"
                  aria-label="Về trang chủ"
                >
                  <ArrowLeft size={17} className="text-[#00A389]" />
                  <span>Trang chủ</span>
                </button>
                <div className="h-4 w-px bg-slate-200 shrink-0" />
                <div className="min-w-0 flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase hidden xs:inline">Bàn</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-black text-white font-mono font-black text-[12px] tracking-wide shadow-2xs shrink-0">
                    {displayTableName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <LanguageSwitcher />
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
                onSelectItem={handleSelectItem}
                primaryColor={branding.primaryColor}
              />
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* NÚT GỌI NHÂN VIÊN FLOATING GÓC DƯỚI BÊN PHẢI (Loa/Chuông)  */}
        {/* ========================================================= */}
        <button
          onClick={() => setShowCallStaffModal(true)}
          className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full bg-[#FEF3C7] hover:bg-[#FDE68A] border-2 border-amber-300 text-amber-600 shadow-xl flex items-center justify-center active:scale-95 transition-all"
          title="Gọi phục vụ nhanh"
          aria-label="Gọi phục vụ"
        >
          <Bell size={24} className="fill-amber-500 text-amber-600" />
        </button>

        {/* Thanh Giỏ Hàng Sticky Bottom */}
        {totalCartCount > 0 && (
          <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom duration-300">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="w-full py-3.5 px-5 rounded-2xl font-black text-white bg-[#00A389] hover:bg-[#008f77] flex items-center justify-between shadow-xl shadow-[#00A389]/30 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-2 bg-amber-400 text-slate-900 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {totalCartCount}
                  </span>
                </div>
                <span className="text-[13.5px] font-black">{t('cart.viewCart', 'Xem giỏ hàng')}</span>
              </div>
              <span className="text-[14px] font-mono font-black tracking-wide">
                {totalCartAmount.toLocaleString('vi-VN')}đ
              </span>
            </button>
          </div>
        )}
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
                    placeholder="0912 345 678"
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[14px] font-mono font-bold text-[#0F172A] focus:bg-white focus:border-[#00A389] focus:outline-hidden"
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

            <div className="space-y-2 text-[12.5px]">
              <span className="block font-bold text-[#0F172A] mb-1">Chọn yêu cầu cần hỗ trợ:</span>
              {[
                'Gặp nhân viên hỗ trợ',
                'Xin thêm đá',
                'Xin thêm nước lọc',
                'Lấy thêm giấy ăn / muỗng đũa',
                'Dọn bàn',
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCallStaffReason(r)}
                  className={`w-full p-2.5 rounded-xl border text-left font-bold transition-all flex items-center justify-between ${
                    callStaffReason === r
                      ? 'border-[#00A389] bg-[#E6F7F4] text-[#00A389]'
                      : 'border-slate-200 text-[#475569] hover:bg-slate-50'
                  }`}
                >
                  <span>{r}</span>
                  {callStaffReason === r && <CheckCircle2 size={15} />}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCallStaffModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] font-bold text-[#64748B]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCallStaff}
                disabled={callStaffDone}
                className="px-5 py-2 rounded-xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold shadow-sm"
              >
                {callStaffDone ? 'Đã gọi...' : 'Gửi yêu cầu'}
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
                <span>Chuyển khoản VietQR (Quét mã)</span>
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
                  placeholder="Món ăn ngon, phục vụ nhanh chóng và nhiệt tình..."
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
              placeholder="Ví dụ: Anh Tuấn, Chị Mai..."
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
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-[#00A389] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#0F172A] block">{branding.restaurantName}</span>
                  <span className="text-[#64748B] text-[12px]">{branding.address}</span>
                </div>
              </div>

              {branding.wifiSsid && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    <Wifi size={14} className="text-amber-500" />
                    <span>Wifi:</span>
                  </span>
                  <span className="font-bold text-[#0F172A] font-mono">{branding.wifiSsid}</span>
                </div>
              )}

              {branding.wifiPassword && (
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Mật khẩu:</span>
                  <span className="font-bold text-[#0F172A] font-mono">{branding.wifiPassword}</span>
                </div>
              )}

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
      />
    </div>
  );
}
