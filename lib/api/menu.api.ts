import { apiFetch } from '../api';
import type { MenuItemDTO } from './types';
import { ALL_BRANCHES_ID, DEFAULT_BRANCH_ID } from './types';

export async function fetchMenuItems(branchId = ALL_BRANCHES_ID): Promise<MenuItemDTO[]> {
  const res = await apiFetch<any[]>(`/menu/items?branchId=${encodeURIComponent(branchId)}`);
  if (!res.success) throw new Error(res.message || 'Không tải được thực đơn');
  const rawList = res.data ?? [];
  return rawList.map((raw): MenuItemDTO => {
    let catName = 'Món chính';
    let catObj: MenuItemDTO['categoryObj'] = undefined;
    if (typeof raw.category === 'string') {
      catName = raw.category;
    } else if (raw.category && typeof raw.category === 'object') {
      catName = raw.category.name || 'Món chính';
      catObj = raw.category;
    }
    return {
      ...raw,
      category: catName,
      categoryObj: catObj,
      price: typeof raw.price === 'number' ? raw.price : (raw.basePrice ?? 0),
    };
  });
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

export interface UpdateMenuItemPayload {
  name?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  description?: string;
  isPopular?: boolean;
  isSoldOut?: boolean;
  branchId?: string;
}

export async function updateMenuItem(id: string, payload: UpdateMenuItemPayload): Promise<MenuItemDTO> {
  const res = await apiFetch<MenuItemDTO>(`/menu/items/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!res.success) throw new Error(res.message || 'Không cập nhật được món ăn');
  return res.data!;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const res = await apiFetch<void>(`/menu/items/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.success) throw new Error(res.message || 'Không xoá được món ăn');
}

export function deriveCategories(items: MenuItemDTO[]): Array<{ id: string; name: string; count: number }> {
  const map = new Map<string, number>();
  for (const it of items) {
    const catName = typeof it.category === 'string' ? it.category : (it.category as any)?.name || 'Món chính';
    map.set(catName, (map.get(catName) ?? 0) + 1);
  }
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
