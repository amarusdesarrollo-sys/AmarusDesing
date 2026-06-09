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
      | { categoryId?: string }
      | null;
    const categoryId = body?.categoryId?.toString().trim();
    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "Falta categoryId" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdminApp();
    const db = getFirestore(app);

    const categoryRef = db.collection("categories").doc(categoryId);
    const snap = await categoryRef.get();
    if (!snap.exists) {
      return NextResponse.json(
        { success: false, message: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    const data = snap.data() as any;
    const paths = toStoragePaths([data?.image, data?.imageUrl]);
    const storage = await removeStoragePaths(paths);

    await categoryRef.delete();

    return NextResponse.json({
      success: true,
      categoryId,
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

