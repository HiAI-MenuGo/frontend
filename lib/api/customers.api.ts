import { apiFetch } from '../api';
import type { LoyaltyCustomerDTO, MembershipTierDTO } from './types';

// Backend chỉ hỗ trợ tra cứu 1 khách theo SĐT (không có list).
// CustomersView dùng lookup-by-phone + adjust points.
export async function lookupCustomerByPhone(phone: string): Promise<LoyaltyCustomerDTO> {
  const res = await apiFetch<LoyaltyCustomerDTO>(`/customers?phone=${encodeURIComponent(phone)}`);
  if (!res.success) throw new Error(res.message || 'Không tìm thấy khách hàng');
  if (!res.data) throw new Error('Không tìm thấy khách hàng');
  return res.data;
}

export async function adjustCustomerPoints(phone: string, pointsDelta: number, name?: string, orderId?: string) {
  const res = await apiFetch<LoyaltyCustomerDTO>('/customers/points', {
    method: 'POST',
    body: JSON.stringify({ phone, pointsDelta, name, orderId }),
  });
  if (!res.success) throw new Error(res.message || 'Không cập nhật điểm');
  return res.data!;
}

export async function fetchTiers(): Promise<MembershipTierDTO[]> {
  const res = await apiFetch<MembershipTierDTO[]>('/tiers');
  if (!res.success) throw new Error(res.message || 'Không tải được hạng thành viên');
  return res.data ?? [];
}

export async function createTier(data: {
  name: string;
  minPoints: number;
  discountRate: number;
  color: string;
}): Promise<MembershipTierDTO> {
  const res = await apiFetch<MembershipTierDTO>('/tiers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.success) throw new Error(res.message || 'Không thể tạo hạng thành viên');
  return res.data!;
}

export async function updateTier(
  id: string,
  data: { name?: string; minPoints: number; discountRate: number; color: string }
): Promise<MembershipTierDTO> {
  const res = await apiFetch<MembershipTierDTO>(`/tiers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.success) throw new Error(res.message || 'Không thể cập nhật hạng');
  return res.data!;
}

export async function deleteTier(id: string): Promise<void> {
  const res = await apiFetch<void>(`/tiers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.success) throw new Error(res.message || 'Không thể xoá hạng');
}


