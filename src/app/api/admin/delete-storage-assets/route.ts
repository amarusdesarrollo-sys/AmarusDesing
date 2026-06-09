import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin";
import { removeStoragePaths } from "@/lib/storage/server";
import { storagePathFromPublicUrl } from "@/lib/supabase/config";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const body = (await request.json()) as {
      storagePaths?: string[];
      /** Compatibilidad con admin que enviaba `publicIds` (Cloudinary o rutas Supabase). */
      publicIds?: string[];
    };

    const raw = [
      ...(Array.isArray(body.storagePaths) ? body.storagePaths : []),
      ...(Array.isArray(body.publicIds) ? body.publicIds : []),
    ];

    const paths = raw
      .map((item) => {
        const s = String(item || "").trim();
        if (!s) return null;
        if (s.startsWith("http")) return storagePathFromPublicUrl(s);
        return s;
      })
      .filter((p): p is string => Boolean(p));

    const { removed, failed } = await removeStoragePaths(paths);

    return NextResponse.json({
      success: true,
      storage: { requested: paths.length, removed, failed },
    });
  } catch (error) {
    console.error("delete-storage-assets:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error al borrar",
      },
      { status: 500 }
    );
  }
}
