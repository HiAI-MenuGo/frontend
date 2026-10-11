/**
 * Date Utilities - Đồng bộ toàn bộ app dùng DD-MM-YYYY (hiển thị) / YYYY-MM-DD (API)
 * Múi giờ: Asia/Ho_Chi_Minh (GMT+7)
 */

// ==========================================
// FORMAT CHO HIỂN THỊ (UI)
// ==========================================

/**
 * Format Date sang DD-MM-YYYY (VD: 25-12-2025)
 */
export function formatDisplayDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format DateTime sang DD-MM-YYYY HH:mm (VD: 25-12-2025 14:30)
 */
export function formatDisplayDateTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${formatDisplayDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Format DateTime đầy đủ DD-MM-YYYY HH:mm:ss
 */
export function formatDisplayDateTimeFull(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${formatDisplayDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

/**
 * Format cho input type="date" (YYYY-MM-DD) - dùng cho value của <input type="date">
 */
export function formatDateInput(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format ngắn DD/MM cho chart trục hoành
 */
export function formatShortDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

// ==========================================
// PARSE TỪ UI (DD-MM-YYYY) -> API (YYYY-MM-DD)
// ==========================================

/**
 * Parse string DD-MM-YYYY sang Date object (giờ local GMT+7)
 */
export function parseDisplayDate(displayDate: string): Date | null {
  // Hỗ trợ cả DD-MM-YYYY và DD/MM/YYYY
  const parts = displayDate.split(/[-/]/);
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  // Tạo date ở local timezone (GMT+7 do process.env.TZ)
  return new Date(year, month - 1, day);
}

/**
 * Chuyển DD-MM-YYYY sang YYYY-MM-DD cho API
 */
export function displayToApiDate(displayDate: string): string {
  const d = parseDisplayDate(displayDate);
  return d ? formatDateInput(d) : '';
}

/**
 * Chuyển YYYY-MM-DD (API) sang DD-MM-YYYY (hiển thị)
 */
export function apiToDisplayDate(apiDate: string): string {
  if (!apiDate) return '';
  const parts = apiDate.split('-');
  if (parts.length !== 3) return apiDate;
  const [year, month, day] = parts;
  return `${day}-${month}-${year}`;
}

// ==========================================
// HELPER CHO DATE RANGE (START/END)
// ==========================================

export interface DateRange {
  startDate: string; // DD-MM-YYYY (display)
  endDate: string;   // DD-MM-YYYY (display)
}

export interface ApiDateRange {
  startDate: string; // YYYY-MM-DD (API)
  endDate: string;   // YYYY-MM-DD (API)
}

/**
 * Chuyển DateRange display -> API
 */
export function dateRangeToApi(range: DateRange): ApiDateRange {
  return {
    startDate: displayToApiDate(range.startDate),
    endDate: displayToApiDate(range.endDate),
  };
}

/**
 * Chuyển ApiDateRange -> DateRange display
 */
export function apiToDateRange(range: ApiDateRange): DateRange {
  return {
    startDate: apiToDisplayDate(range.startDate),
    endDate: apiToDisplayDate(range.endDate),
  };
}

/**
 * Lấy hôm nay (DD-MM-YYYY)
 */
export function getTodayDisplay(): string {
  return formatDisplayDate(new Date());
}

/**
 * Lấy ngày mặc định cho báo cáo (30 ngày trước -> hôm nay)
 */
export function getDefaultReportRange(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29); // 30 ngày bao gồm hôm nay
  return {
    startDate: formatDisplayDate(start),
    endDate: formatDisplayDate(end),
  };
}

/**
 * Validate date range
 */
export function isValidDateRange(start: string, end: string): boolean {
  const s = parseDisplayDate(start);
  const e = parseDisplayDate(end);
  if (!s || !e) return false;
  return s <= e;
}

// ==========================================
// REACT HOOK CHO DATE PICKER
// ==========================================

import { useState, useCallback } from 'react';

export interface UseDateRangeReturn {
  startDate: string;      // DD-MM-YYYY
  endDate: string;        // DD-MM-YYYY
  setStartDate: (d: string) => void;
  setEndDate: (d: string) => void;
  setRange: (start: string, end: string) => void;
  resetToDefault: () => void;
  apiRange: ApiDateRange; // YYYY-MM-DD cho API call
  isValid: boolean;
}

export function useDateRange(defaultDays = 29): UseDateRangeReturn {
  const getDefault = useCallback(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - defaultDays);
    return { startDate: formatDisplayDate(start), endDate: formatDisplayDate(end) };
  }, [defaultDays]);

  const [startDate, setStartDate] = useState<string>(() => getDefault().startDate);
  const [endDate, setEndDate] = useState<string>(() => getDefault().endDate);

  const setRange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const resetToDefault = useCallback(() => {
    const d = getDefault();
    setStartDate(d.startDate);
    setEndDate(d.endDate);
  }, [getDefault]);

  const apiRange: ApiDateRange = {
    startDate: displayToApiDate(startDate),
    endDate: displayToApiDate(endDate),
  };

  const isValid = isValidDateRange(startDate, endDate);

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    setRange,
    resetToDefault,
    apiRange,
    isValid,
  };
}