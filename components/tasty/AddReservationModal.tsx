'use client';

import React, { useState } from 'react';
import { X, Calendar, Plus, Clock, Users, Phone } from 'lucide-react';
import { ReservationItem } from './mockData';

interface AddReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReservation: (newRes: ReservationItem) => void;
}

export const AddReservationModal: React.FC<AddReservationModalProps> = ({
  isOpen,
  onClose,
  onAddReservation,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('+84 ');
  const [tableNumber, setTableNumber] = useState('1');
  const [guestsCount, setGuestsCount] = useState('4');
  const [time, setTime] = useState('7:30 PM');
  const [period, setPeriod] = useState<'Dinner' | 'Lunch' | 'Breakfast'>('Dinner');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const newRes: ReservationItem = {
      id: `res_${Date.now()}`,
      time: time,
      customerName: customerName.trim(),
      tableNumber: parseInt(tableNumber) || 1,
      guestsCount: parseInt(guestsCount) || 2,
      phone: phone.trim() || '+84 900 000 000',
      status: 'PAYMENT',
      statusLabel: 'Payment',
      period: period,
    };

    onAddReservation(newRes);
    setCustomerName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-full hover:bg-[#F8FAFC]"
        >
          <X size={18} />
        </button>

        <h3 className="font-extrabold text-[18px] text-[#0F172A] mb-1">
          Tạo Đặt Bàn Mới
        </h3>
        <p className="text-[12px] text-[#64748B] mb-5">
          Nhập thông tin khách đặt bàn và gán vào sơ đồ vị trí
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">
              Họ Tên Khách Hàng *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="VD: Nguyễn Văn An"
              className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#00A389] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">
              Số Điện Thoại *
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+84 912 345 678"
              className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#00A389] focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">
                Bàn Chỉ Định
              </label>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#00A389] focus:bg-white transition-all"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <option key={num} value={num}>
                    Table #{num}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">
                Số Lượng Khách
              </label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={guestsCount}
                onChange={(e) => setGuestsCount(e.target.value)}
                className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#00A389] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">
                Giờ Hẹn Đến
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="7:30 PM"
                className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#00A389] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#0F172A] mb-1.5">
                Buổi
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#00A389] focus:bg-white transition-all"
              >
                <option value="Dinner">Dinner (Tối)</option>
                <option value="Lunch">Lunch (Trưa)</option>
                <option value="Breakfast">Breakfast (Sáng)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13px] font-bold text-[#64748B] hover:bg-[#F1F5F9]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-2xl bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Plus size={16} />
              <span>Xác Nhận Đặt Bàn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReservationModal;
