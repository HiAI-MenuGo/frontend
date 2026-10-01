'use client';

import React, { useState, useEffect, use } from 'react';
import MenuItemList from './MenuItemList';
import CustomerItemOptionsModal from './CustomerItemOptionsModal';
import CartDrawer from './CartDrawer';
import { MenuItemView, useMenuSoldOut } from '../hooks/useMenuSoldOut';
import useCartStore, { SelectedModifier } from '../../../stores/cart.store';
import { ShoppingBag, Wifi, MapPin } from 'lucide-react';
import LanguageSwitcher from '../../../components/common/LanguageSwitcher';
import apiFetch from '../../../lib/api';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ tableId: string }>;
}

export default function TableMenuPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const tableId = resolvedParams.tableId;

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
        {
          modifierGroup: {
            id: 'mod-topping',
            name: 'Topping thêm',
            minSelect: 0,
            maxSelect: 4,
            isRequired: false,
            options: [
              { id: 'opt-t1', name: 'Trân Châu Trắng', extraPrice: 10000, isDefault: false, isSoldOut: false },
              { id: 'opt-t2', name: 'Kem Cheese', extraPrice: 12000, isDefault: false, isSoldOut: false },
              { id: 'opt-t3', name: 'Đào Miếng Thêm', extraPrice: 10000, isDefault: false, isSoldOut: false },
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
      modifierGroups: [
        {
          modifierGroup: {
            id: 'mod-size-2',
            name: 'Kích cỡ (Size)',
            minSelect: 1,
            maxSelect: 1,
            isRequired: true,
            options: [
              { id: 'opt-m2', name: 'Size M', extraPrice: 0, isDefault: true, isSoldOut: false },
              { id: 'opt-l2', name: 'Size L', extraPrice: 8000, isDefault: false, isSoldOut: false },
            ],
          },
        },
      ],
    },
    {
      id: 'item-3',
      name: 'Bánh Croissant Bơ Pháp',
      description: 'Bánh sừng bò ngàn lớp thơm lừng bơ Pháp cao cấp, giòn rụm bên ngoài.',
      basePrice: 42000,
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&h=500&fit=crop',
      isSoldOut: false,
      categoryId: 'cat-3',
      category: { id: 'cat-3', name: 'Đồ Ăn Nhẹ', isDrink: false },
    },
  ]);

  const { items: menuItems } = useMenuSoldOut(rawItems);

  const [branding, setBranding] = useState<{
    restaurantName: string;
    logoUrl?: string;
    primaryColor: string;
    wifiSsid?: string;
    wifiPassword?: string;
  }>({
    restaurantName: 'HiAI-MenuGo Restaurant',
    primaryColor: '#f59e0b',
    wifiSsid: 'HiAI-MenuGo_Guest_5G',
    wifiPassword: 'menugovietnam',
  });

  const [selectedItem, setSelectedItem] = useState<MenuItemView | null>(null);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { addItem, getTotalCount, getTotalAmount, setTableContext } = useCartStore();

  useEffect(() => {
    setTableContext('default-tenant', 'default-branch', tableId, `Bàn ${tableId.toUpperCase()}`);

    // Try fetch menu from API
    apiFetch(`/menu/${tableId}`).then((res) => {
      if (res.success && res.data) {
        if (res.data.items && res.data.items.length > 0) setRawItems(res.data.items);
        if (res.data.categories) setCategories(res.data.categories);
      }
    });

    // Try fetch branding
    apiFetch('/branding').then((res) => {
      if (res.success && res.data) {
        setBranding({
          restaurantName: res.data.tenant?.name || 'HiAI-MenuGo Restaurant',
          logoUrl: res.data.logoUrl,
          primaryColor: res.data.primaryColor || '#f59e0b',
          wifiSsid: res.data.wifiSsid,
          wifiPassword: res.data.wifiPassword,
        });
      }
    });
  }, [tableId, setTableContext]);

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
  };

  const totalCartCount = getTotalCount();
  const totalCartAmount = getTotalAmount();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col pb-24">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-500/40">
                <Image src={branding.logoUrl} alt="Logo" fill className="object-cover" />
              </div>
            ) : (
              <div
                style={{ backgroundColor: branding.primaryColor }}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-zinc-950 text-xs shadow-md"
              >
                MG
              </div>
            )}
            <div>
              <h1 className="font-bold text-sm text-zinc-100 leading-tight">
                {branding.restaurantName}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
                <MapPin className="w-3 h-3" />
                <span>Bàn: {tableId.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Wifi Info Banner */}
      {branding.wifiSsid && (
        <div className="bg-zinc-900/60 border-b border-zinc-800/60 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-amber-500" />
              <span>Wifi: <strong className="text-zinc-200">{branding.wifiSsid}</strong></span>
            </div>
            {branding.wifiPassword && (
              <span>Pass: <strong className="text-zinc-200">{branding.wifiPassword}</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        <MenuItemList
          items={menuItems}
          categories={categories}
          onSelectItem={handleSelectItem}
          primaryColor={branding.primaryColor}
        />
      </main>

      {/* Modals & Drawers */}
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
        tableName={`Bàn ${tableId.toUpperCase()}`}
        primaryColor={branding.primaryColor}
      />

      {/* Sticky Bottom Cart Floating Pill */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom duration-300">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: branding.primaryColor }}
            className="w-full py-3.5 px-5 rounded-2xl font-bold text-zinc-950 flex items-center justify-between shadow-2xl shadow-amber-500/30 active:scale-[0.98] transition hover:brightness-105"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-2 bg-zinc-950 text-amber-400 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-amber-500">
                  {totalCartCount}
                </span>
              </div>
              <span className="text-sm">Xem giỏ hàng</span>
            </div>
            <span className="text-sm tracking-wide">
              {totalCartAmount.toLocaleString('vi-VN')}đ
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
