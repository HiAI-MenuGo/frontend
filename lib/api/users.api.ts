import { apiFetch } from '../api';

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  branchId: string | null;
  branch?: { id: string; name: string; code: string } | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface StaffRole {
  role: string;
  label: string;
  scope: string;
}

export async function fetchStaff(): Promise<StaffUser[]> {
  const res = await apiFetch<StaffUser[]>('/admin/users');
  if (!res.success) throw new Error(res.message || 'Không tải được danh sách nhân viên');
  return res.data ?? [];
}

export async function fetchStaffRoles(): Promise<StaffRole[]> {
  const res = await apiFetch<StaffRole[]>('/admin/users/roles');
  if (!res.success) throw new Error(res.message || 'Không tải được danh sách vai trò');
  return res.data ?? [];
}

export async function createStaff(data: {
  email: string;
  name: string;
  phone?: string;
  password: string;
  role: string;
  branchId?: string;
}): Promise<StaffUser> {
  const res = await apiFetch<StaffUser>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.success || !res.data) throw new Error(res.message || 'Tạo nhân viên thất bại');
  return res.data;
}

export async function updateStaff(
  id: string,
  data: Partial<{
    name: string;
    phone: string;
    role: string;
    branchId: string;
    isActive: boolean;
    password: string;
  }>
): Promise<StaffUser> {
  const res = await apiFetch<StaffUser>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.success || !res.data) throw new Error(res.message || 'Cập nhật nhân viên thất bại');
  return res.data;
}

export async function deleteStaff(id: string): Promise<void> {
  const res = await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
  if (!res.success) throw new Error(res.message || 'Xóa nhân viên thất bại');
}
