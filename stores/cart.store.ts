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

/**
 * Cookie helpers để lưu giỏ hàng độc lập trên từng điện thoại khách quét QR.
 * Không đồng bộ giỏ hàng giữa các khách cùng bàn (phục vụ trường hợp 2 khách lạ ghép bàn).
 */
function getCartCookieKey(tableId: string | null): string {
  const safeId = (tableId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `menugo_cart_${safeId}`;
}

function loadCartFromCookie(tableId: string | null): CartItem[] {
  if (typeof document === 'undefined' || !tableId) return [];
  try {
    const key = getCartCookieKey(tableId);
    const pattern = new RegExp('(?:^|; )' + key.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)');
    const match = document.cookie.match(pattern);
    if (!match) return [];
    const raw = decodeURIComponent(match[1]);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCartToCookie(tableId: string | null, items: CartItem[]): void {
  if (typeof document === 'undefined' || !tableId) return;
  try {
    const key = getCartCookieKey(tableId);
    const value = encodeURIComponent(JSON.stringify(items));
    // Lưu trong 3 ngày (259200 giây)
    document.cookie = `${key}=${value}; path=/; max-age=259200; SameSite=Lax`;
  } catch (err) {
    console.warn('Lỗi lưu giỏ hàng vào cookie:', err);
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableId: null,
  tableName: null,
  tenantId: null,
  branchId: null,

  setTableContext: (tenantId: string, branchId: string, tableId: string, tableName?: string) => {
    // Khôi phục giỏ hàng đã lưu trong cookie của chính điện thoại khách này
    const savedItems = loadCartFromCookie(tableId);
    set({
      tenantId,
      branchId,
      tableId,
      tableName: tableName || tableId,
      items: savedItems,
    });
  },

  addItem: (newItem) => {
    const cartItemId = generateCartItemId(newItem.menuItemId, newItem.selectedModifiers, newItem.note);
    const modifiersCost = newItem.selectedModifiers.reduce((acc, m) => acc + m.extraPrice, 0);
    const unitPrice = newItem.basePrice + modifiersCost;

    const currentItems = get().items;
    const existingIndex = currentItems.findIndex((i) => i.cartItemId === cartItemId);

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...currentItems];
      updated[existingIndex].quantity += newItem.quantity;
    } else {
      updated = [
        ...currentItems,
        {
          ...newItem,
          cartItemId,
          unitPrice,
        },
      ];
    }

    set({ items: updated });
    saveCartToCookie(get().tableId, updated);
  },

  updateQuantity: (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(cartItemId);
      return;
    }
    const updated = get().items.map((item) =>
      item.cartItemId === cartItemId ? { ...item, quantity } : item
    );
    set({ items: updated });
    saveCartToCookie(get().tableId, updated);
  },

  removeItem: (cartItemId: string) => {
    const updated = get().items.filter((item) => item.cartItemId !== cartItemId);
    set({ items: updated });
    saveCartToCookie(get().tableId, updated);
  },

  clearCart: () => {
    set({ items: [] });
    saveCartToCookie(get().tableId, []);
  },

  getTotalAmount: () => {
    return get().items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  },

  getTotalCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
}));

export default useCartStore;
