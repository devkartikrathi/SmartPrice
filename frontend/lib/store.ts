import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  originalPrice: number;
  bestPrice: number;
  platform: string;
  url: string;
  image?: string;
  quantity: number;
  description?: string;
  brand?: string;
}

interface AppState {
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // User preferences
  preferredCreditCard: string | undefined;
  setPreferredCreditCard: (card: string | undefined) => void;
  selectedCreditCards: string[];
  setSelectedCreditCards: (cards: string[]) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;

  // Chat state
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;

  // Cart state
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  getTotalSavings: () => number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),

      // User preferences
      preferredCreditCard: undefined,
      setPreferredCreditCard: (card) => set({ preferredCreditCard: card }),
      selectedCreditCards: [],
      setSelectedCreditCards: (cards) => set({ selectedCreditCards: cards }),

      // UI state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      cartOpen: false,
      setCartOpen: (open) => set({ cartOpen: open }),

      // Chat state
      activeConversationId: null,
      setActiveConversationId: (id) => set({ activeConversationId: id }),

      // Cart state
      cartItems: [],
      addToCart: (item) => {
        const items = get().cartItems;
        const existingItem = items.find(i => i.id === item.id);

        if (existingItem) {
          set({
            cartItems: items.map(i =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({
            cartItems: [...items, { ...item, quantity: 1 }],
          });
        }
      },
      removeFromCart: (itemId) => {
        set({
          cartItems: get().cartItems.filter(item => item.id !== itemId),
        });
      },
      updateCartQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }

        set({
          cartItems: get().cartItems.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ cartItems: [] }),
      getCartTotal: () => {
        return get().cartItems.reduce((total, item) => total + (item.bestPrice * item.quantity), 0);
      },
      getCartItemCount: () => {
        return get().cartItems.reduce((count, item) => count + item.quantity, 0);
      },
      getTotalSavings: () => {
        return get().cartItems.reduce((total, item) => {
          const savings = item.originalPrice - item.bestPrice;
          return total + (savings * item.quantity);
        }, 0);
      },
    }),
    {
      name: 'adk-store',
      partialize: (state) => ({
        theme: state.theme,
        preferredCreditCard: state.preferredCreditCard,
        selectedCreditCards: state.selectedCreditCards,
        cartItems: state.cartItems,
      }),
    }
  )
);