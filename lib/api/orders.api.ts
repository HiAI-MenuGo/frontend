import { apiFetch } from '../api';
import type { LiveOrderDTO } from './types';
import { DEFAULT_BRANCH_ID } from './types';

export async function fetchActiveOrders(branchId = DEFAULT_BRANCH_ID): Promise<LiveOrderDTO[]> {
  const res = await apiFetch<LiveOrderDTO[]>(`/orders/active?branchId=${encodeURIComponent(branchId)}`);
  if (!res.success) throw new Error(res.message || 'Không tải được đơn hàng');
  return res.data ?? [];
}

export async function updateOrderStatus(orderId: string, status: string, branchId = DEFAULT_BRANCH_ID) {
  const res = await apiFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, branchId }),
  });
  if (!res.success) throw new Error(res.message || 'Không cập nhật trạng thái đơn');
  return res.data;
}

export async function updateItemStatus(orderId: string, itemId: string, status: string, branchId = DEFAULT_BRANCH_ID) {
  const res = await apiFetch(`/orders/items/${itemId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ orderId, status, branchId }),
  });
  if (!res.success) throw new Error(res.message || 'Không cập nhật trạng thái món');
  return res.data;
}

export async function voidOrder(orderId: string, reason = 'Hủy bởi quản lý', branchId = DEFAULT_BRANCH_ID) {
  const res = await apiFetch(`/orders/${orderId}/void?branchId=${encodeURIComponent(branchId)}`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!res.success) throw new Error(res.message || 'Không hủy được đơn');
  return res.data;
}

export interface OrderHistoryResult {
  orders: LiveOrderDTO[];
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchOrderHistory(
  branchId = DEFAULT_BRANCH_ID,
  page = 1,
  limit = 20,
  search?: string,
  startDate?: string,
  endDate?: string
): Promise<OrderHistoryResult> {
  const params = new URLSearchParams({
    branchId,
    page: String(page),
    limit: String(limit),
  });
  if (search && search.trim()) params.append('search', search.trim());
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await apiFetch<OrderHistoryResult>(`/orders/history?${params.toString()}`);
  if (!res.success) throw new Error(res.message || 'Không tải được lịch sử đơn');
  return res.data ?? { orders: [], total: 0, page: 1, totalPages: 1 };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function downloadOrderHistoryExcel(params: {
  branchId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: string;
}): Promise<void> {
  const query = new URLSearchParams({ branchId: params.branchId || DEFAULT_BRANCH_ID });
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.search && params.search.trim()) query.set('search', params.search.trim());
  if (params.status && params.status !== 'ALL') query.set('status', params.status);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const url = `${API_URL}/orders/history/export?${query.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Xuất danh sách đơn thất bại (${res.status}): ${errorText || 'Lỗi kết nối máy chủ'}`);
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  const startPart = params.startDate || 'all';
  const endPart = params.endDate || 'now';
  link.download = `Lich-su-don-hang-${startPart}_den_${endPart}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
