import { apiFetch } from '../api';

export interface CustomerCallItem {
  id: string;
  tenantId: string;
  branchId: string;
  tableId: string;
  tableName: string;
  type: 'PAYMENT' | 'STAFF';
  paymentMethod?: 'CASH' | 'VIETQR';
  reason: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CustomerReviewItem {
  id: string;
  tenantId: string;
  branchId: string;
  tableId: string;
  tableName: string;
  customerName?: string;
  customerPhone?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  satisfactionRate: number;
  ratingCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// 1. Gửi yêu cầu gọi phục vụ / thanh toán từ QR
export async function sendCustomerCall(data: {
  tableId: string;
  tableName?: string;
  type: 'PAYMENT' | 'STAFF';
  reason?: string;
  paymentMethod?: 'CASH' | 'VIETQR';
}): Promise<CustomerCallItem> {
  const res = await apiFetch<CustomerCallItem>('/customer-requests/call', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.success || !res.data) {
    throw new Error(res.message || 'Không thể gửi yêu cầu tới nhân viên');
  }
  return res.data;
}

// 2. Lấy danh sách yêu cầu gọi bàn (Admin Web)
export async function fetchCustomerCalls(params?: {
  status?: string;
  type?: string;
  branchId?: string;
}): Promise<{ calls: CustomerCallItem[]; summary: { total: number; pending: number; processing: number } }> {
  const qs = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') qs.set('status', params.status);
  if (params?.type && params.type !== 'ALL') qs.set('type', params.type);
  if (params?.branchId && params.branchId !== 'ALL') qs.set('branchId', params.branchId);

  const endpoint = `/customer-requests/calls${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await apiFetch<{ calls: CustomerCallItem[]; summary: { total: number; pending: number; processing: number } }>(
    endpoint
  );
  return (
    res.data ?? {
      calls: [],
      summary: { total: 0, pending: 0, processing: 0 },
    }
  );
}

// 3. Cập nhật trạng thái yêu cầu gọi bàn (Admin Web)
export async function updateCustomerCallStatus(
  id: string,
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
): Promise<CustomerCallItem> {
  const res = await apiFetch<CustomerCallItem>(`/customer-requests/calls/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.success || !res.data) {
    throw new Error(res.message || 'Không thể cập nhật trạng thái yêu cầu');
  }
  return res.data;
}

// 4. Khách hàng gửi đánh giá từ QR
export async function sendCustomerReview(data: {
  tableId: string;
  tableName?: string;
  rating: number;
  comment?: string;
  customerName?: string;
  customerPhone?: string;
}): Promise<CustomerReviewItem> {
  const res = await apiFetch<CustomerReviewItem>('/customer-requests/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.success || !res.data) {
    throw new Error(res.message || 'Không thể gửi đánh giá');
  }
  return res.data;
}

// 5. Lấy danh sách đánh giá & thống kê KPI (Admin Web)
export async function fetchCustomerReviews(params?: {
  rating?: string | number;
  branchId?: string;
}): Promise<{ summary: ReviewSummary; reviews: CustomerReviewItem[] }> {
  const qs = new URLSearchParams();
  if (params?.rating && params.rating !== 'ALL') qs.set('rating', String(params.rating));
  if (params?.branchId && params.branchId !== 'ALL') qs.set('branchId', params.branchId);

  const endpoint = `/customer-requests/reviews${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await apiFetch<{ summary: ReviewSummary; reviews: CustomerReviewItem[] }>(endpoint);
  return (
    res.data ?? {
      summary: {
        averageRating: 5.0,
        totalReviews: 0,
        satisfactionRate: 100,
        ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
      reviews: [],
    }
  );
}
