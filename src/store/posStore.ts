import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface PosState {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (product) => {
        const { cart } = get();
        const exists = cart.find((item) => item.id === product.id);

        if (exists) {
          if (exists.quantity < exists.stock) {
            set({
              cart: cart.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
              ),
            });
          }
        } else {
          set({
            cart: [
              ...cart,
              {
                id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: 1,
                stock: Number(product.stock),
              },
            ],
          });
        }
      },

      removeFromCart: (id) => {
        set({ cart: get().cart.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, delta) => {
        const { cart } = get();
        set({
          cart: cart.map((item) => {
            if (item.id === id) {
              const newQty = item.quantity + delta;
              if (newQty > 0 && newQty <= item.stock) {
                return { ...item, quantity: newQty };
              }
            }
            return item;
          }),
        });
      },

      clearCart: () => set({ cart: [] }),

      getTotal: () => {
        return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().cart.reduce((sum, item) => sum + item.quantity, 0);
      }
    }),
    {
      name: 'pos-cart-storage', // Nombre único en LocalStorage
      storage: createJSONStorage(() => localStorage), // Usamos LocalStorage
      skipHydration: true, // Evita errores de hidratación en Next.js (manejado en UI)
    }
  )
);

