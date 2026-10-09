import { apiFetch } from '../api';
import type { MenuItemDTO } from './types';
import { DEFAULT_BRANCH_ID } from './types';

export async function fetchMenuItems(branchId = DEFAULT_BRANCH_ID): Promise<MenuItemDTO[]> {
  const res = await apiFetch<MenuItemDTO[]>(`/menu/items?branchId=${encodeURIComponent(branchId)}`);
  if (!res.success) throw new Error(res.message || 'Không tải được thực đơn');
  return res.data ?? [];
}

export async function toggleSoldOut(itemId: string, isSoldOut: boolean, branchId = DEFAULT_BRANCH_ID) {
  const res = await apiFetch<MenuItemDTO>(`/menu/items/${itemId}/sold-out?branchId=${encodeURIComponent(branchId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ isSoldOut, branchId }),
  });
  if (!res.success) throw new Error(res.message || 'Không cập nhật trạng thái món');
  return res.data!;
}

export interface CreateMenuItemPayload {
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  description?: string;
  isPopular?: boolean;
  branchId?: string;
}

export async function createMenuItem(payload: CreateMenuItemPayload): Promise<MenuItemDTO> {
  const res = await apiFetch<MenuItemDTO>('/menu/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.success) throw new Error(res.message || 'Không tạo được món mới');
  return res.data!;
}

export function deriveCategories(items: MenuItemDTO[]): Array<{ id: string; name: string; count: number }> {
  const map = new Map<string, number>();
  for (const it of items) map.set(it.category, (map.get(it.category) ?? 0) + 1);
  const cats = Array.from(map.entries()).map(([name, count]) => ({
    id: name,
    name,
    count,
  }));
  return [{ id: 'all', name: 'Tất cả món', count: items.length }, ...cats];
}

export async function renameCategory(oldName: string, newName: string) {
  try {
    const res = await apiFetch<{ oldName: string; newName: string }>('/categories/rename', {
      method: 'PUT',
      body: JSON.stringify({ oldName, newName }),
    });
    return res;
  } catch (e) {
    console.warn('API renameCategory warning:', e);
    return null;
  }
}
