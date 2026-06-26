import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin";
import { deleteProductWithAssets } from "@/lib/admin/delete-product-server";
import { revalidateProductCatalog } from "@/lib/revalidate-catalog";
import { getFirebaseAdminApp } from "@/lib/firebase-admin-server";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

type BulkAction = "deactivate" | "activate" | "delete";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const body = (await request.json().catch(() => null)) as
      | { action?: BulkAction; productIds?: string[] }
      | null;

    const action = body?.action;
    const productIds = (body?.productIds ?? [])
      .map((id) => id?.toString().trim())
      .filter(Boolean);

    if (!action || !["deactivate", "activate", "delete"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Acción no válida" },
        { status: 400 }
      );
    }

    if (productIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "No hay productos seleccionados" },
        { status: 400 }
      );
    }

    if (action === "delete") {
      const results = await Promise.all(
        productIds.map((id) => deleteProductWithAssets(id))
      );
      const deleted = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);
      const storageDeleted = deleted.reduce(
        (sum, r) => sum + (r.storage?.deleted ?? 0),
        0
      );

      revalidateProductCatalog();

      return NextResponse.json({
        success: failed.length === 0,
        action,
        processed: deleted.length,
        failed: failed.length,
        results,
        storage: { filesRemoved: storageDeleted },
        message:
          failed.length === 0
            ? `${deleted.length} producto(s) eliminado(s) con sus imágenes y vídeos en Storage.`
            : `${deleted.length} eliminado(s), ${failed.length} fallido(s).`,
      });
    }

    const app = getFirebaseAdminApp();
    const db = getFirestore(app);
    const batch = db.batch();
    const now = Timestamp.now();
    const inStock = action === "activate";

    for (const id of productIds) {
      batch.update(db.collection("products").doc(id), {
        inStock,
        updatedAt: now,
      });
    }
    await batch.commit();

    revalidateProductCatalog();

    return NextResponse.json({
      success: true,
      action,
      processed: productIds.length,
      message:
        action === "deactivate"
          ? `${productIds.length} producto(s) desactivado(s).`
          : `${productIds.length} producto(s) activado(s).`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error en operación masiva",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
