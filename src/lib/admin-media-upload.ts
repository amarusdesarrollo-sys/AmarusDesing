import { getAuthHeaders } from "@/lib/auth-headers";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export type AdminUploadResult = {
  success: boolean;
  publicId: string;
  url: string;
  width?: number;
  height?: number;
  resourceType: "image" | "video";
  message?: string;
};

const IMAGE_SERVER_MAX = 5 * 1024 * 1024;
const VIDEO_SIGNED_MAX = 30 * 1024 * 1024;

/**
 * Sube imagen o vídeo al admin: imágenes vía API (servidor); vídeos vía URL firmada (evita límite Vercel).
 */
export async function uploadAdminMedia(
  file: File,
  folder: string
): Promise<AdminUploadResult> {
  const isVideo =
    file.type.startsWith("video/") ||
    /\.(mp4|mov|m4v|hevc|webm|avi|wmv|3gp|3g2|mts|m2ts)$/i.test(file.name);

  if (isVideo) {
    if (file.size > VIDEO_SIGNED_MAX) {
      throw new Error("El video no puede ser mayor a 30MB");
    }
    const headers = {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    };
    const signRes = await fetch("/api/storage/signed-upload", {
      method: "POST",
      headers,
      body: JSON.stringify({
        folder,
        fileName: file.name,
        contentType: file.type,
        isVideo: true,
        fileSize: file.size,
      }),
    });
    const signText = await signRes.text();
    const signData = JSON.parse(signText) as {
      path?: string;
      token?: string;
      publicId?: string;
      url?: string;
      message?: string;
    };
    if (!signRes.ok || !signData.path || !signData.token) {
      throw new Error(signData.message || "No se pudo preparar la subida del video");
    }
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.storage
      .from(
        process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || "images"
      )
      .uploadToSignedUrl(signData.path, signData.token, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
    if (error) {
      throw new Error(error.message || "Error al subir video a Supabase");
    }
    return {
      success: true,
      publicId: signData.publicId || signData.path,
      url: signData.url || "",
      resourceType: "video",
    };
  }

  if (file.size > IMAGE_SERVER_MAX) {
    throw new Error("La imagen no puede ser mayor a 5MB");
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await fetch("/api/upload-image", {
    method: "POST",
    headers: await getAuthHeaders(),
    body: formData,
  });
  const text = await res.text();
  const data = JSON.parse(text) as AdminUploadResult & { message?: string };
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Error al subir el archivo");
  }
  return data;
}
