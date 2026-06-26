import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin";
import { deleteProductWithAssets } from "@/lib/admin/delete-product-server";
import { revalidateProductCatalog } from "@/lib/revalidate-catalog";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const body = (await request.json().catch(() => null)) as
      | { productId?: string; productIds?: string[] }
      | null;

    const ids = [
      ...(body?.productIds ?? []).map((id) => id?.toString().trim()).filter(Boolean),
      ...(body?.productId?.trim() ? [body.productId.trim()] : []),
    ];
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Falta productId" },
        { status: 400 }
      );
    }

    if (uniqueIds.length === 1) {
      const result = await deleteProductWithAssets(uniqueIds[0]);
      if (!result.ok) {
        return NextResponse.json(
          { success: false, message: result.error ?? "Error al eliminar" },
          { status: result.error === "Producto no encontrado" ? 404 : 500 }
        );
      }
      revalidateProductCatalog();
      return NextResponse.json({
        success: true,
        productId: result.productId,
        storage: result.storage,
        firestore: { deleted: true },
        message:
          "Producto eliminado de Firestore y archivos de medios borrados de Storage.",
      });
    }

    const results = await Promise.all(
      uniqueIds.map((id) => deleteProductWithAssets(id))
    );
    revalidateProductCatalog();
    const deleted = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);

    return NextResponse.json({
      success: failed.length === 0,
      processed: deleted.length,
      failed: failed.length,
      results,
      message: `${deleted.length} producto(s) eliminado(s) con medios en Storage.`,
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
