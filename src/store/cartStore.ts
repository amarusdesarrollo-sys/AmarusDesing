import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Product, ShippingZoneConfig } from "@/types";

export interface ShippingConfig {
  freeShippingThreshold: number;
  standardShippingCost: number;
  expressShippingCost: number;
  zones?: {
    spainPeninsula: ShippingZoneConfig;
    canarias: ShippingZoneConfig;
    europe: ShippingZoneConfig;
    world: ShippingZoneConfig;
  };
}

interface CartStore {
  items: CartItem[];
  shippingConfig: ShippingConfig | null;
  setShippingConfig: (config: ShippingConfig | null) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  /** Calcula el envío sin zona (fallback antiguo) */
  getShippingLegacy: () => number;
  /** Calcula el envío según zona y subtotal */
  getShippingForZone: (zoneKey: keyof NonNullable<ShippingConfig["zones"]>) => number;
  /** Envío actual (usado en checkout): por defecto legacy hasta que pasemos zona explícita */
  getShipping: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      shippingConfig: null,

      setShippingConfig: (config) => set({ shippingConfig: config }),

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.productId === product.id
          );

          if (existingItem) {
            // Si ya existe, actualizar cantidad
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          // Si no existe, agregar nuevo item
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                product,
                quantity,
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      getShippingLegacy: () => {
        const config = get().shippingConfig;
        if (!config) return 0;
        const subtotal = get().getSubtotal();
        const threshold = config.freeShippingThreshold ?? 0;
        const cost = config.standardShippingCost ?? 0;
        if (threshold > 0 && subtotal >= threshold) return 0;
        return cost;
      },

      getShippingForZone: (zoneKey) => {
        const config = get().shippingConfig;
        if (!config?.zones) return get().getShippingLegacy();
        const zone = config.zones[zoneKey];
        if (!zone) return get().getShippingLegacy();
        // Para Amarus: usamos solo un coste fijo por zona. 0 = envío gratuito.
        return zone.standardShippingCost;
      },

      // Por compatibilidad: mientras no indiquemos zona, usamos el cálculo antiguo
      getShipping: () => {
        return get().getShippingLegacy();
      },

      getTotal: () => {
        return get().getSubtotal() + get().getShipping();
      },
    }),
    {
      name: "amarus-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
