import { apiFetch } from '../api';
import type { PendingSessionDTO } from './types';
import { DEFAULT_BRANCH_ID } from './types';

export interface CreateSessionOrderItem {
  menuItemId: string;
  quantity: number;
  note?: string;
}

export async function createSessionOrder(tableId: string, items: CreateSessionOrderItem[], note?: string) {
  const res = await apiFetch(`/sessions/${encodeURIComponent(tableId)}/order`, {
    method: 'POST',
    body: JSON.stringify({ tableId, items, note }),
  });
  if (!res.success) throw new Error(res.message || 'Đặt món thất bại');
  return res.data;
}

export async function fetchPendingPayments(branchId?: string): Promise<PendingSessionDTO[]> {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
  const res = await apiFetch<PendingSessionDTO[]>(`/sessions/pending-payment${query}`);
  if (!res.success) throw new Error(res.message || 'Không tải được bàn chờ thanh toán');
  return res.data ?? [];
}

export interface ActiveSessionDTO {
  sessionId: string;
  sessionCode: string;
  tableId: string;
  tableName: string;
  status: string;
  subTotal: number;
  discountAmount: number;
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    note?: string;
  }>;
  openedAt: string;
}

export async function fetchActiveTableSession(tableId: string): Promise<ActiveSessionDTO | null> {
  const res = await apiFetch<ActiveSessionDTO>(`/sessions/${encodeURIComponent(tableId)}/active`);
  if (!res.success || !res.data) return null;
  return res.data;
}

export async function payCash(
  sessionId: string,
  cashReceived: number,
  branchId = DEFAULT_BRANCH_ID,
  paymentMethod: 'CASH' | 'VIETQR' | string = 'CASH',
  discountAmount?: number,
  voucherCode?: string
) {
  const res = await apiFetch('/cashier/pay', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      cashReceived,
      branchId,
      paymentMethod,
      discountAmount,
      voucherCode,
    }),
  });
  if (!res.success) throw new Error(res.message || 'Thanh toán thất bại');
  return res.data as { total: number; cashReceived: number; change: number; pointsEarned: number; receiptId: string };
}

export interface CashierSummaryDTO {
  pendingOrders: number;
  pendingPayment: number;
  soldOutCount: number;
  menuItemCount: number;
}

export async function fetchCashierSummary(): Promise<CashierSummaryDTO> {
  const res = await apiFetch<CashierSummaryDTO>('/cashier/summary');
  return res.data ?? { pendingOrders: 0, pendingPayment: 0, soldOutCount: 0, menuItemCount: 0 };
}

export interface VietQRResult {
  qrImageUrl?: string;
  qrData?: string;
  imageUrl?: string;
  transactionRef?: string;
  amount: number;
  [k: string]: unknown;
}

export async function createVietQR(sessionId: string, amount: number, branchId = DEFAULT_BRANCH_ID): Promise<VietQRResult> {
  const res = await apiFetch<VietQRResult>('/cashier/create-qr', {
    method: 'POST',
    body: JSON.stringify({ sessionId, amount, branchId }),
  });
  if (!res.success) throw new Error(res.message || 'Không tạo được mã VietQR');
  return (res.data ?? { amount }) as VietQRResult;
}
