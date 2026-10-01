import { create } from 'zustand';

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  extraPrice: number;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  note?: string;
  imageUrl?: string | null;
}

interface CartState {
  items: CartItem[];
  tableId: string | null;
  tableName: string | null;
  tenantId: string | null;
  branchId: string | null;

  setTableContext: (tenantId: string, branchId: string, tableId: string, tableName?: string) => void;
  addItem: (item: Omit<CartItem, 'cartItemId' | 'unitPrice'>) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalCount: () => number;
}

export function generateCartItemId(menuItemId: string, modifiers: SelectedModifier[], note: string = ''): string {
  const sortedModIds = [...modifiers].map((m) => m.optionId).sort().join(',');
  return `${menuItemId}_${sortedModIds}_${note.trim().toLowerCase()}`;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableId: null,
  tableName: null,
  tenantId: null,
  branchId: null,

  setTableContext: (tenantId: string, branchId: string, tableId: string, tableName?: string) => {
    set({ tenantId, branchId, tableId, tableName: tableName || tableId });
  },

  addItem: (newItem) => {
    const cartItemId = generateCartItemId(newItem.menuItemId, newItem.selectedModifiers, newItem.note);
    const modifiersCost = newItem.selectedModifiers.reduce((acc, m) => acc + m.extraPrice, 0);
    const unitPrice = newItem.basePrice + modifiersCost;

    const currentItems = get().items;
    const existingIndex = currentItems.findIndex((i) => i.cartItemId === cartItemId);

    if (existingIndex > -1) {
      const updated = [...currentItems];
      updated[existingIndex].quantity += newItem.quantity;
      set({ items: updated });
    } else {
      set({
        items: [
          ...currentItems,
          {
            ...newItem,
            cartItemId,
            unitPrice,
          },
        ],
      });
    }
  },

  updateQuantity: (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(cartItemId);
      return;
    }
    set({
      items: get().items.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      ),
    });
  },

  removeItem: (cartItemId: string) => {
    set({
      items: get().items.filter((item) => item.cartItemId !== cartItemId),
    });
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalAmount: () => {
    return get().items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  },

  getTotalCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
}));

export default useCartStore;
