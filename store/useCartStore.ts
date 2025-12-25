import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem } from '@/lib/supabase/types';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, variantId?: string) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.productId === newItem.productId && item.variantId === newItem.variantId
          );

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            const existingItem = updatedItems[existingItemIndex];
            // Ensure we don't exceed max stock
            const newQty = Math.min(existingItem.quantity + newItem.quantity, existingItem.maxStock);
            updatedItems[existingItemIndex] = { ...existingItem, quantity: newQty };
            return { items: updatedItems };
          }

          return { items: [...state.items, newItem] };
        });
      },
      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && item.variantId === variantId)
          ),
        }));
      },
      updateQuantity: (productId, quantity, variantId) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.productId === productId && item.variantId === variantId) {
              return { ...item, quantity: Math.min(Math.max(1, quantity), item.maxStock) };
            }
            return item;
          }),
        }));
      },
      clearCart: () => set({ items: [] }),
      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      getCartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'jp-store-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
