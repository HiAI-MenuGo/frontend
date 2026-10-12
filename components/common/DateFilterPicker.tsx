'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronDown, X, RotateCcw, Check } from 'lucide-react';

export type DateFilterTimeframe = 'day' | 'month' | 'year' | 'all';

export interface DateFilterRange {
  timeframe: DateFilterTimeframe;
  startDate: string; // DD-MM-YYYY
  endDate: string;   // DD-MM-YYYY
  label: string;     // VD: "12/10/2026", "Tháng 10 / 2026", "Năm 2026"
}

export interface DateFilterPickerProps {
  startDate?: string;
  endDate?: string;
  initialTimeframe?: DateFilterTimeframe;
  onChange: (range: DateFilterRange) => void;
  allowAll?: boolean;
  className?: string;
  buttonClassName?: string;
}

const pad = (n: number) => n.toString().padStart(2, '0');

function parseInitial(start?: string, end?: string, initialTf?: DateFilterTimeframe) {
  const now = new Date();
  const defaultDay = now.getDate();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  if (!start) {
    return {
      timeframe: initialTf || ('day' as DateFilterTimeframe),
      day: defaultDay,
      month: defaultMonth,
      year: defaultYear,
    };
  }

  const sParts = start.split(/[-/]/).map(Number);
  const eParts = end ? end.split(/[-/]/).map(Number) : sParts;

  if (sParts.length === 3 && eParts.length === 3) {
    const [sDay, sMonth, sYear] = sParts;
    const [eDay, eMonth, eYear] = eParts;

    if (start === end) {
      return {
        timeframe: 'day' as DateFilterTimeframe,
        day: sDay || defaultDay,
        month: sMonth || defaultMonth,
        year: sYear || defaultYear,
      };
    }

    if (sDay === 1 && sMonth === eMonth && sYear === eYear) {
      const lastDay = new Date(sYear, sMonth, 0).getDate();
      if (eDay === lastDay) {
        return {
          timeframe: 'month' as DateFilterTimeframe,
          day: 1,
          month: sMonth,
          year: sYear,
        };
      }
    }

    if (sDay === 1 && sMonth === 1 && eDay === 31 && eMonth === 12 && sYear === eYear) {
      return {
        timeframe: 'year' as DateFilterTimeframe,
        day: 1,
        month: 1,
        year: sYear,
      };
    }

    return {
      timeframe: (initialTf || 'day') as DateFilterTimeframe,
      day: sDay || defaultDay,
      month: sMonth || defaultMonth,
      year: sYear || defaultYear,
    };
  }

  return {
    timeframe: initialTf || ('day' as DateFilterTimeframe),
    day: defaultDay,
    month: defaultMonth,
    year: defaultYear,
  };
}

export default function DateFilterPicker({
  startDate,
  endDate,
  initialTimeframe = 'day',
  onChange,
  allowAll = false,
  className = '',
  buttonClassName = '',
}: DateFilterPickerProps) {
  const parsed = useMemo(
    () => parseInitial(startDate, endDate, initialTimeframe),
    [startDate, endDate, initialTimeframe]
  );

  const [timeframe, setTimeframe] = useState<DateFilterTimeframe>(parsed.timeframe);
  const [selectedDay, setSelectedDay] = useState<number>(parsed.day);
  const [selectedMonth, setSelectedMonth] = useState<number>(parsed.month);
  const [selectedYear, setSelectedYear] = useState<number>(parsed.year);

  // Modal Picker state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempTimeframe, setTempTimeframe] = useState<DateFilterTimeframe>(parsed.timeframe);
  const [tempDay, setTempDay] = useState<number>(parsed.day);
  const [tempMonth, setTempMonth] = useState<number>(parsed.month);
  const [tempYear, setTempYear] = useState<number>(parsed.year);

  // Sync state if props change externally
  useEffect(() => {
    setTimeframe(parsed.timeframe);
    setSelectedDay(parsed.day);
    setSelectedMonth(parsed.month);
    setSelectedYear(parsed.year);
  }, [parsed]);

  // Compute days in current temp month
  const daysInCurrentMonth = useMemo(() => {
    return new Date(tempYear, tempMonth, 0).getDate();
  }, [tempYear, tempMonth]);

  // Adjust tempDay if month changes and daysInMonth is smaller
  useEffect(() => {
    if (tempDay > daysInCurrentMonth) {
      setTempDay(daysInCurrentMonth);
    }
  }, [tempMonth, tempYear, daysInCurrentMonth, tempDay]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  }, [daysInCurrentMonth]);

  const monthsArray = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, []);

  const yearsArray = useMemo(() => {
    const curYear = new Date().getFullYear();
    return [curYear - 2, curYear - 1, curYear, curYear + 1];
  }, []);

  const openPicker = () => {
    setTempTimeframe(timeframe);
    setTempDay(selectedDay);
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
    setIsModalOpen(true);
  };

  const closePicker = () => {
    setIsModalOpen(false);
  };

  // Close on Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePicker();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Build filter range
  const buildRange = (
    tf: DateFilterTimeframe,
    d: number,
    m: number,
    y: number
  ): DateFilterRange => {
    if (tf === 'day') {
      const dStr = `${pad(d)}-${pad(m)}-${y}`;
      return {
        timeframe: 'day',
        startDate: dStr,
        endDate: dStr,
        label: `${pad(d)}/${pad(m)}/${y}`,
      };
    }
    if (tf === 'month') {
      const lastDay = new Date(y, m, 0).getDate();
      return {
        timeframe: 'month',
        startDate: `01-${pad(m)}-${y}`,
        endDate: `${pad(lastDay)}-${pad(m)}-${y}`,
        label: `Tháng ${pad(m)} / ${y}`,
      };
    }
    if (tf === 'year') {
      return {
        timeframe: 'year',
        startDate: `01-01-${y}`,
        endDate: `31-12-${y}`,
        label: `Năm ${y}`,
      };
    }
    return {
      timeframe: 'all',
      startDate: '',
      endDate: '',
      label: 'Tất cả thời gian',
    };
  };

  const applyPicker = () => {
    setTimeframe(tempTimeframe);
    setSelectedDay(tempDay);
    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
    setIsModalOpen(false);

    const range = buildRange(tempTimeframe, tempDay, tempMonth, tempYear);
    onChange(range);
  };

  const resetToToday = () => {
    const now = new Date();
    const d = now.getDate();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();

    setTempTimeframe('day');
    setTempDay(d);
    setTempMonth(m);
    setTempYear(y);

    setTimeframe('day');
    setSelectedDay(d);
    setSelectedMonth(m);
    setSelectedYear(y);
    setIsModalOpen(false);

    const range = buildRange('day', d, m, y);
    onChange(range);
  };

  // Label hiển thị trên trigger button
  const currentLabel = useMemo(() => {
    if (timeframe === 'day') {
      return `${pad(selectedDay)}/${pad(selectedMonth)}/${selectedYear}`;
    }
    if (timeframe === 'month') {
      return `Tháng ${pad(selectedMonth)} / ${selectedYear}`;
    }
    if (timeframe === 'year') {
      return `Năm ${selectedYear}`;
    }
    return 'Tất cả thời gian';
  }, [timeframe, selectedDay, selectedMonth, selectedYear]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={openPicker}
        className={`flex items-center gap-2 px-3 h-9 lg:h-10 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] shadow-2xs transition cursor-pointer select-none ${buttonClassName}`}
        title="Nhấn để lọc theo ngày, tháng hoặc năm"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-[#00A389] shrink-0" />
        <span className="font-extrabold text-[#0F172A]">{currentLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
      </button>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={closePicker}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-[420px] shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-[#0F172A]">
                {tempTimeframe === 'day' && 'Chọn Ngày Cần Xem'}
                {tempTimeframe === 'month' && 'Chọn Tháng Cần Xem'}
                {tempTimeframe === 'year' && 'Chọn Năm Cần Xem'}
                {tempTimeframe === 'all' && 'Toàn Bộ Thời Gian'}
              </h3>
              <button
                type="button"
                onClick={closePicker}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Control: NGÀY / THÁNG / NĂM (Tương tự mobile) */}
            <div className="flex bg-[#F1F5F9] rounded-2xl p-1 mb-4">
              <button
                type="button"
                onClick={() => setTempTimeframe('day')}
                className={`flex-1 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                  tempTimeframe === 'day'
                    ? 'bg-white text-[#00A389] shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Theo Ngày
              </button>
              <button
                type="button"
                onClick={() => setTempTimeframe('month')}
                className={`flex-1 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                  tempTimeframe === 'month'
                    ? 'bg-white text-[#00A389] shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Theo Tháng
              </button>
              <button
                type="button"
                onClick={() => setTempTimeframe('year')}
                className={`flex-1 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                  tempTimeframe === 'year'
                    ? 'bg-white text-[#00A389] shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Theo Năm
              </button>
              {allowAll && (
                <button
                  type="button"
                  onClick={() => setTempTimeframe('all')}
                  className={`flex-1 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                    tempTimeframe === 'all'
                      ? 'bg-white text-[#00A389] shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tất Cả
                </button>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[380px] pr-1 view-scroll">
              {/* 1. CHỌN THEO NGÀY */}
              {tempTimeframe === 'day' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase block mb-2">
                      THÁNG & NĂM
                    </span>
                    {/* Hàng chọn tháng */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2 view-scroll">
                      {monthsArray.map((m) => {
                        const isCur = tempMonth === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setTempMonth(m)}
                            className={`px-3 py-1.5 rounded-full text-xs shrink-0 transition cursor-pointer ${
                              isCur
                                ? 'bg-[#00A389] text-white font-bold shadow-xs'
                                : 'bg-[#F1F5F9] text-slate-600 hover:bg-slate-200 font-semibold'
                            }`}
                          >
                            Thg {m}
                          </button>
                        );
                      })}
                    </div>

                    {/* Hàng chọn năm */}
                    <div className="flex gap-2">
                      {yearsArray.map((y) => {
                        const isCur = tempYear === y;
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={() => setTempYear(y)}
                            className={`flex-1 py-1.5 rounded-xl text-xs text-center border transition cursor-pointer ${
                              isCur
                                ? 'bg-[#ECFDF5] border-[#00A389] text-[#00A389] font-black'
                                : 'bg-[#F8FAFC] border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                            }`}
                          >
                            {y}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase block mb-2">
                      NGÀY TRONG THÁNG {pad(tempMonth)}/{tempYear}
                    </span>
                    {/* Lưới các ngày trong tháng */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                      {daysArray.map((d) => {
                        const isSelected = tempDay === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setTempDay(d)}
                            className={`h-10 rounded-xl flex items-center justify-center text-xs transition cursor-pointer border ${
                              isSelected
                                ? 'bg-[#00A389] border-[#00A389] text-white font-black shadow-xs'
                                : 'bg-[#F8FAFC] border-slate-200 text-[#0F172A] hover:bg-slate-100 font-bold'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. CHỌN THEO THÁNG */}
              {tempTimeframe === 'month' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase block mb-2">
                      CHỌN NĂM
                    </span>
                    <div className="flex gap-2">
                      {yearsArray.map((y) => {
                        const isCur = tempYear === y;
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={() => setTempYear(y)}
                            className={`flex-1 py-2 rounded-xl text-xs text-center border transition cursor-pointer ${
                              isCur
                                ? 'bg-[#ECFDF5] border-[#00A389] text-[#00A389] font-black'
                                : 'bg-[#F8FAFC] border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'
                            }`}
                          >
                            {y}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase block mb-2">
                      CÁC THÁNG TRONG NĂM {tempYear}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {monthsArray.map((m) => {
                        const isSelected = tempMonth === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setTempMonth(m)}
                            className={`py-3 rounded-2xl text-xs text-center border transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#00A389] border-[#00A389] text-white font-black shadow-xs'
                                : 'bg-[#F8FAFC] border-slate-200 text-[#0F172A] hover:bg-slate-100 font-bold'
                            }`}
                          >
                            Tháng {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. CHỌN THEO NĂM */}
              {tempTimeframe === 'year' && (
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 tracking-wider uppercase block mb-2">
                    CHỌN NĂM HOẠT ĐỘNG
                  </span>
                  <div className="space-y-2">
                    {yearsArray.map((y) => {
                      const isSelected = tempYear === y;
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setTempYear(y)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#ECFDF5] border-[#00A389] text-[#00A389] font-black'
                              : 'bg-[#F8FAFC] border-slate-200 text-[#0F172A] hover:bg-slate-100 font-bold'
                          }`}
                        >
                          <span className="text-sm">Năm {y}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#00A389] stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. CHỌN TẤT CẢ */}
              {tempTimeframe === 'all' && (
                <div className="py-8 text-center space-y-2">
                  <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">
                    Hiển thị toàn bộ dữ liệu, không giới hạn khoảng ngày lọc.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2.5 mt-5 pt-3.5 border-t border-slate-100">
              <button
                type="button"
                onClick={resetToToday}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl bg-[#F1F5F9] hover:bg-slate-200 text-slate-600 font-bold text-xs transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Hôm Nay</span>
              </button>

              <button
                type="button"
                onClick={applyPicker}
                className="flex-1 py-2.5 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-xs shadow-xs hover:shadow-emerald-500/20 active:scale-98 transition cursor-pointer"
              >
                Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
