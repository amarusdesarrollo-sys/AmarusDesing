import { NextRequest, NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary-server";
import { requireAdmin } from "@/lib/firebase-admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_FOLDERS = ["categories", "products", "team", "blog"];

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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "El archivo no puede superar 5 MB" },
        { status: 400 }
      );
    }

    const mime = (file.type || "").toLowerCase();
    if (!ALLOWED_TYPES.includes(mime) && !mime.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "Solo se permiten imágenes (JPEG, PNG, WebP, GIF)" },
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
          resource_type: "image",
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
