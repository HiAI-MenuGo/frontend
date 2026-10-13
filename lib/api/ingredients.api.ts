import { apiFetch } from '../api';
import { ALL_BRANCHES_ID, DEFAULT_BRANCH_ID } from './types';

export interface IngredientDTO {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  branchId: string;
  branchName?: string;
  branchCode?: string;
  updatedAt: string;
}

export async function fetchIngredients(branchId = ALL_BRANCHES_ID): Promise<IngredientDTO[]> {
  const res = await apiFetch<IngredientDTO[]>(`/ingredients?branchId=${encodeURIComponent(branchId)}`);
  if (!res.success) throw new Error(res.message || 'Không tải được danh sách nguyên liệu');
  return res.data ?? [];
}

export async function adjustIngredientStock(
  id: string,
  data: { adjustment: number; type?: 'ADD' | 'REMOVE' | 'SET'; reason?: string },
  branchId = DEFAULT_BRANCH_ID
): Promise<IngredientDTO> {
  const res = await apiFetch<IngredientDTO>(`/ingredients/${encodeURIComponent(id)}/adjust`, {
    method: 'PATCH',
    body: JSON.stringify({ ...data, branchId }),
  });
  if (!res.success) throw new Error(res.message || 'Không thể điều chỉnh tồn kho');
  return res.data!;
}

export async function createIngredient(
  data: { name: string; quantity: number; unit: string; lowStockThreshold: number },
  branchId = DEFAULT_BRANCH_ID
): Promise<IngredientDTO> {
  const res = await apiFetch<IngredientDTO>('/ingredients', {
    method: 'POST',
    body: JSON.stringify({ ...data, branchId }),
  });
  if (!res.success) throw new Error(res.message || 'Không thể tạo nguyên liệu');
  return res.data!;
}

export async function deleteIngredient(id: string, branchId = DEFAULT_BRANCH_ID): Promise<void> {
  const res = await apiFetch(`/ingredients/${encodeURIComponent(id)}?branchId=${encodeURIComponent(branchId)}`, {
    method: 'DELETE',
  });
  if (!res.success) throw new Error(res.message || 'Không thể xóa nguyên liệu');
}
