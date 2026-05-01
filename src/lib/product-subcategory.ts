/** Normaliza slug de categoría/subcategoría para comparar sin errores de mayúsculas o espacios. */
export function normalizeCategorySlug(s: string | undefined | null): string {
  return (s ?? "").trim().toLowerCase();
}

/**
 * Devuelve la subcategoría permitida que coincide con lo guardado (por slug exacto o normalizado).
 */
export function matchSubcategoryToAllowedList(
  storedSub: string | undefined | null,
  allowed: { slug: string }[]
): { slug: string } | null {
  const raw = (storedSub ?? "").trim();
  if (!raw) return null;
  const n = normalizeCategorySlug(raw);
  return allowed.find((s) => normalizeCategorySlug(s.slug) === n) ?? null;
}
