'use client';

import { useState, useEffect } from 'react';
import { getSocket } from '../../../lib/socket';

export interface MenuItemView {
  id: string;
  name: string;
  code?: string;
  description?: string;
  basePrice: number;
  imageUrl?: string | null;
  isSoldOut: boolean;
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

export function useMenuSoldOut(initialItems: MenuItemView[]) {
  const [items, setItems] = useState<MenuItemView[]>(initialItems);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const socket = getSocket();

    const handleSoldOutUpdated = (payload: { itemId: string; isSoldOut: boolean }) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === payload.itemId ? { ...item, isSoldOut: payload.isSoldOut } : item
        )
      );
    };

    socket.on('sold_out:updated', handleSoldOutUpdated);

    return () => {
      socket.off('sold_out:updated', handleSoldOutUpdated);
    };
  }, []);

  return { items, setItems };
}

export default useMenuSoldOut;
