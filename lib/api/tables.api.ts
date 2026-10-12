import { apiFetch } from '../api';
import type { TableDTO, UiTable, BackendTableStatus } from './types';
import { adaptTable, DEFAULT_BRANCH_ID } from './types';

export async function fetchTables(branchId = DEFAULT_BRANCH_ID): Promise<UiTable[]> {
  const res = await apiFetch<TableDTO[]>(`/tables?branchId=${encodeURIComponent(branchId)}`);
  if (!res.success) throw new Error(res.message || 'Không tải được danh sách bàn');
  return (res.data ?? []).map(adaptTable);
}

export async function updateTableStatus(tableId: string, status: BackendTableStatus, branchId?: string): Promise<UiTable> {
  const res = await apiFetch<TableDTO>(`/tables/${encodeURIComponent(tableId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(branchId ? { branchId } : {}) }),
  });
  if (!res.success) throw new Error(res.message || 'Không cập nhật trạng thái bàn');
  return adaptTable(res.data!);
}

export function toBackendStatus(ui: UiTable['status']): BackendTableStatus {
  return ui === 'AVAILABLE' ? 'EMPTY' : ui === 'ON_DINE' ? 'OCCUPIED' : 'RESERVED';
}

export async function createTable(data: {
  name: string;
  capacity?: number;
  branchId?: string;
}): Promise<UiTable> {
  const res = await apiFetch<TableDTO>('/tables', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.success) throw new Error(res.message || 'Không tạo được bàn');
  return adaptTable(res.data!);
}

export async function updateTable(
  tableId: string,
  data: { name?: string; capacity?: number }
): Promise<UiTable> {
  const res = await apiFetch<TableDTO>(`/tables/${encodeURIComponent(tableId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.success) throw new Error(res.message || 'Không thể cập nhật bàn');
  return adaptTable(res.data!);
}

