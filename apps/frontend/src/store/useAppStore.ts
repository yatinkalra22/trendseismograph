import { create } from 'zustand';

interface AppStore {
  selectedStage: string | null;
  selectedCategory: string | null;
  viewMode: 'grid' | 'table';
  setStage: (s: string | null) => void;
  setCategory: (c: string | null) => void;
  setViewMode: (m: 'grid' | 'table') => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedStage: null,
  selectedCategory: null,
  viewMode: 'grid',
  setStage: (s) => set({ selectedStage: s }),
  setCategory: (c) => set({ selectedCategory: c }),
  setViewMode: (m) => set({ viewMode: m }),
}));
