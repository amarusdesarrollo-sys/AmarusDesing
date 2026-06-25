import sharp from "sharp";
import type { StorageFolder } from "@/lib/storage/upload-path";

export type CompressedImage = {
  buffer: Buffer;
  contentType: string;
  extension: string;
  width: number;
  height: number;
  /** true si se subió el original sin comprimir (p. ej. GIF animado). */
  passthrough: boolean;
};

const PROFILES: Record<
  StorageFolder,
  { maxWidth: number; maxHeight: number; quality: number }
> = {
  /** Heroes de home / categorías destacadas */
  categories: { maxWidth: 1920, maxHeight: 1080, quality: 82 },
  content: { maxWidth: 1920, maxHeight: 1080, quality: 82 },
  products: { maxWidth: 1400, maxHeight: 1800, quality: 84 },
  team: { maxWidth: 800, maxHeight: 800, quality: 85 },
  blog: { maxWidth: 1200, maxHeight: 800, quality: 82 },
};

function isAnimatedGif(buffer: Buffer): boolean {
  if (buffer.length < 6) return false;
  const header = buffer.subarray(0, 6).toString("ascii");
  if (header !== "GIF87a" && header !== "GIF89a") return false;
  return buffer.includes(Buffer.from("NETSCAPE2.0"));
}

/**
 * Redimensiona y comprime imágenes para web antes de subir a Storage.
 * Convierte HEIC/JPEG/PNG grandes a WebP (o JPEG si WebP falla).
 */
export async function compressImageForWeb(
  input: Buffer,
  folder: StorageFolder
): Promise<CompressedImage> {
  const profile = PROFILES[folder];

  if (isAnimatedGif(input)) {
    const meta = await sharp(input, { animated: true }).metadata();
    return {
      buffer: input,
      contentType: "image/gif",
      extension: "gif",
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      passthrough: true,
    };
  }

  const pipeline = sharp(input, { failOn: "none" })
    .rotate()
    .resize({
      width: profile.maxWidth,
      height: profile.maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });

  try {
    const webpBuffer = await pipeline
      .webp({ quality: profile.quality, effort: 4 })
      .toBuffer();
    const meta = await sharp(webpBuffer).metadata();
    return {
      buffer: webpBuffer,
      contentType: "image/webp",
      extension: "webp",
      width: meta.width ?? profile.maxWidth,
      height: meta.height ?? profile.maxHeight,
      passthrough: false,
    };
  } catch {
    const jpegBuffer = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({
        width: profile.maxWidth,
        height: profile.maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: profile.quality, mozjpeg: true })
      .toBuffer();
    const meta = await sharp(jpegBuffer).metadata();
    return {
      buffer: jpegBuffer,
      contentType: "image/jpeg",
      extension: "jpg",
      width: meta.width ?? profile.maxWidth,
      height: meta.height ?? profile.maxHeight,
      passthrough: false,
    };
  }
}
