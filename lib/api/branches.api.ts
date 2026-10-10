import { apiFetch } from '../api';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
}

export interface CreateBranchInput {
  name: string;
  code?: string;
  address?: string;
  phone?: string;
}

export async function fetchBranches(): Promise<Branch[]> {
  const res = await apiFetch<Branch[]>('/branches');
  if (!res.success) throw new Error(res.message || 'Không tải được danh sách chi nhánh');
  return res.data ?? [];
}

export async function createBranch(input: CreateBranchInput): Promise<Branch> {
  const res = await apiFetch<Branch>('/branches', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.success) throw new Error(res.message || 'Không thể tạo chi nhánh mới');
  return res.data!;
}

export async function updateBranch(branchId: string, input: Partial<CreateBranchInput>): Promise<Branch> {
  const res = await apiFetch<Branch>(`/branches/${branchId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!res.success) throw new Error(res.message || 'Không thể cập nhật thông tin chi nhánh');
  return res.data!;
}

export async function exportBranchData(branchId: string): Promise<any> {
  const res = await apiFetch<any>(`/branches/${branchId}/export`);
  if (!res.success) throw new Error(res.message || 'Không thể xuất dữ liệu chi nhánh');
  return res.data;
}

export async function deleteBranch(branchId: string, confirmBranchName: string): Promise<void> {
  const res = await apiFetch<void>(`/branches/${branchId}`, {
    method: 'DELETE',
    body: JSON.stringify({ confirmBranchName }),
  });
  if (!res.success) throw new Error(res.message || 'Không thể xoá chi nhánh');
}

