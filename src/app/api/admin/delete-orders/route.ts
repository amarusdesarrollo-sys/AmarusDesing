import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/firebase-admin";

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key || !key.trim()) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY no configurada");
  }
  const serviceAccount = JSON.parse(key) as object;
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    });
  } else {
    adminApp = getApps()[0] as App;
  }
  return adminApp;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "FIREBASE_SERVICE_ACCOUNT_KEY no configurada. No se pueden eliminar pedidos desde admin.",
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

    const db = getFirestore(getAdminApp());
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
