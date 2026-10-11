'use client';

import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  Plus,
  Minus,
  Sparkles,
  CheckCircle2,
  Edit3,
  Check,
} from 'lucide-react';
import { formatVND } from '@/lib/format';
import type { MenuItemDTO } from '@/lib/api/types';

export interface ItemOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish: MenuItemDTO | null;
  onConfirm: (
    dish: MenuItemDTO,
    quantity: number,
    note: string,
    modifiers?: Record<string, string>
  ) => void;
}

export function ItemOptionsModal({
  isOpen,
  onClose,
  dish,
  onConfirm,
}: ItemOptionsModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>({});

  if (!isOpen || !dish) return null;

  // Nhóm tuỳ chỉnh mặc định cho thức uống nếu món thuộc nhóm đồ uống/trà/cà phê
  const catName = typeof dish.category === 'string' ? dish.category : (dish.category as any)?.name || '';
  const isBeverage =
    catName.toLowerCase().includes('uống') ||
    catName.toLowerCase().includes('trà') ||
    catName.toLowerCase().includes('cà phê') ||
    catName.toLowerCase().includes('nước') ||
    catName.toLowerCase().includes('latte') ||
    Boolean((dish as any)?.category?.isDrink) ||
    Boolean(dish.categoryObj?.isDrink);

  const defaultModifierGroups = isBeverage
    ? [
      {
        id: 'sugar',
        name: 'Độ ngọt',
        options: ['100% đường (Chuẩn)', '70% đường', '50% đường', 'Không đường'],
      },
      {
        id: 'ice',
        name: 'Độ đá',
        options: ['100% đá (Chuẩn)', '50% đá', 'Ít đá', 'Đá riêng', 'Không đá'],
      },
    ]
    : [];

  const handleSelectModifier = (groupName: string, optionName: string) => {
    setSelectedModifiers((prev) => ({
      ...prev,
      [groupName]: prev[groupName] === optionName ? '' : optionName,
    }));
  };

  const unitPrice = dish.price;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    // Tổng hợp note từ modifiers đã chọn và note nhập tay
    const chosenMods = Object.entries(selectedModifiers)
      .filter(([, v]) => !!v)
      .map(([, v]) => v);

    const fullNoteParts: string[] = [];
    if (chosenMods.length > 0) {
      fullNoteParts.push(chosenMods.join(', '));
    }
    if (note.trim()) {
      fullNoteParts.push(note.trim());
    }
    const finalNote = fullNoteParts.join(' • ');

    onConfirm(dish, quantity, finalNote, selectedModifiers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-[28px] sm:rounded-[32px] max-w-lg sm:max-w-xl w-full overflow-hidden shadow-2xl border border-[#E2E8F0] flex flex-col max-h-[92vh] relative">
        {/* Header Bar */}
        <div className="px-6 py-4.5 border-b border-[#F1F5F9] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#0F172A] transition-all"
              aria-label="Quay lại"
            >
              <ArrowLeft size={19} />
            </button>
            <h3 className="text-[20px] font-black text-[#0F172A] tracking-tight">Tuỳ Chọn</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center transition-all"
            aria-label="Đóng"
          >
            <X size={19} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-[#F8FAFC]">
          {/* Card Tóm Tắt Món Ăn (Hero Card) */}
          <div className="flex items-center bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dish.imageUrl}
              alt={dish.name}
              className="w-[88px] h-[88px] sm:w-[96px] sm:h-[96px] rounded-[18px] object-cover bg-[#F1F5F9] shrink-0"
            />
            <div className="ml-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-[17px] sm:text-[18px] font-black text-[#0F172A] truncate" title={dish.name}>
                  {dish.name}
                </h4>
                {dish.isPopular && (
                  <div className="inline-flex items-center gap-1 bg-[#FFEDD5] px-2.5 py-0.5 rounded-full">
                    <Sparkles size={11} className="text-[#C2410C]" />
                    <span className="text-[11px] font-bold text-[#C2410C]">Bán chạy</span>
                  </div>
                )}
              </div>
              <p className="text-[17px] sm:text-[18px] font-black text-[#00A389] mt-1">{formatVND(unitPrice)}</p>
              <p className="text-[12.5px] text-[#64748B] mt-0.5">{catName}</p>
            </div>
          </div>

          {/* Các nhóm tuỳ chọn (Độ ngọt, độ đá...) */}
          {defaultModifierGroups.map((group) => {
            const active = selectedModifiers[group.name];
            return (
              <div key={group.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[14px] font-black text-[#0F172A]">{group.name}</span>
                  <span className="text-[11px] font-bold text-[#00A389] bg-[#E6F7F4] px-2.5 py-0.5 rounded-full">
                    Tuỳ chọn
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((opt) => {
                    const isSelected = active === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectModifier(group.name, opt)}
                        className={`px-3.5 py-2 rounded-xl text-[12.5px] font-bold border flex items-center gap-1.5 transition-all ${isSelected
                          ? 'bg-[#E6F7F4] border-[#00A389] text-[#00A389]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'
                          }`}
                      >
                        {isSelected && <Check size={13} strokeWidth={3} />}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Ô Nhập Ghi Chú Cho Món Này (Tuỳ chọn) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
            <div className="flex items-center gap-2 mb-2.5">
              <Edit3 size={16} className="text-[#00A389]" />
              <label htmlFor="item-note" className="text-[14px] font-black text-[#0F172A]">
                Ghi chú
              </label>
            </div>
            <textarea
              id="item-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Ít ngọt, đậm vị trà, cho đá riêng, mang đi..."
              className="w-full p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[13.5px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#00A389] focus:bg-white resize-none transition-all leading-relaxed"
            />
          </div>

          {/* Bộ Chọn Số Lượng */}
          <div className="flex justify-between items-center bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
            <div>
              <p className="text-[15px] font-black text-[#0F172A]">Số lượng</p>
              <p className="text-[13px] text-[#64748B] mt-0.5">Đơn giá: {formatVND(unitPrice)}</p>
            </div>

            <div className="flex items-center bg-[#F1F5F9] rounded-full p-1.5 border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#00A389] hover:bg-[#F8FAFC] disabled:opacity-30 disabled:text-[#94A3B8] transition-all active:scale-95"
              >
                <Minus size={15} strokeWidth={2.6} />
              </button>

              <span className="text-[16px] sm:text-[17px] font-black text-[#0F172A] min-w-[38px] text-center select-none">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#00A389] hover:bg-[#F8FAFC] transition-all active:scale-95"
              >
                <Plus size={15} strokeWidth={2.6} />
              </button>
            </div>
          </div>
        </div>

        {/* Thanh Tác Vụ Đáy */}
        <div className="p-4 sm:p-5 border-t border-[#F1F5F9] bg-white flex items-center gap-3.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-7 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[14px] font-bold text-[#64748B] transition-all"
          >
            Huỷ
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 h-12 rounded-full bg-[#00A389] hover:bg-[#008f77] text-white font-extrabold text-[14.5px] flex items-center justify-center gap-2 shadow-md shadow-[#00A389]/20 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 size={17} strokeWidth={2.5} />
            <span>Xác Nhận • {formatVND(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItemOptionsModal;
