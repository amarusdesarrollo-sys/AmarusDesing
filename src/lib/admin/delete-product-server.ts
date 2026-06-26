import { getFirebaseAdminApp } from "@/lib/firebase-admin-server";
import { removeStoragePaths } from "@/lib/storage/server";
import { toStoragePaths } from "@/lib/storage/resolve-paths";
import { getFirestore } from "firebase-admin/firestore";

export type DeleteProductResult = {
  productId: string;
  ok: boolean;
  error?: string;
  storage?: { total: number; deleted: number; failed: number };
};

function mediaPathsFromProduct(data: Record<string, unknown>): string[] {
  const images = Array.isArray(data?.images) ? data.images : [];
  return toStoragePaths(
    images.flatMap((i: { publicId?: string; url?: string }) => [
      i?.publicId,
      i?.url,
    ])
  );
}

/** Elimina un producto de Firestore y sus medios en Supabase Storage. */
export async function deleteProductWithAssets(
  productId: string
): Promise<DeleteProductResult> {
  const app = getFirebaseAdminApp();
  const db = getFirestore(app);
  const productRef = db.collection("products").doc(productId);
  const snap = await productRef.get();

  if (!snap.exists) {
    return { productId, ok: false, error: "Producto no encontrado" };
  }

  const data = snap.data() as Record<string, unknown>;
  const paths = mediaPathsFromProduct(data);
  const storage = await removeStoragePaths(paths);

  await productRef.delete();

  return {
    productId,
    ok: true,
    storage: {
      total: paths.length,
      deleted: storage.removed,
      failed: storage.failed,
    },
  };
}
