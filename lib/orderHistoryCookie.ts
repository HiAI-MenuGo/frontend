import { createTaggedLogger } from '@/lib/logger';
const log = createTaggedLogger('CART');
export interface OrderedItemDetail {
  name: string;
  quantity: number;
  unitPrice: number;
  selectedModifiers?: Array<{
    optionName: string;
    extraPrice?: number;
  }>;
  note?: string;
  imageUrl?: string | null;
}

export interface CustomerOrderHistoryRecord {
  id: string;
  orderCode: string;
  tableId: string;
  tableName?: string;
  totalAmount: number;
  note?: string;
  createdAt: string; // ISO 8601 string
  status?: 'PENDING' | 'PREPARING' | 'DONE';
  items: OrderedItemDetail[];
}

export interface AggregatedOrderedItem {
  name: string;
  totalQuantity: number;
  unitPrice: number;
  totalAmount: number;
  notes: string[];
  imageUrl?: string | null;
}

export const COOKIE_NAME = 'menugo_order_history';

/**
 * Đồng bộ danh sách đơn hàng từ ActiveSession (server) vào cookie lịch sử khách
 */
export function syncOrdersWithServer(
  currentList: CustomerOrderHistoryRecord[],
  serverOrders: any[],
  tableId: string,
  tableName?: string
): CustomerOrderHistoryRecord[] {
  if (!serverOrders || !Array.isArray(serverOrders) || serverOrders.length === 0) {
    return currentList;
  }

  return serverOrders.map((so: any) => {
    const existing = currentList.find(
      (c) => c.orderCode === so.orderCode || c.id === so.id
    );

    const rawStatus = String(so.status || '').toUpperCase();
    const mappedStatus: 'PENDING' | 'PREPARING' | 'DONE' =
      rawStatus === 'DONE'
        ? 'DONE'
        : rawStatus === 'PREPARING' || rawStatus === 'READY' || rawStatus === 'CONFIRMED'
        ? 'PREPARING'
        : 'PENDING';

    if (existing) {
      return {
        ...existing,
        status: mappedStatus,
        totalAmount: so.totalAmount ?? existing.totalAmount,
      };
    }

    return {
      id: so.id || `ord-${so.orderCode || Date.now()}`,
      orderCode: so.orderCode || 'H-001',
      tableId,
      tableName: tableName || so.tableName || 'Bàn phục vụ',
      totalAmount: so.totalAmount || 0,
      note: so.note || undefined,
      createdAt: so.createdAt || new Date().toISOString(),
      status: mappedStatus,
      items: (so.items || []).map((it: any) => ({
        name: it.name || it.itemName || 'Món ăn',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || it.price || 0,
        note: it.note || undefined,
        status: it.status,
      })),
    };
  });
}

/**
 * Đọc cookie client-side an toàn
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const pattern = new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)');
    const match = document.cookie.match(pattern);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Ghi cookie client-side với max-age (mặc định 7 ngày)
 */
export function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === 'undefined') return;
  try {
    const maxAge = Math.floor(days * 24 * 60 * 60);
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch (err) {
    log.warn('Lỗi ghi cookie:', err);
  }
}

/**
 * Lấy danh sách lịch sử các đợt gọi món từ cookie
 */
export function getOrderHistoryFromCookie(tableId?: string): CustomerOrderHistoryRecord[] {
  try {
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return [];
    const list: CustomerOrderHistoryRecord[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    if (tableId) {
      const cleanTable = tableId.trim().toLowerCase();
      return list.filter((ord) => (ord.tableId || '').trim().toLowerCase() === cleanTable);
    }
    return list;
  } catch (err) {
    log.warn('Lỗi phân tích lịch sử món từ cookie:', err);
    return [];
  }
}

/**
 * Thêm một đơn gọi món mới vào cookie
 */
export function addOrderToCookie(
  order: Omit<CustomerOrderHistoryRecord, 'id'> & { id?: string }
): CustomerOrderHistoryRecord {
  const fullOrder: CustomerOrderHistoryRecord = {
    ...order,
    id: order.id || `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: order.createdAt || new Date().toISOString(),
  };

  try {
    const current = getOrderHistoryFromCookie();
    // Thêm vào đầu danh sách, giữ tối đa 15 đơn gần nhất để tránh tràn giới hạn kích thước cookie (~4KB)
    const updated = [fullOrder, ...current.filter((o) => o.id !== fullOrder.id)].slice(0, 15);
    setCookie(COOKIE_NAME, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('menugo:order_history_changed', { detail: updated }));
    }
  } catch (err) {
    log.error('Lỗi lưu đơn vào cookie:', err);
  }

  return fullOrder;
}

/**
 * Cập nhật trạng thái đơn hàng trong cookie
 * @returns true nếu đã cập nhật, false nếu không tìm thấy đơn
 */
export function updateOrderStatusInCookie(
  tableId: string,
  orderId: string,
  status: string,
  skipEvent = false
): boolean {
  try {
    const current = getOrderHistoryFromCookie();
    const cleanTable = tableId.trim().toLowerCase();
    
    let updated = false;
    const updatedList = current.map((ord) => {
      // Match by tableId AND orderCode/id
      const matchTable = !ord.tableId || (ord.tableId || '').trim().toLowerCase() === cleanTable;
      const matchId = ord.orderCode === orderId || ord.id === orderId;
      
      if (matchTable && matchId) {
        if (ord.status !== status) {
          updated = true;
          return { ...ord, status: status as 'PENDING' | 'PREPARING' | 'DONE' };
        }
      }
      return ord;
    });

    if (updated) {
      setCookie(COOKIE_NAME, JSON.stringify(updatedList));
      if (!skipEvent && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('menugo:order_history_changed', { detail: updatedList }));
      }
    }
    return updated;
  } catch (err) {
    log.warn('Lỗi cập nhật trạng thái đơn trong cookie:', err);
    return false;
  }
}

/**
 * Xoá lịch sử món đã gọi trong cookie (có thể xoá theo bàn hoặc toàn bộ)
 */
export function clearOrderHistoryCookie(tableId?: string, skipEvent = false): void {
  try {
    const current = getOrderHistoryFromCookie();
    if (current.length === 0) return;

    if (!tableId) {
      setCookie(COOKIE_NAME, JSON.stringify([]));
    } else {
      const cleanTable = tableId.trim().toLowerCase();
      const remaining = current.filter((ord) => (ord.tableId || '').trim().toLowerCase() !== cleanTable);
      if (remaining.length === current.length) return; // Không có gì thay đổi
      setCookie(COOKIE_NAME, JSON.stringify(remaining));
    }

    if (!skipEvent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('menugo:order_history_changed', { detail: [] }));
    }
  } catch (err) {
    log.error('Lỗi xoá lịch sử cookie:', err);
  }
}

/**
 * Gom nhóm tất cả món đã gọi theo tên để tính tổng số lượng và thành tiền
 */
export function getAggregatedItemsFromHistory(orders: CustomerOrderHistoryRecord[]): AggregatedOrderedItem[] {
  const map = new Map<string, AggregatedOrderedItem>();

  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const key = item.name.trim();
      const existing = map.get(key);
      const notes = item.note ? [item.note] : [];

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalAmount += item.unitPrice * item.quantity;
        if (item.note && !existing.notes.includes(item.note)) {
          existing.notes.push(item.note);
        }
      } else {
        map.set(key, {
          name: item.name,
          totalQuantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.unitPrice * item.quantity,
          notes,
          imageUrl: item.imageUrl,
        });
      }
    });
  });

  return Array.from(map.values());
}
