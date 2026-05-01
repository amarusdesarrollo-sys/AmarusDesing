import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Product, ShippingZoneConfig } from "@/types";
import {
  makeCartLineId,
  ensureCartLineIds,
  variantSelectionKey,
} from "@/lib/cart-line-id";

function sameVariantSelection(
  a?: Record<string, string> | null,
  b?: Record<string, string> | null
): boolean {
  return variantSelectionKey(a) === variantSelectionKey(b);
}

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
  addItem: (
    product: Product,
    quantity?: number,
    selectedVariants?: Record<string, string>
  ) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
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

      addItem: (product, quantity = 1, selectedVariants) => {
        set((state) => {
          const items = ensureCartLineIds(state.items);
          const lineId = makeCartLineId(product.id, selectedVariants);
          const existingItem = items.find(
            (item) =>
              item.productId === product.id &&
              sameVariantSelection(item.selectedVariants, selectedVariants)
          );

          if (existingItem) {
            return {
              items: items.map((item) =>
                item.lineId === existingItem.lineId
                  ? { ...item, product, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            items: [
              ...items,
              {
                lineId,
                productId: product.id,
                product,
                quantity,
                ...(selectedVariants &&
                Object.keys(selectedVariants).length > 0
                  ? { selectedVariants }
                  : {}),
              },
            ],
          };
        });
      },

      removeItem: (lineId) => {
        set((state) => ({
          items: ensureCartLineIds(state.items).filter(
            (item) => item.lineId !== lineId
          ),
        }));
      },

      updateQuantity: (lineId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineId);
          return;
        }

        set((state) => ({
          items: ensureCartLineIds(state.items).map((item) =>
            item.lineId === lineId ? { ...item, quantity } : item
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
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<CartStore> | undefined;
        const rawItems = (p?.items ?? []) as CartItem[];
        const items = ensureCartLineIds(rawItems);
        return { ...currentState, ...p, items };
      },
    }
  )
);
