import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import {
  getFirebaseAdminApp,
  hasFirebaseAdminCredentials,
} from "@/lib/firebase-admin-server";
import { requireAdmin } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    if (!hasFirebaseAdminCredentials()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Firebase Admin no configurado. No se pueden eliminar pedidos desde admin.",
        },
        { status: 503 }
      );
    }

    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const body = (await request.json().catch(() => null)) as
      | { all?: boolean }
      | null;
    if (!body?.all) {
      return NextResponse.json(
        { success: false, message: "Acción no permitida" },
        { status: 400 }
      );
    }

    const db = getFirestore(getFirebaseAdminApp());
    const snapshot = await db.collection("orders").get();
    const docs = snapshot.docs;

    if (docs.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 });
    }

    // Firestore batch write limit: 500 operaciones.
    let deleted = 0;
    for (let i = 0; i < docs.length; i += 400) {
      const chunk = docs.slice(i, i + 400);
      const batch = db.batch();
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      deleted += chunk.length;
    }

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { success: false, message, error: message },
      { status: 500 }
    );
  }
}
