import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin";
import { removeStoragePaths } from "@/lib/storage/server";
import { toStoragePaths } from "@/lib/storage/resolve-paths";
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
    const images: Array<{ publicId?: string; url?: string }> = Array.isArray(
      data?.images
    )
      ? data.images
      : [];
    const paths = toStoragePaths(
      images.flatMap((i) => [i?.publicId, i?.url])
    );
    const storage = await removeStoragePaths(paths);

    await productRef.delete();

    return NextResponse.json({
      success: true,
      productId,
      storage: {
        total: paths.length,
        deleted: storage.removed,
        failed: storage.failed,
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

