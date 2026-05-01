import type { CartItem } from "@/types";

/** Clave estable para comparar dos selecciones de variantes. */
export function variantSelectionKey(
  selected?: Record<string, string> | null
): string {
  if (!selected || Object.keys(selected).length === 0) return "_";
  const entries = Object.entries(selected).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return JSON.stringify(entries);
}

export function makeCartLineId(
  productId: string,
  selected?: Record<string, string> | null
): string {
  return `${productId}::${variantSelectionKey(selected)}`;
}

/** Migra ítems persistidos sin `lineId` (versiones antiguas del carrito). */
export function ensureCartLineIds(items: CartItem[]): CartItem[] {
  return items.map((item) =>
    item.lineId
      ? item
      : {
          ...item,
          lineId: makeCartLineId(item.productId, item.selectedVariants),
        }
  );
}
