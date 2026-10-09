import { apiFetch } from '../api';
import type { BrandingDTO } from './types';
import { DEFAULT_BRANCH_ID } from './types';

export async function fetchPublicBranding(branchId = DEFAULT_BRANCH_ID): Promise<BrandingDTO | null> {
  const res = await apiFetch<BrandingDTO>(`/branding/public?branchId=${encodeURIComponent(branchId)}`);
  if (!res.success) return null;
  return res.data ?? null;
}

export async function updateBranding(payload: Partial<BrandingDTO>): Promise<BrandingDTO> {
  const res = await apiFetch<BrandingDTO>('/branding', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!res.success) throw new Error(res.message || 'Không lưu được cấu hình');
  if (!res.data) throw new Error('Lưu branding thất bại');
  return res.data;
}
