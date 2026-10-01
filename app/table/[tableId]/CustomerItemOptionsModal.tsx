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
  primaryColor = '#f59e0b',
}: CustomerItemOptionsModalProps) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState('');

  // Reset modal state when item opens
  React.useEffect(() => {
    if (item && isOpen) {
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
  const catName = typeof catRaw === 'string' ? catRaw : (catRaw as any)?.name || '';
  const isDrink = useMemo(() => {
    const kws = ['coffee', 'cà phê', 'tea', 'trà', 'drink', 'nước', 'juice', 'boba', 'smoothie'];
    return kws.some((k) => catName.toLowerCase().includes(k)) || (item?.category as any)?.isDrink;
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header with image */}
        <div className="relative h-44 sm:h-52 w-full bg-zinc-800">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">
              No Image
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-zinc-950/70 hover:bg-zinc-950 text-zinc-300 hover:text-white rounded-full backdrop-blur-md transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent p-4 flex flex-col justify-end">
            <h3 className="text-lg sm:text-xl font-bold text-zinc-100">{item.name}</h3>
            <span className="text-amber-400 font-bold text-base mt-0.5">
              {item.basePrice.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        {/* Scrollable Modifier Groups */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {item.description && (
            <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
              {item.description}
            </p>
          )}

          {visibleModifierGroups.map(({ modifierGroup: group }) => {
            const isSingle = group.maxSelect === 1;
            const selectedIds = selectedOptions[group.id] || [];

            return (
              <div key={group.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-200">
                    {group.name}
                    {group.isRequired && <span className="text-red-400 ml-1">*</span>}
                  </h4>
                  <span className="text-xs text-zinc-500">
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
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                            : 'border-zinc-800 bg-zinc-800/40 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <span className="truncate">{option.name}</span>
                        <div className="flex items-center gap-1.5 ml-2">
                          {option.extraPrice > 0 && (
                            <span className="text-amber-400 font-medium">
                              +{option.extraPrice.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
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
            <label className="text-sm font-semibold text-zinc-200">
              {t('menu.note', 'Ghi chú cho bếp')}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={t('menu.notePlaceholder', 'Ví dụ: ít ngọt • không lấy ống hút nhựa...')}
              className="w-full bg-zinc-800/60 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>
        </div>

        {/* Footer with Quantity & Add to Cart */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/80 flex items-center gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-zinc-800/80 rounded-xl p-1 border border-zinc-700">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-zinc-100">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-300"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            type="button"
            onClick={handleConfirm}
            style={{ backgroundColor: primaryColor }}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-zinc-950 flex items-center justify-between shadow-lg shadow-amber-500/20 active:scale-[0.98] transition hover:brightness-105"
          >
            <span>{t('menu.addToCart', 'Thêm vào giỏ')}</span>
            <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerItemOptionsModal;
