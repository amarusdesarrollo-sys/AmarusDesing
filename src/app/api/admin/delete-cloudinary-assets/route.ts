import { NextRequest, NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary-server";
import { requireAdmin } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const body = (await request.json().catch(() => null)) as
      | { publicIds?: string[] }
      | null;

    const publicIds = Array.isArray(body?.publicIds)
      ? body!.publicIds
          .map((v) => (typeof v === "string" ? v.trim() : ""))
          .filter(Boolean)
      : [];

    if (publicIds.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, total: 0 });
    }

    const cloudinary = getCloudinary();
    const results = await Promise.allSettled(
      publicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId, { invalidate: true })
      )
    );

    const deleted = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - deleted;

    return NextResponse.json({
      success: failed === 0,
      total: results.length,
      deleted,
      failed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error al borrar recursos de Cloudinary",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

