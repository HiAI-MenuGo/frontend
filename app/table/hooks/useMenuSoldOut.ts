'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '../../../context/SocketContext';

export interface MenuItemView {
  id: string;
  name: string;
  code?: string;
  description?: string;
  basePrice: number;
  imageUrl?: string | null;
  isSoldOut: boolean;
  isPopular?: boolean;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    isDrink: boolean;
  };
  modifierGroups?: Array<{
    modifierGroup: {
      id: string;
      name: string;
      minSelect: number;
      maxSelect: number;
      isRequired: boolean;
      options: Array<{
        id: string;
        name: string;
        extraPrice: number;
        isDefault: boolean;
        isSoldOut: boolean;
      }>;
    };
  }>;
}

export function useMenuSoldOut(initialItems: MenuItemView[], tableId?: string) {
  const [items, setItems] = useState<MenuItemView[]>(initialItems);
  const { on, off, isConnected } = useSocket();

  useEffect(() => {
    setItems((prev) => {
      if (
        prev.length === initialItems.length &&
        prev.every(
          (p, idx) =>
            p.id === initialItems[idx]?.id &&
            p.isSoldOut === initialItems[idx]?.isSoldOut &&
            p.basePrice === initialItems[idx]?.basePrice
        )
      ) {
        return prev;
      }
      return initialItems;
    });
  }, [initialItems]);

  useEffect(() => {
    if (!isConnected) return;

    const handleSoldOutUpdated = (payload: { itemId: string; isSoldOut: boolean }) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === payload.itemId ? { ...item, isSoldOut: payload.isSoldOut } : item
        )
      );
    };

    on('sold_out:updated', handleSoldOutUpdated);

    return () => {
      off('sold_out:updated', handleSoldOutUpdated);
    };
  }, [isConnected, on, off, tableId]);

  return { items, setItems };
}

export default useMenuSoldOut;
