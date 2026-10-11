import { apiFetch } from '../api';
import type { AnalyticsOverviewDTO, RevenueReportDTO } from './types';
import { DEFAULT_BRANCH_ID } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchAnalyticsOverview(branchId = 'ALL', date?: string): Promise<AnalyticsOverviewDTO> {
  const params = new URLSearchParams({ branchId });
  if (date) params.set('date', date);
  const res = await apiFetch<AnalyticsOverviewDTO>(`/analytics/overview?${params.toString()}`);
  if (!res.success) throw new Error(res.message || 'Không tải được dữ liệu dashboard');
  if (!res.data) throw new Error('Dashboard trả về rỗng');
  return res.data;
}

function toApiDate(d?: string): string | undefined {
  if (!d) return undefined;
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    const [day, month, year] = d.split('-');
    return `${year}-${month}-${day}`;
  }
  return d;
}

export async function fetchRevenueReport(params: {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<RevenueReportDTO> {
  const query = new URLSearchParams({ branchId: params.branchId || 'ALL' });
  const sDate = toApiDate(params.startDate);
  const eDate = toApiDate(params.endDate);
  if (sDate) query.set('startDate', sDate);
  if (eDate) query.set('endDate', eDate);

  const res = await apiFetch<RevenueReportDTO>(`/analytics/revenue?${query.toString()}`);
  if (!res.success) throw new Error(res.message || 'Không tải được báo cáo doanh thu');
  if (!res.data) throw new Error('Dữ liệu báo cáo doanh thu rỗng');
  return res.data;
}

export async function downloadRevenueExcel(params: {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<void> {
  const query = new URLSearchParams({ branchId: params.branchId || 'ALL' });
  const sDate = toApiDate(params.startDate);
  const eDate = toApiDate(params.endDate);
  if (sDate) query.set('startDate', sDate);
  if (eDate) query.set('endDate', eDate);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const url = `${API_URL}/analytics/revenue/export?${query.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Xuất file Excel thất bại (${res.status}): ${errorText || 'Lỗi kết nối máy chủ'}`);
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  const startPart = params.startDate || 'all';
  const endPart = params.endDate || 'now';
  link.download = `Bao-cao-doanh-thu-${startPart}_den_${endPart}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
