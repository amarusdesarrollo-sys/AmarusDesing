/**
 * Configuración del SDK de Cloudinary
 * ⚠️ SOLO USAR EN EL SERVIDOR (API Routes, Server Components, Server Actions)
 * NO importar en componentes del cliente
 * 
 * Soporta dos formatos:
 * 1. Variables separadas: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * 2. CLOUDINARY_URL: cloudinary://api_key:api_secret@cloud_name
 */

import { v2 as cloudinary } from "cloudinary";

// Función para parsear CLOUDINARY_URL si está disponible
function parseCloudinaryUrl(): {
  cloud_name?: string;
  api_key?: string;
  api_secret?: string;
} {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  
  if (!cloudinaryUrl) {
    return {};
  }

  // Formato: cloudinary://api_key:api_secret@cloud_name
  const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  
  if (match) {
    return {
      api_key: match[1],
      api_secret: match[2],
      cloud_name: match[3],
    };
  }

  return {};
}

// Obtener configuración de variables separadas o de CLOUDINARY_URL
const urlConfig = parseCloudinaryUrl();

cloudinary.config({
  cloud_name:
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || urlConfig.cloud_name,
  api_key: process.env.CLOUDINARY_API_KEY || urlConfig.api_key,
  api_secret: process.env.CLOUDINARY_API_SECRET || urlConfig.api_secret,
});

export default cloudinary;
