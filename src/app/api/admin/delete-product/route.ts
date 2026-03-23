import { NextRequest, NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary-server";
import { requireAdmin } from "@/lib/firebase-admin";
import { getFirebaseAdminApp } from "@/lib/firebase-admin-server";
import { getFirestore } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const body = (await request.json().catch(() => null)) as
      | { productId?: string }
      | null;
    const productId = body?.productId?.toString().trim();
    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Falta productId" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdminApp();
    const db = getFirestore(app);

    const productRef = db.collection("products").doc(productId);
    const snap = await productRef.get();
    if (!snap.exists) {
      return NextResponse.json(
        { success: false, message: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const data = snap.data() as any;
    const images: Array<{ publicId?: string }> = Array.isArray(data?.images)
      ? data.images
      : [];
    const publicIds = images
      .map((i) => i?.publicId)
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0);

    const cloudinary = getCloudinary();

    const results = await Promise.allSettled(
      publicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId, { invalidate: true })
      )
    );

    const cloudinaryDeleted = results.filter(
      (r) => r.status === "fulfilled"
    ).length;
    const cloudinaryFailed = results.length - cloudinaryDeleted;

    await productRef.delete();

    return NextResponse.json({
      success: true,
      productId,
      cloudinary: {
        total: results.length,
        deleted: cloudinaryDeleted,
        failed: cloudinaryFailed,
      },
      firestore: { deleted: true },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error al eliminar definitivamente",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

