import type { Product, ProductPurchaseOption } from "@/types";
import { variantSelectionKey } from "@/lib/cart-line-id";

/** Normaliza el array guardado en Firestore. */
export function normalizePurchaseOptionsFromFirestore(
  data: unknown
): ProductPurchaseOption[] | undefined {
  if (!Array.isArray(data)) return undefined;
  const out: ProductPurchaseOption[] = [];
  for (const row of data) {
    if (!row || typeof row !== "object") continue;
    const name = String((row as { name?: unknown }).name ?? "").trim();
    const valuesRaw = (row as { values?: unknown }).values;
    const values = Array.isArray(valuesRaw)
      ? [...new Set(valuesRaw.map((v) => String(v).trim()).filter(Boolean))]
      : [];
    if (!name || values.length === 0) continue;
    out.push({ name, values });
  }
  return out.length > 0 ? out : undefined;
}

export function productRequiresPurchaseSelection(product: Product): boolean {
  return (product.purchaseOptions?.length ?? 0) > 0;
}

export function isCompletePurchaseSelection(
  product: Product,
  selected: Record<string, string>
): boolean {
  const opts = product.purchaseOptions ?? [];
  return opts.every((o) => {
    const v = selected[o.name]?.trim();
    return v != null && v.length > 0 && o.values.includes(v);
  });
}

/** Convierte filas del admin (nombre + texto de valores) al modelo de producto. */
export function parseAdminPurchaseOptionRows(
  rows: { name: string; valuesText: string }[]
): ProductPurchaseOption[] | undefined {
  const list = rows
    .map((r) => {
      const name = r.name.trim();
      const values = r.valuesText
        .split(/[\n,;]+/)
        .map((v) => v.trim())
        .filter(Boolean);
      return { name, values: [...new Set(values)] };
    })
    .filter((r) => r.name && r.values.length > 0);
  return list.length > 0 ? list : undefined;
}

/** Todas las combinaciones posibles de opciones de compra (producto cartesiano). */
export function allPurchaseSelections(
  options: ProductPurchaseOption[]
): Record<string, string>[] {
  if (options.length === 0) return [];
  const [first, ...rest] = options;
  const tail = allPurchaseSelections(rest);
  const out: Record<string, string>[] = [];
  for (const v of first.values) {
    if (tail.length === 0) {
      out.push({ [first.name]: v });
    } else {
      for (const row of tail) {
        out.push({ [first.name]: v, ...row });
      }
    }
  }
  return out;
}

export function productUsesVariantStock(product: Product): boolean {
  const opts = product.purchaseOptions ?? [];
  const vs = product.variantStock;
  if (opts.length === 0 || !vs || typeof vs !== "object") return false;
  return Object.keys(vs).length > 0;
}

/** Unidades disponibles para la combinación elegida (o stock global si no hay inventario por variante). */
export function getAvailableStockForSelection(
  product: Product,
  selection: Record<string, string>
): number {
  if (productUsesVariantStock(product)) {
    const key = variantSelectionKey(selection);
    const n = product.variantStock?.[key];
    return typeof n === "number" && !Number.isNaN(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  return Math.max(0, Math.floor(product.stock ?? 0));
}

/** Suma de unidades en variantes; si no hay variantStock, usa `stock`. */
export function totalSellableStock(product: Product): number {
  if (productUsesVariantStock(product)) {
    return Object.values(product.variantStock ?? {}).reduce(
      (a, v) => a + Math.max(0, Math.floor(Number(v)) || 0),
      0
    );
  }
  return Math.max(0, Math.floor(product.stock ?? 0));
}

/** Hay al menos una unidad vendible y el producto sigue marcado en catálogo como disponible. */
export function productHasAnyStock(product: Product): boolean {
  if (!product.inStock) return false;
  return totalSellableStock(product) > 0;
}

/** Texto legible de una selección para mensajes de error. */
export function describeSelection(
  selection: Record<string, string> | undefined
): string {
  if (!selection || Object.keys(selection).length === 0) return "";
  return Object.entries(selection)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

/**
 * Para un valor concreto de un desplegable: ¿existe alguna combinación completa con stock > 0
 * que sea compatible con `partial` al fijar `optionName` = `value`?
 */
export function optionValueHasAvailability(
  product: Product,
  partial: Record<string, string>,
  optionName: string,
  value: string
): boolean {
  if (!productUsesVariantStock(product)) return true;
  const merged = { ...partial, [optionName]: value };
  const opts = product.purchaseOptions ?? [];
  const unfilled = opts.filter((o) => !(merged[o.name] ?? "").trim());
  if (unfilled.length === 0) {
    return getAvailableStockForSelection(product, merged) > 0;
  }
  const subCombos = allPurchaseSelections(unfilled);
  for (const combo of subCombos) {
    const full = { ...merged, ...combo };
    if (
      isCompletePurchaseSelection(product, full) &&
      getAvailableStockForSelection(product, full) > 0
    ) {
      return true;
    }
  }
  return false;
}

/** Normaliza mapa desde Firestore (números o strings). */
export function normalizeVariantStockFromFirestore(
  data: unknown
): Record<string, number> | undefined {
  if (!data || typeof data !== "object" || Array.isArray(data)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isNaN(n) && k.trim()) out[k] = Math.max(0, Math.floor(n));
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
