import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase/admin-server";
import { buildStoragePublicUrl } from "@/lib/supabase/config";
import {
  buildStoragePath,
  isAllowedStorageFolder,
  type StorageFolder,
} from "@/lib/storage/upload-path";

export type UploadResult = {
  success: true;
  /** Ruta en el bucket (se guarda en Firestore como `publicId` / `image` / `imagePublicId`). */
  publicId: string;
  storagePath: string;
  url: string;
  width?: number;
  height?: number;
  resourceType: "image" | "video";
  format?: string;
};

export async function uploadBufferToStorage(input: {
  folder: StorageFolder;
  buffer: Buffer;
  contentType: string;
  originalName: string;
  isVideo: boolean;
}): Promise<UploadResult> {
  const pseudoFile = {
    name: input.originalName,
    type: input.contentType,
  } as File;
  const storagePath = buildStoragePath(input.folder, pseudoFile, input.isVideo);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, input.buffer, {
      contentType: input.contentType || undefined,
      upsert: false,
    });
  if (error) {
    throw new Error(error.message || "Error al subir a Supabase Storage");
  }
  const url = buildStoragePublicUrl(storagePath);
  return {
    success: true,
    publicId: storagePath,
    storagePath,
    url,
    resourceType: input.isVideo ? "video" : "image",
    format: storagePath.split(".").pop(),
  };
}

export async function createSignedUploadForFile(input: {
  folder: string;
  file: File;
  isVideo: boolean;
}): Promise<{
  path: string;
  token: string;
  publicId: string;
  url: string;
  resourceType: "image" | "video";
}> {
  const folder = input.folder.trim().toLowerCase();
  if (!isAllowedStorageFolder(folder)) {
    throw new Error("Carpeta no permitida");
  }
  const storagePath = buildStoragePath(folder, input.file, input.isVideo);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(storagePath);
  if (error || !data?.token) {
    throw new Error(error?.message || "No se pudo crear URL de subida firmada");
  }
  return {
    path: data.path,
    token: data.token,
    publicId: storagePath,
    url: buildStoragePublicUrl(storagePath),
    resourceType: input.isVideo ? "video" : "image",
  };
}

export async function removeStoragePaths(paths: string[]): Promise<{
  removed: number;
  failed: number;
}> {
  const unique = [
    ...new Set(
      paths
        .map((p) => p?.trim())
        .filter((p): p is string => Boolean(p) && !p.startsWith("http"))
    ),
  ];
  if (unique.length === 0) return { removed: 0, failed: 0 };
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).remove(unique);
  if (error) {
    console.error("removeStoragePaths:", error);
    return { removed: 0, failed: unique.length };
  }
  const removed = data?.length ?? unique.length;
  return { removed, failed: Math.max(0, unique.length - removed) };
}
