import { create } from 'zustand';

// Definimos la estructura de un ítem en el carrito
export interface CartItem {
  id: string;      // ID del SKU
  name: string;
  price: number;
  quantity: number;
  stock: number;   // Stock máximo disponible
}

interface PosState {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  // Funciones para obtener datos calculados
  getTotal: () => number;
  getItemCount: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],

  addToCart: (product) => {
    const { cart } = get();
    const exists = cart.find((item) => item.id === product.id);

    if (exists) {
      // Si ya existe, sumamos 1 solo si hay stock
      if (exists.quantity < exists.stock) {
        set({
          cart: cart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        });
      }
    } else {
      // Si es nuevo, lo agregamos con cantidad 1
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
          // Validamos que no baje de 1 y no supere el stock real
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
}));
