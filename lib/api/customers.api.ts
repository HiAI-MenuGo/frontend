import { apiFetch } from '../api';
import type { LoyaltyCustomerDTO, MembershipTierDTO } from './types';

// Tra cứu hoặc tự động đăng ký khách hàng tại bàn quét QR (Public, không yêu cầu staff auth)
export async function lookupPublicCustomer(
  phone: string,
  tableId?: string,
  name?: string
): Promise<LoyaltyCustomerDTO> {
  const q = new URLSearchParams();
  q.append('phone', phone.trim());
  if (tableId) q.append('tableId', tableId.trim());
  if (name) q.append('name', name.trim());

  const res = await apiFetch<LoyaltyCustomerDTO>(`/customers/public?${q.toString()}`);
  if (!res.success || !res.data) throw new Error(res.message || 'Không tìm thấy khách hàng');
  return res.data;
}

// Lấy danh sách toàn bộ khách hàng từ Database cho màn hình Quản lý khách hàng (Staff auth)
export async function fetchCustomersList(search?: string): Promise<any[]> {
  const q = new URLSearchParams();
  if (search) q.append('search', search.trim());
  const res = await apiFetch<any[]>(`/customers?${q.toString()}`);
  if (!res.success) throw new Error(res.message || 'Không thể lấy danh sách khách hàng');
  return res.data ?? [];
}

// Tạo khách hàng mới thủ công từ Web Admin
export async function createCustomer(data: {
  phone: string;
  name: string;
  email?: string;
  tierId?: string;
  initialPoints?: number;
}): Promise<any> {
  const res = await apiFetch<any>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.success) throw new Error(res.message || 'Không thể tạo khách hàng mới');
  return res.data;
}

// Staff tra cứu 1 khách theo SĐT
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

// Xoá khách hàng khỏi hệ thống
export async function deleteCustomer(id: string): Promise<void> {
  const res = await apiFetch<void>(`/customers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.success) throw new Error(res.message || 'Không thể xoá khách hàng');
}



