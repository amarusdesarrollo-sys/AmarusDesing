import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin";
import { createSignedUploadForFile } from "@/lib/storage/server";
import { isAllowedStorageFolder } from "@/lib/storage/upload-path";

const MAX_VIDEO_SIZE = 30 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const body = (await request.json()) as {
      folder?: string;
      fileName?: string;
      contentType?: string;
      isVideo?: boolean;
      fileSize?: number;
    };

    const folder = body.folder?.trim().toLowerCase() || "products";
    if (!isAllowedStorageFolder(folder)) {
      return NextResponse.json(
        { success: false, message: "Carpeta no permitida" },
        { status: 400 }
      );
    }
    if (!body.isVideo) {
      return NextResponse.json(
        { success: false, message: "Solo vídeos usan subida firmada" },
        { status: 400 }
      );
    }
    if ((body.fileSize ?? 0) > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { success: false, message: "El video no puede superar 30MB" },
        { status: 400 }
      );
    }

    const pseudoFile = {
      name: body.fileName || "video.mp4",
      type: body.contentType || "video/mp4",
    } as File;

    const signed = await createSignedUploadForFile({
      folder,
      file: pseudoFile,
      isVideo: true,
    });

    return NextResponse.json({
      success: true,
      path: signed.path,
      token: signed.token,
      publicId: signed.publicId,
      url: signed.url,
      resourceType: signed.resourceType,
    });
  } catch (error) {
    console.error("signed-upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Error al firmar subida",
      },
      { status: 500 }
    );
  }
}
