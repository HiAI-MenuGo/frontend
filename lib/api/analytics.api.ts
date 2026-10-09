import { apiFetch } from '../api';
import type { AnalyticsOverviewDTO } from './types';
import { DEFAULT_BRANCH_ID } from './types';

export async function fetchAnalyticsOverview(branchId = DEFAULT_BRANCH_ID, date?: string): Promise<AnalyticsOverviewDTO> {
  const params = new URLSearchParams({ branchId });
  if (date) params.set('date', date);
  const res = await apiFetch<AnalyticsOverviewDTO>(`/analytics/overview?${params.toString()}`);
  if (!res.success) throw new Error(res.message || 'Không tải được dữ liệu dashboard');
  if (!res.data) throw new Error('Dashboard trả về rỗng');
  return res.data;
}
