import { NextRequest, NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary-server";
import { requireAdmin } from "@/lib/firebase-admin";

const ALLOWED_FOLDERS = ["categories", "products", "team", "blog", "content"];
const ALLOWED_RESOURCE_TYPES = ["image", "video"] as const;

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const body = await request.json().catch(() => ({}));
    const folderRaw = typeof body?.folder === "string" ? body.folder : "products";
    const resourceTypeRaw =
      typeof body?.resourceType === "string" ? body.resourceType : "image";

    const folder = folderRaw.trim().toLowerCase();
    const resourceType = resourceTypeRaw.trim().toLowerCase();

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { success: false, message: "Carpeta no permitida" },
        { status: 400 }
      );
    }
    if (!ALLOWED_RESOURCE_TYPES.includes(resourceType as "image" | "video")) {
      return NextResponse.json(
        { success: false, message: "Tipo de recurso no permitido" },
        { status: 400 }
      );
    }

    const cloudinary = getCloudinary();
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, message: "Cloudinary no configurado en el servidor" },
        { status: 500 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    // Cloudinary firma parámetros del upload payload.
    // resource_type va en el endpoint (/image/upload o /video/upload), no en el string firmado.
    const paramsToSign = {
      folder,
      timestamp,
    };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return NextResponse.json({
      success: true,
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      resourceType: resourceType,
    });
  } catch (error) {
    console.error("Error creating upload signature:", error);
    return NextResponse.json(
      {
        success: false,
        message: "No se pudo generar la firma de subida",
      },
      { status: 500 }
    );
  }
}

