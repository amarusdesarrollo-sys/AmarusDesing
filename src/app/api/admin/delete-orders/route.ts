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
      | { orderId?: string }
      | null;
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Falta orderId" },
        { status: 400 }
      );
    }

    const db = getFirestore(getFirebaseAdminApp());
    const ref = db.collection("orders").doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { success: false, message: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    await ref.delete();
    return NextResponse.json({ success: true, deleted: 1 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { success: false, message, error: message },
      { status: 500 }
    );
  }
}
