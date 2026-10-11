import { apiFetch } from '../api';

export type VoucherType = 'PERCENT' | 'FIXED';

export interface VoucherItem {
  id: string;
  tenantId: string;
  code: string;
  description?: string | null;
  type: VoucherType;
  value: number;
  maxDiscount?: number | null;
  minOrderVal: number;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVoucherInput {
  code: string;
  description?: string;
  type: VoucherType;
  value: number;
  maxDiscount?: number | null;
  minOrderVal?: number;
  usageLimit?: number | null;
  startDate?: string;
  endDate: string;
}

export interface UpdateVoucherInput {
  code?: string;
  description?: string;
  type?: VoucherType;
  value?: number;
  maxDiscount?: number | null;
  minOrderVal?: number;
  usageLimit?: number | null;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface ValidateVoucherResult {
  code: string;
  type: VoucherType;
  value: number;
  discountAmount: number;
  finalAmount: number;
  voucherId?: string;
}

/**
 * Lấy danh sách voucher khuyến mãi của quán
 */
export async function fetchVouchers(activeOnly = false): Promise<VoucherItem[]> {
  const query = activeOnly ? '?activeOnly=true' : '';
  const res = await apiFetch<VoucherItem[]>(`/vouchers${query}`);
  if (!res.success) throw new Error(res.message || 'Không thể tải danh sách khuyến mãi');
  return res.data ?? [];
}

/**
 * Tạo mới mã khuyến mãi
 */
export async function createVoucher(input: CreateVoucherInput): Promise<VoucherItem> {
  const res = await apiFetch<VoucherItem>('/vouchers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.success) throw new Error(res.message || 'Không thể tạo mã khuyến mãi');
  return res.data!;
}

/**
 * Chỉnh sửa mã khuyến mãi
 */
export async function updateVoucher(id: string, input: UpdateVoucherInput): Promise<VoucherItem> {
  const res = await apiFetch<VoucherItem>(`/vouchers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!res.success) throw new Error(res.message || 'Không thể cập nhật mã khuyến mãi');
  return res.data!;
}

/**
 * Bật hoặc tắt trạng thái kích hoạt của mã khuyến mãi
 */
export async function toggleVoucherStatus(id: string, isActive: boolean): Promise<VoucherItem> {
  return updateVoucher(id, { isActive });
}

/**
 * Xóa hoặc vô hiệu hóa mã khuyến mãi
 */
export async function deleteVoucher(id: string): Promise<{ id: string; deleted?: boolean; softDeleted?: boolean; message?: string }> {
  const res = await apiFetch<{ id: string; deleted?: boolean; softDeleted?: boolean }>(`/vouchers/${id}`, {
    method: 'DELETE',
  });
  if (!res.success) throw new Error(res.message || 'Không thể xóa mã khuyến mãi');
  return { ...res.data!, message: res.message };
}

/**
 * Kiểm tra và áp dụng mã khuyến mãi (Validation)
 */
export async function validateVoucher(code: string, subTotal: number, tableId?: string): Promise<ValidateVoucherResult> {
  const res = await apiFetch<ValidateVoucherResult>('/vouchers/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subTotal, tableId }),
  });
  if (!res.success) throw new Error(res.message || 'Mã khuyến mãi không hợp lệ');
  return res.data!;
}
