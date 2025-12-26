import { create } from 'zustand';

interface UIState {
  isSearchOpen: boolean;
  isCartOpen: boolean;
  isCategoryOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openCategory: () => void;
  closeCategory: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  isCartOpen: false,
  isCategoryOpen: false,
  openSearch: () => set({ isSearchOpen: true, isCartOpen: false, isCategoryOpen: false }),
  closeSearch: () => set({ isSearchOpen: false }),
  openCart: () => set({ isCartOpen: true, isSearchOpen: false, isCategoryOpen: false }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen, isSearchOpen: false, isCategoryOpen: false })),
  openCategory: () => set({ isCategoryOpen: true, isSearchOpen: false, isCartOpen: false }),
  closeCategory: () => set({ isCategoryOpen: false }),
}));