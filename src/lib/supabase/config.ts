/** Bucket público de medios (imágenes y vídeos). */
export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || "images";

export function getSupabaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url ? url.replace(/\/$/, "") : null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
}

export function isSupabaseServerConfigured(): boolean {
  return Boolean(isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/** URL pública de un objeto en Storage (funciona en cliente y servidor). */
export function buildStoragePublicUrl(storagePath: string): string {
  const base = getSupabaseUrl();
  if (!base || !storagePath?.trim()) return "";
  const encoded = storagePath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${encoded}`;
}

export function isCloudinaryUrl(url: string): boolean {
  return url.includes("cloudinary.com") || url.includes("res.cloudinary.com");
}

export function isSupabaseStorageUrl(url: string): boolean {
  if (!url) return false;
  const base = getSupabaseUrl();
  if (base && url.startsWith(base) && url.includes("/storage/v1/object/public/")) {
    return true;
  }
  return url.includes(".supabase.co/storage/v1/object/public/");
}

/** Extrae la ruta dentro del bucket desde una URL pública de Supabase. */
export function storagePathFromPublicUrl(url: string): string | null {
  if (!isSupabaseStorageUrl(url)) return null;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const raw = url.slice(idx + marker.length).split("?")[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
