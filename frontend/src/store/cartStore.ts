import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '../services/api';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  error: string | null;
}

interface CartActions {
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  clearError: () => void;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      // State
      items: [],
      totalItems: 0,
      totalPrice: 0,
      isLoading: false,
      error: null,

      // Actions
      addItem: async (productId: string, quantity: number) => {
        set({ isLoading: true, error: null });
        try {
          await cartApi.addItem(productId, quantity);
          await get().loadCart();
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to add item to cart',
            isLoading: false,
          });
          throw error;
        }
      },

      updateItem: async (itemId: string, quantity: number) => {
        set({ isLoading: true, error: null });
        try {
          await cartApi.updateItem(itemId, quantity);
          await get().loadCart();
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to update item',
            isLoading: false,
          });
          throw error;
        }
      },

      removeItem: async (itemId: string) => {
        set({ isLoading: true, error: null });
        try {
          await cartApi.removeItem(itemId);
          await get().loadCart();
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to remove item',
            isLoading: false,
          });
          throw error;
        }
      },

      clearCart: async () => {
        set({ isLoading: true, error: null });
        try {
          await cartApi.clearCart();
          set({
            items: [],
            totalItems: 0,
            totalPrice: 0,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to clear cart',
            isLoading: false,
          });
          throw error;
        }
      },

      loadCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await cartApi.getCart();
          const { cart } = response.data;
          const items = cart.items || [];
          
          const totalItems = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
          const totalPrice = items.reduce((sum: number, item: CartItem) => sum + (item.productPrice * item.quantity), 0);
          
          set({
            items,
            totalItems,
            totalPrice,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Failed to load cart',
            isLoading: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
      }),
    }
  )
);