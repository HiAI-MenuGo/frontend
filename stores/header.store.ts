import type { ReactNode } from 'react';
import { create } from 'zustand';

interface HeaderStore {
  customTitle: string | null;
  setCustomTitle: (title: string | null) => void;
  customAction: ReactNode | null;
  setCustomAction: (action: ReactNode | null) => void;
}

export const useHeaderStore = create<HeaderStore>((set) => ({
  customTitle: null,
  setCustomTitle: (customTitle) => set({ customTitle }),
  customAction: null,
  setCustomAction: (customAction) => set({ customAction }),
}));
