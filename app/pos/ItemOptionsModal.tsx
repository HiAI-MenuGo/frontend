'use client';

import React, { useState } from 'react';
import { MenuItemView } from '../table/hooks/useMenuSoldOut';
import { SelectedModifier } from '../../stores/cart.store';
import { X, Check } from 'lucide-react';

interface PosItemOptionsModalProps {
  item: MenuItemView | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: MenuItemView, quantity: number, modifiers: SelectedModifier[], note: string) => void;
}

export function PosItemOptionsModal({
  item,
  isOpen,
  onClose,
  onConfirm,
}: PosItemOptionsModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  React.useEffect(() => {
    if (item && isOpen) {
      setQuantity(1);
      setNote('');
      const init: Record<string, string[]> = {};
      item.modifierGroups?.forEach(({ modifierGroup: g }) => {
        const def = g.options.find((o) => o.isDefault) || g.options[0];
        if (def && g.minSelect >= 1) init[g.id] = [def.id];
        else init[g.id] = [];
      });
      setSelectedOptions(init);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const toggleOption = (groupId: string, optionId: string, isSingle: boolean) => {
    setSelectedOptions((prev) => {
      const cur = prev[groupId] || [];
      if (isSingle) return { ...prev, [groupId]: [optionId] };
      return {
        ...prev,
        [groupId]: cur.includes(optionId) ? cur.filter((id) => id !== optionId) : [...cur, optionId],
      };
    });
  };

  const handleAdd = () => {
    const chosen: SelectedModifier[] = [];
    item.modifierGroups?.forEach(({ modifierGroup: g }) => {
      const selIds = selectedOptions[g.id] || [];
      g.options.forEach((opt) => {
        if (selIds.includes(opt.id)) {
          chosen.push({
            groupId: g.id,
            groupName: g.name,
            optionId: opt.id,
            optionName: opt.name,
            extraPrice: opt.extraPrice,
          });
        }
      });
    });
    onConfirm(item, quantity, chosen, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="font-bold text-base text-zinc-100">{item.name}</h3>
            <span className="text-xs font-bold text-amber-400">
              {item.basePrice.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {item.modifierGroups?.map(({ modifierGroup: group }) => (
            <div key={group.id} className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300">{group.name}</span>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map((opt) => {
                  const isSelected = (selectedOptions[group.id] || []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(group.id, opt.id, group.maxSelect === 1)}
                      className={`p-2 rounded-xl border text-xs text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                          : 'border-zinc-800 bg-zinc-800/40 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span className="truncate">{opt.name}</span>
                      {opt.extraPrice > 0 && (
                        <span className="text-[10px] text-amber-400">
                          +{opt.extraPrice.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-300">Ghi chú cho bếp</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú nhanh..."
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800 flex items-center gap-3">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 font-bold text-zinc-950 text-xs rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
          >
            Thêm vào đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
}

export default PosItemOptionsModal;
