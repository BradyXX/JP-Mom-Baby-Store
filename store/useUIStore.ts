import { create } from 'zustand';

interface UIState {
  isSearchOpen: boolean;
  isCartOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  isCartOpen: false,
  openSearch: () => set({ isSearchOpen: true, isCartOpen: false }),
  closeSearch: () => set({ isSearchOpen: false }),
  openCart: () => set({ isCartOpen: true, isSearchOpen: false }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen, isSearchOpen: false })),
}));
