/**
 * Resolución de URLs de medios (Supabase Storage + compatibilidad Cloudinary legacy).
 * El nombre del archivo se mantiene por imports existentes en el proyecto.
 */

import {
  buildStoragePublicUrl,
  getSupabaseUrl,
  isCloudinaryUrl,
  isSupabaseConfigured,
  isSupabaseStorageUrl,
  storagePathFromPublicUrl,
} from "@/lib/supabase/config";

export { isCloudinaryUrl, isSupabaseStorageUrl };

const STORAGE_PREFIXES = [
  "categories/",
  "products/",
  "team/",
  "blog/",
  "content/",
] as const;

function isLikelyStoragePath(path: string): boolean {
  return STORAGE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function getCloudName(): string | undefined {
  let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName && typeof window === "undefined") {
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (cloudinaryUrl) {
      const match = cloudinaryUrl.match(/cloudinary:\/\/[^@]+@(.+)/);
      if (match) cloudName = match[1];
    }
  }
  return cloudName;
}

function cleanPublicIdPath(publicId: string): string {
  if (!publicId.includes("/")) return publicId;
  const parts = publicId.split("/");
  const cleanedParts: string[] = [];
  let lastPart = "";
  for (const part of parts) {
    if (part !== lastPart) {
      cleanedParts.push(part);
      lastPart = part;
    }
  }
  return cleanedParts.join("/");
}

/** URL Cloudinary legacy sin recursión. */
function buildLegacyCloudinaryUrl(
  publicId: string,
  transformation = "f_auto,q_auto"
): string {
  const cloudName = getCloudName();
  if (!cloudName || !publicId?.trim()) return "";
  const clean = cleanPublicIdPath(publicId.trim());
  const encoded = encodeURIComponent(clean).replace(/%2F/g, "/");
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${encoded}`;
}

/**
 * Resuelve la URL pública a mostrar.
 * Prioridad: `preferredUrl` → URL absoluta en `pathOrUrl` → Supabase → Cloudinary legacy.
 */
export function resolveMediaUrl(
  pathOrUrl: string,
  preferredUrl?: string
): string {
  const pref = preferredUrl?.trim();
  if (pref) return pref;

  const raw = pathOrUrl?.trim();
  if (!raw) return "";

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  if (getSupabaseUrl() && isLikelyStoragePath(raw)) {
    const supabaseUrl = buildStoragePublicUrl(raw);
    if (supabaseUrl) return supabaseUrl;
  }

  return buildLegacyCloudinaryUrl(raw) || raw;
}

export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number | "auto";
    format?: "auto" | "webp" | "avif" | "jpg" | "png";
    crop?: "fill" | "fit" | "scale" | "thumb" | "limit";
    gravity?: "auto" | "face" | "center";
    fetchFormat?: "auto";
  } = {}
): string {
  const direct = resolveMediaUrl(publicId);
  if (
    direct &&
    (isSupabaseStorageUrl(direct) || !getCloudName())
  ) {
    return direct;
  }

  const cleanPublicId = cleanPublicIdPath(publicId);
  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop = "fill",
    gravity = "auto",
  } = options;

  const cloudName = getCloudName();
  if (!cloudName) {
    console.warn("⚠️ Cloudinary no configurado. No se puede generar URL para:", publicId);
    return direct || "";
  }

  const transformations: string[] = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`c_${crop}`);
  if (gravity !== "auto") transformations.push(`g_${gravity}`);
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);

  const transformationString = transformations.join(",");
  const encodedPublicId = encodeURIComponent(cleanPublicId).replace(/%2F/g, "/");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}/${encodedPublicId}`;
}

export function getCloudinaryBaseUrl(publicId: string): string {
  const raw = publicId?.trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  if (getSupabaseUrl() && isLikelyStoragePath(raw)) {
    const supabaseUrl = buildStoragePublicUrl(raw);
    if (supabaseUrl) return supabaseUrl;
  }
  return buildLegacyCloudinaryUrl(raw) || raw;
}

export function getProductImageUrl(
  publicId: string,
  _size: "small" | "medium" | "large" | "thumbnail" = "medium",
  originalUrl?: string
): string {
  return resolveMediaUrl(publicId, originalUrl);
}

export function getCloudinarySrcSet(
  publicId: string,
  aspectRatio: string = "1:1"
): { srcSet: string; sizes: string } {
  const cloudName = getCloudName();
  if (!cloudName || isSupabaseConfigured()) {
    const url = resolveMediaUrl(publicId);
    return url ? { srcSet: `${url} 1x`, sizes: "100vw" } : { srcSet: "", sizes: "" };
  }

  const [widthRatio, heightRatio] = aspectRatio.split(":").map(Number);
  const ratio = widthRatio / heightRatio;

  const breakpoints = [
    { width: 400, height: Math.round(400 / ratio) },
    { width: 800, height: Math.round(800 / ratio) },
    { width: 1200, height: Math.round(1200 / ratio) },
    { width: 1600, height: Math.round(1600 / ratio) },
  ];

  const srcSet = breakpoints
    .map(
      ({ width, height }) =>
        `${getCloudinaryUrl(publicId, {
          width,
          height,
          crop: "fill",
          quality: "auto",
          format: "auto",
        })} ${width}w`
    )
    .join(", ");

  const sizes =
    "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw";

  return { srcSet, sizes };
}

export function extractPublicIdFromUrl(url: string): string | null {
  if (isSupabaseStorageUrl(url)) {
    return storagePathFromPublicUrl(url);
  }
  if (!isCloudinaryUrl(url)) return null;
  const match = url.match(/\/upload\/(?:[^/]+\/)*([^/]+)$/);
  return match ? match[1] : null;
}
