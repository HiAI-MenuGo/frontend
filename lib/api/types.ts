// Shared backend DTOs — khớp 1:1 với backend/src/controllers
export interface MenuItemDTO {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  isPopular?: boolean;
  isSoldOut: boolean;
  branchId: string;
}

export type BackendTableStatus = 'EMPTY' | 'OCCUPIED' | 'RESERVED';

export interface TableDTO {
  id: string;
  name: string;
  status: BackendTableStatus;
  branchId: string;
  currentSessionId?: string;
  customerCount?: number;
  totalAmount?: number;
  updatedAt: string;
}

// UI-friendly table sau khi adapt từ backend
export type UiTableStatus = 'AVAILABLE' | 'ON_DINE' | 'RESERVED';

export interface UiTable {
  id: string;
  backendId: string;
  tableNumber: number;
  tableName: string;
  status: UiTableStatus;
  capacity: number;
  chairs: number;
  area: 'MAIN_DINING' | 'TERRACE' | 'OUTDOOR';
  branchId?: string;
  tenantId?: string;
  currentCustomer?: string;
  currentSessionId?: string;
  totalAmount?: number;
}

export function adaptTable(t: TableDTO): UiTable {
  const tableName = t?.name || '';
  const numMatch = tableName ? tableName.match(/(\d+)/) : null;
  const tableNumber = numMatch ? parseInt(numMatch[1], 10) : 0;
  const status: UiTableStatus =
    t?.status === 'EMPTY' ? 'AVAILABLE' : t?.status === 'OCCUPIED' ? 'ON_DINE' : 'RESERVED';
  const capacity = t?.customerCount && t?.customerCount > 0 ? t?.customerCount : 4;
  return {
    id: t?.id || '',
    backendId: t?.id || '',
    tableNumber,
    tableName: tableName || `Bàn ${tableNumber || t?.id || ''}`,
    status,
    capacity,
    chairs: capacity <= 10 ? capacity : 10,
    area: 'MAIN_DINING',
    branchId: t?.branchId,
    currentCustomer: undefined,
    currentSessionId: t?.currentSessionId,
    totalAmount: t?.totalAmount,
  };
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DONE' | 'CANCELLED';

export interface OrderItemDTO {
  id: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
  imageUrl?: string;
  status?: string;
}

export interface LiveOrderDTO {
  id: string;
  code: string;
  time: string;
  orderType: 'TAKEAWAY' | 'DINE_IN';
  status: OrderStatus;
  items: OrderItemDTO[];
  note?: string;
  total: number;
  paymentStatus: 'UNPAID' | 'PAID';
  paymentMethod?: 'CASH' | 'VIETQR';
  customerName?: string;
  tableId?: string;
  tableName?: string;
  branchId: string;
  tenantId: string;
  createdAt: string;
}

export interface AnalyticsOverviewDTO {
  branch: { id: string; name: string; code: string };
  date: string;
  kpis: {
    revenue: { today: number; yesterday: number; growthPercent: number };
    orders: { count: number; avgOrderValue: number };
    vietqr: { sharePercent: number; totalAmount: number };
    tables: { occupied: number; total: number; pendingKitchen: number };
  };
  hourlyTrend: Array<{ time: string; revenue: number; orders: number }>;
  topItems: Array<{ name: string; soldCount: number; revenue: number; category: string }>;
}

export interface LoyaltyCustomerDTO {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: { id: string; name: string; discountRate: number; color: string; minPoints?: number } | null;
  discountRate: number;
  totalSpent: number;
}

export interface MembershipTierDTO {
  id: string;
  name: string;
  minPoints: number;
  discountRate: number;
  color: string;
}

export interface BrandingDTO {
  tenantId: string;
  restaurantName?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  bankCode?: string | null;
  bankAccountNo?: string | null;
  bankAccountName?: string | null;
  wifiSsid?: string | null;
  wifiPassword?: string | null;
  footerText?: string | null;
  tenant?: { name: string; code: string; slug: string; status: string };
}

export interface PendingSessionDTO {
  sessionId: string;
  tableId: string;
  tableName: string;
  total: number;
  customerName?: string;
  items: Array<{ id: string; name: string; quantity: number; price: number; note?: string }>;
  createdAt: string;
}

export const DEFAULT_BRANCH_ID = 'default-branch';
