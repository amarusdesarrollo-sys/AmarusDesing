import { NextRequest, NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary-server";
import { requireAdmin } from "@/lib/firebase-admin";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"];
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/webm",
  "video/3gpp",
  "video/3gpp2",
  "video/x-m4v",
  "video/mp2t",
];
const ALLOWED_VIDEO_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
  ".avi",
  ".wmv",
  ".3gp",
  ".3g2",
  ".mts",
  ".m2ts",
];
const ALLOWED_FOLDERS = ["categories", "products", "team", "blog", "content"];

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;
    const cloudinary = getCloudinary();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderRaw = formData.get("folder");
    const folder = typeof folderRaw === "string" && folderRaw.trim()
      ? folderRaw.trim().toLowerCase()
      : "categories";

    if (!ALLOWED_FOLDERS.includes(folder)) {
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

    const mime = (file.type || "").toLowerCase();
    const filename = (file.name || "").toLowerCase();
    const hasAllowedVideoExtension = ALLOWED_VIDEO_EXTENSIONS.some((ext) =>
      filename.endsWith(ext)
    );
    const isVideoMime = ALLOWED_VIDEO_TYPES.includes(mime) || mime.startsWith("video/");
    const isPotentialVideo = isVideoMime || hasAllowedVideoExtension;
    const maxSize = isPotentialVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: isPotentialVideo
            ? "El video no puede superar 50 MB"
            : "La imagen no puede superar 5 MB",
        },
        { status: 400 }
      );
    }

    const hasAllowedImageExtension = ALLOWED_EXTENSIONS.some((ext) =>
      filename.endsWith(ext)
    );
    const isImageMime = ALLOWED_TYPES.includes(mime) || mime.startsWith("image/");
    const isImage = isImageMime || hasAllowedImageExtension;
    const isVideo = isVideoMime || hasAllowedVideoExtension;
    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Formato no permitido. Usa imágenes (JPEG, PNG, WebP, GIF, HEIC, HEIF) o videos (MP4, MOV, M4V, WEBM, AVI, WMV).",
        },
        { status: 400 }
      );
    }

    // Convertir File a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Limpiar nombre de archivo (quitar espacios y caracteres especiales)
    const cleanFileName = file.name
      .replace(/\.[^/.]+$/, "") // Quitar extensión
      .replace(/[^a-zA-Z0-9-_]/g, "-") // Reemplazar caracteres especiales con guiones
      .toLowerCase()
      .substring(0, 50); // Limitar longitud

    // Subir a Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: isVideo ? "video" : "image",
          public_id: `${Date.now()}-${cleanFileName}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const uploadResult = result as any;

    console.log("✅ Imagen subida a Cloudinary:", {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
    });

    return NextResponse.json(
      {
        success: true,
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        resourceType: uploadResult.resource_type || (isVideo ? "video" : "image"),
        format: uploadResult.format,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
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
