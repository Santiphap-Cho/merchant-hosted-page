import { create } from "zustand";
import type { Cart, CartItem, Product } from "@thaimark/shared-types";
import { apiFetch, getSessionId } from "../lib/api";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  sessionId: string;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  fetchCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  itemCount: () => number;
  subtotal: () => number;
  clearLocal: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  isLoading: false,
  sessionId: getSessionId(),

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await apiFetch<Cart>(`/api/cart/${get().sessionId}`);
      set({ items: cart.items });
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (product, quantity = 1) => {
    set({ isLoading: true });
    try {
      const cart = await apiFetch<Cart>("/api/cart", {
        method: "POST",
        body: JSON.stringify({
          sessionId: get().sessionId,
          productId: product.id,
          quantity,
        }),
      });
      set({ items: cart.items, isOpen: true });
    } finally {
      set({ isLoading: false });
    }
  },

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: () =>
    get().items.reduce(
      (sum, i) => sum + (i.product?.price ?? 0) * i.quantity,
      0,
    ),

  clearLocal: () => set({ items: [] }),
}));
