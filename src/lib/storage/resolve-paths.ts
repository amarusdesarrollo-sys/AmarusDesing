import { isCloudinaryUrl, isSupabaseStorageUrl, storagePathFromPublicUrl } from "@/lib/supabase/config";

/** Convierte publicId / URL legacy a rutas borrables en Supabase Storage. */
export function toStoragePaths(
  items: Array<string | null | undefined>
): string[] {
  const out: string[] = [];
  for (const item of items) {
    const s = item?.trim();
    if (!s) continue;
    if (isSupabaseStorageUrl(s)) {
      const p = storagePathFromPublicUrl(s);
      if (p) out.push(p);
      continue;
    }
    if (s.startsWith("http")) {
      if (isCloudinaryUrl(s)) continue;
      continue;
    }
    if (!s.includes(" ")) out.push(s);
  }
  return [...new Set(out)];
}
