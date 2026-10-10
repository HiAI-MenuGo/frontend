'use client';

import React, { useState, useMemo } from 'react';
import { MenuItemView } from '../hooks/useMenuSoldOut';
import { SelectedModifier } from '../../../stores/cart.store';
import { X, Plus, Minus, Check } from 'lucide-react';
import Image from 'next/image';
import { useI18n } from '../../../context/i18nContext';

interface CustomerItemOptionsModalProps {
  item: MenuItemView | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItemView, quantity: number, modifiers: SelectedModifier[], note: string) => void;
  primaryColor?: string;
}

export function CustomerItemOptionsModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
  primaryColor = '#00A389',
}: CustomerItemOptionsModalProps) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState('');

  // Reset modal state when item opens
  React.useEffect(() => {
    if (item && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantity(1);
      setNote('');
      const initialSelections: Record<string, string[]> = {};
      item.modifierGroups?.forEach(({ modifierGroup: group }) => {
        const defaultOpt = group.options.find((o) => o.isDefault) || group.options[0];
        if (defaultOpt && group.minSelect >= 1) {
          initialSelections[group.id] = [defaultOpt.id];
        } else {
          initialSelections[group.id] = [];
        }
      });
      setSelectedOptions(initialSelections);
    }
  }, [item, isOpen]);

  const catRaw = item?.category || '';
  const catName =
    typeof catRaw === 'string'
      ? catRaw
      : typeof catRaw === 'object' && catRaw !== null && 'name' in catRaw
      ? String((catRaw as { name: string }).name)
      : '';

  const isDrink = useMemo(() => {
    const kws = ['coffee', 'cà phê', 'tea', 'trà', 'drink', 'nước', 'juice', 'boba', 'smoothie'];
    const hasProp =
      typeof item?.category === 'object' && item?.category !== null && 'isDrink' in item.category
        ? Boolean(item.category.isDrink)
        : false;
    return kws.some((k) => catName.toLowerCase().includes(k)) || hasProp;
  }, [catName, item]);

  // Calculate realtime total price
  const totalPrice = useMemo(() => {
    if (!item) return 0;
    let extra = 0;
    item.modifierGroups?.forEach(({ modifierGroup: group }) => {
      const selectedIds = selectedOptions[group.id] || [];
      group.options.forEach((opt) => {
        if (selectedIds.includes(opt.id)) {
          extra += opt.extraPrice;
        }
      });
    });
    return (item.basePrice + extra) * quantity;
  }, [item, selectedOptions, quantity]);

  if (!isOpen || !item) return null;

  const toggleOption = (groupId: string, optionId: string, isSingleSelect: boolean) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];
      if (isSingleSelect) {
        return { ...prev, [groupId]: [optionId] };
      } else {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [groupId]: next };
      }
    });
  };

  const handleConfirm = () => {
    const chosenModifiers: SelectedModifier[] = [];
    item.modifierGroups?.forEach(({ modifierGroup: group }) => {
      const selectedIds = selectedOptions[group.id] || [];
      group.options.forEach((opt) => {
        if (selectedIds.includes(opt.id)) {
          chosenModifiers.push({
            groupId: group.id,
            groupName: group.name,
            optionId: opt.id,
            optionName: opt.name,
            extraPrice: opt.extraPrice,
          });
        }
      });
    });

    onAddToCart(item, quantity, chosenModifiers, note.trim());
    onClose();
  };

  // Filter modifier groups: food items hide Đường & Đá
  const visibleModifierGroups = (item.modifierGroups || []).filter(({ modifierGroup: group }) => {
    const gName = (group.name || '').toLowerCase();
    const isDrinkExclusive =
      gName.includes('đường') ||
      gName.includes('sugar') ||
      gName.includes('đá') ||
      gName.includes('ice');

    if (!isDrink && isDrinkExclusive) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[rgba(15,23,42,0.5)] backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-lg bg-white border border-[#E2E8F0] rounded-t-[28px] sm:rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl animate-in slide-in-from-bottom duration-250"
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-200 flex items-center justify-center transition-all"
            >
              <X size={18} />
            </button>
            <div>
              <h3 className="text-[17px] font-extrabold text-[#0F172A] line-clamp-1">
                Tuỳ chọn món ăn
              </h3>
              <p className="text-[11.5px] text-[#64748B] font-medium">
                {catName || 'Món chính'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Item Hero Card */}
          <div className="flex gap-3.5 bg-[#F8FAFC] rounded-2xl p-3 border border-[#E2E8F0]">
            <div className="relative w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0 border border-[#E2E8F0]">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#94A3B8] text-xs font-mono">
                  MenuGo
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-[15px] text-[#0F172A] leading-tight">
                  {item.name}
                </h4>
                {item.description && (
                  <p className="text-[11px] text-[#64748B] line-clamp-2 mt-1 leading-snug">
                    {item.description}
                  </p>
                )}
              </div>
              <span className="text-[15px] font-black text-[#008770] font-mono">
                {item.basePrice.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          {/* Modifier Groups */}
          {visibleModifierGroups.map(({ modifierGroup: group }) => {
            const isSingle = group.maxSelect === 1;
            const selectedIds = selectedOptions[group.id] || [];

            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[13.5px] font-extrabold text-[#0F172A]">
                      {group.name}
                    </h4>
                    {group.isRequired ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 font-bold text-[10px]">
                        Bắt buộc
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[#64748B] font-semibold text-[10px]">
                        Tuỳ chọn
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#94A3B8] font-medium">
                    {isSingle ? 'Chọn 1' : `Tối đa ${group.maxSelect}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {group.options.map((option) => {
                    const isSelected = selectedIds.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleOption(group.id, option.id, isSingle)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-[12.5px] text-left transition-all ${
                          isSelected
                            ? 'border-2 border-[#00A389] bg-[#E6F7F4]/70 text-[#00A389] font-bold shadow-2xs'
                            : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] font-medium hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{option.name}</span>
                        <div className="flex items-center gap-1 ml-1.5 shrink-0">
                          {option.extraPrice > 0 && (
                            <span className="text-[11px] font-mono font-bold text-[#008770]">
                              +{option.extraPrice.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                          {isSelected && <Check size={14} className="text-[#00A389]" strokeWidth={2.5} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-extrabold text-[#0F172A]">
              {t('menu.note', 'Ghi chú cho món')}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="VD: ít ngọt, nhiều đá, không lấy thìa nhựa..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[12.5px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#00A389] focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-[#F1F5F9] bg-white flex items-center gap-3 shrink-0">
          {/* Stepper Số Lượng */}
          <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl p-1.5 border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-all"
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>
            <span className="w-6 text-center text-[13.5px] font-extrabold text-[#0F172A]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center hover:bg-slate-100 transition-all"
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleConfirm}
            style={{ backgroundColor: primaryColor }}
            className="flex-1 py-3 px-4.5 rounded-2xl font-extrabold text-white hover:brightness-105 flex items-center justify-between shadow-lg shadow-[#00A389]/25 active:scale-[0.98] transition-all"
          >
            <span className="text-[13.5px]">{t('menu.addToCart', 'Thêm vào giỏ')}</span>
            <span className="text-[14px] font-mono font-black">{totalPrice.toLocaleString('vi-VN')}đ</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerItemOptionsModal;
