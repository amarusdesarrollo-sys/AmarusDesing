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
      | { teamMemberId?: string }
      | null;
    const teamMemberId = body?.teamMemberId?.toString().trim();
    if (!teamMemberId) {
      return NextResponse.json(
        { success: false, message: "Falta teamMemberId" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdminApp();
    const db = getFirestore(app);

    const ref = db.collection("teamMembers").doc(teamMemberId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { success: false, message: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    const data = snap.data() as any;
    const paths = toStoragePaths([data?.imagePublicId, data?.imageUrl]);
    const storage = await removeStoragePaths(paths);

    await ref.delete();

    return NextResponse.json({
      success: true,
      teamMemberId,
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

