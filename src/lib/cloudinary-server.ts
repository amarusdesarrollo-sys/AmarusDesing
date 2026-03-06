/**
 * Configuración del SDK de Cloudinary
 * ⚠️ SOLO USAR EN EL SERVIDOR (API Routes, Server Components, Server Actions)
 * NO importar en componentes del cliente
 *
 * Soporta dos formatos:
 * 1. Variables separadas: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * 2. CLOUDINARY_URL: cloudinary://api_key:api_secret@cloud_name
 *
 * La config se aplica en tiempo de ejecución (lazy) para garantizar que las env vars
 * estén disponibles en Vercel serverless.
 */

import { v2 as cloudinary } from "cloudinary";

let configApplied = false;

function getConfig() {
  // Preferir CLOUDINARY_URL (más fiable en serverless)
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
      return {
        cloud_name: match[3],
        api_key: match[1],
        api_secret: match[2],
      };
    }
  }
  return {
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };
}

function ensureConfig() {
  if (!configApplied) {
    const c = getConfig();
    if (c.cloud_name && c.api_key && c.api_secret) {
      cloudinary.config(c);
      configApplied = true;
    }
  }
}

/** Wrapper que garantiza config antes de usar cloudinary */
export function getCloudinary() {
  ensureConfig();
  return cloudinary;
}

export default new Proxy(cloudinary, {
  get(target, prop) {
    ensureConfig();
    return (target as any)[prop];
  },
});
