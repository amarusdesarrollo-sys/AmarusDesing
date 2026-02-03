/**
 * Funciones de utilidad para generar URLs de Cloudinary
 * Estas funciones NO requieren el SDK de Cloudinary y pueden ejecutarse en el cliente
 */

// El SDK de Cloudinary solo se usa en el servidor (API routes)
// Para usarlo, importa desde '@/lib/cloudinary-server'

/**
 * Genera una URL optimizada de Cloudinary con transformaciones
 * @param publicId - El public ID de la imagen en Cloudinary
 * @param options - Opciones de transformación
 * @returns URL optimizada de Cloudinary
 */
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
  // Limpiar publicId: eliminar folders duplicados (ej: "categories/categories/..." -> "categories/...")
  let cleanPublicId = publicId;
  if (cleanPublicId.includes("/")) {
    const parts = cleanPublicId.split("/");
    // Si hay folders duplicados consecutivos, eliminar duplicados
    const cleanedParts: string[] = [];
    let lastPart = "";
    for (const part of parts) {
      if (part !== lastPart) {
        cleanedParts.push(part);
        lastPart = part;
      }
    }
    cleanPublicId = cleanedParts.join("/");
  }
  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop = "fill",
    gravity = "auto",
    fetchFormat = "auto",
  } = options;

  // Obtener cloud name de variable separada o de CLOUDINARY_URL
  let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  // Si no está en variable separada, intentar extraer de CLOUDINARY_URL
  if (!cloudName && typeof window === "undefined") {
    // Solo en servidor podemos leer CLOUDINARY_URL (no tiene NEXT_PUBLIC_)
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (cloudinaryUrl) {
      const match = cloudinaryUrl.match(/cloudinary:\/\/[^@]+@(.+)/);
      if (match) {
        cloudName = match[1];
      }
    }
  }

  if (!cloudName) {
    // Si no está configurado, retornar null o un placeholder
    // No generar URL inválida que cause error 400
    console.warn("⚠️ Cloudinary no configurado. No se puede generar URL para:", publicId);
    return ""; // Retornar string vacío, el componente manejará el fallback
  }

  // Construir la URL de transformación
  const transformations: string[] = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`c_${crop}`);
  if (gravity !== "auto") transformations.push(`g_${gravity}`);
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);
  if (fetchFormat === "auto") transformations.push("fl_auto");

  const transformationString = transformations.join(",");

  // Codificar publicId para URLs (espacios → %20, preservar / para carpetas)
  const encodedPublicId = encodeURIComponent(cleanPublicId).replace(/%2F/g, "/");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}/${encodedPublicId}`;
}

/**
 * URL de Cloudinary con transformaciones mínimas - más compatible que la versión completa
 * f_auto = formato automático, q_auto = calidad automática
 */
export function getCloudinaryBaseUrl(publicId: string): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return "";

  let cleanPublicId = publicId;
  if (cleanPublicId.includes("/")) {
    const parts = cleanPublicId.split("/");
    const cleanedParts: string[] = [];
    let lastPart = "";
    for (const part of parts) {
      if (part !== lastPart) {
        cleanedParts.push(part);
        lastPart = part;
      }
    }
    cleanPublicId = cleanedParts.join("/");
  }
  const encoded = encodeURIComponent(cleanPublicId).replace(/%2F/g, "/");
  // f_auto,q_auto son transformaciones mínimas que mejoran compatibilidad
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${encoded}`;
}

/**
 * Genera una URL optimizada para imágenes de productos
 * @param publicId - El public ID de la imagen (o URL completa si no está configurado Cloudinary)
 * @param size - Tamaño de la imagen (small, medium, large)
 * @param originalUrl - URL original de la imagen (fallback si Cloudinary no está configurado)
 * @returns URL optimizada o URL original
 */
export function getProductImageUrl(
  publicId: string,
  size: "small" | "medium" | "large" | "thumbnail" = "medium",
  originalUrl?: string
): string {
  // Si es URL completa, devolverla tal cual
  if (publicId.startsWith("http://") || publicId.startsWith("https://")) {
    return publicId;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    if (originalUrl) return originalUrl;
    return "";
  }

  // Usar URL base con f_auto,q_auto - misma que funciona en el hero
  // Las transformaciones complejas (w_, h_, c_fill) fallaban con algunas imágenes
  return getCloudinaryBaseUrl(publicId);
}

/**
 * Genera srcSet para imágenes responsive de Cloudinary
 * @param publicId - El public ID de la imagen
 * @param aspectRatio - Ratio de aspecto (ej: "1:1", "16:9")
 * @returns Objeto con srcSet y sizes
 */
export function getCloudinarySrcSet(
  publicId: string,
  aspectRatio: string = "1:1"
): { srcSet: string; sizes: string } {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    return { srcSet: "", sizes: "" };
  }

  // Calcular dimensiones basadas en aspect ratio
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

/**
 * Verifica si una URL es de Cloudinary
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes("cloudinary.com") || url.includes("res.cloudinary.com");
}

/**
 * Extrae el publicId de una URL de Cloudinary
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null;

  const match = url.match(/\/upload\/(?:[^\/]+\/)*([^\/]+)$/);
  return match ? match[1] : null;
}
