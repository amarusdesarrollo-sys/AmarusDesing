import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin";
import { uploadBufferToStorage } from "@/lib/storage/server";
import {
  isAllowedStorageFolder,
  sanitizeFileStem,
} from "@/lib/storage/upload-path";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".heif",
];

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderRaw = formData.get("folder");
    const folder = typeof folderRaw === "string" ? folderRaw.trim().toLowerCase() : "categories";

    if (!isAllowedStorageFolder(folder)) {
      return NextResponse.json(
        { success: false, message: "Carpeta no permitida" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    const mime = (file.type || "").toLowerCase().split(";")[0].trim();
    const filename = (file.name || "").toLowerCase();
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) =>
      filename.endsWith(ext)
    );
    const isImageMime = mime.startsWith("image/") || ALLOWED_TYPES.includes(mime);
    if (!isImageMime && !hasAllowedExtension) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Formato no permitido. Usa imágenes (JPEG, PNG, WebP, GIF, HEIC, HEIF). Para vídeos usa el flujo de productos.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, message: "La imagen no puede superar 5 MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const cleanFileName = sanitizeFileStem(file.name || "image");

    const result = await uploadBufferToStorage({
      folder,
      buffer,
      contentType: mime || "image/jpeg",
      originalName: `${cleanFileName}.jpg`,
      isVideo: false,
    });

    return NextResponse.json(
      {
        success: true,
        publicId: result.publicId,
        storagePath: result.storagePath,
        url: result.url,
        width: result.width,
        height: result.height,
        resourceType: "image",
        format: result.format,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading to Supabase:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al subir la imagen",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
