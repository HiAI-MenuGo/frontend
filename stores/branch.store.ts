import { create } from 'zustand';
import { Branch, fetchBranches } from '@/lib/api/branches.api';

interface BranchState {
  selectedBranchId: string;
  branches: Branch[];
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  fetchBranches: () => Promise<void>;
  setBranchId: (branchId: string) => void;
  getSelectedBranch: () => Branch | null;
  getSelectedBranchName: () => string;
}

const STORAGE_KEY = 'selected-branch-id';

export const useBranchStore = create<BranchState>((set, get) => ({
  selectedBranchId: 'ALL',
  branches: [],
  isLoading: false,
  error: null,

  initialize: async () => {
    let savedId = 'ALL';
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== 'default-branch' && stored !== '') {
        savedId = stored;
      } else {
        savedId = 'ALL';
        localStorage.setItem(STORAGE_KEY, 'ALL');
      }
    }
    set({ selectedBranchId: savedId });
    await get().fetchBranches();
  },

  fetchBranches: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchBranches();
      set({ branches: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Lỗi tải danh sách chi nhánh', isLoading: false });
    }
  },

  setBranchId: (branchId: string) => {
    const validId = !branchId || branchId === 'default-branch' ? 'ALL' : branchId;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, validId);
    }
    set({ selectedBranchId: validId });
  },

  getSelectedBranch: () => {
    const { selectedBranchId, branches } = get();
    if (!selectedBranchId || selectedBranchId === 'ALL') return null;
    return branches.find((b) => b.id === selectedBranchId) || null;
  },

  getSelectedBranchName: () => {
    const { selectedBranchId, branches } = get();
    if (!selectedBranchId || selectedBranchId === 'ALL') {
      return 'Tổng chi nhánh';
    }
    const b = branches.find((br) => br.id === selectedBranchId);
    return b ? b.name : 'Tổng chi nhánh';
  },
}));
