import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin";
import { getFirebaseAdminApp } from "@/lib/firebase-admin-server";
import { getFirestore } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const app = getFirebaseAdminApp();
    const db = getFirestore(app);
    const snap = await db
      .collection("newsletter_subscribers")
      .orderBy("createdAt", "desc")
      .get();

    const subscribers = snap.docs.map((doc) => {
      const d = doc.data();
      const createdAt = d.createdAt?.toDate?.() ?? new Date();
      return {
        id: doc.id,
        email: d.email ?? "",
        firstName: d.firstName ?? "",
        lastName: d.lastName ?? "",
        source: d.source ?? "home",
        createdAt: createdAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, subscribers });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error al cargar",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const body = (await request.json().catch(() => null)) as
      | { id?: string }
      | null;
    const id = body?.id?.trim();
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Falta id" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdminApp();
    const db = getFirestore(app);
    await db.collection("newsletter_subscribers").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error al eliminar",
      },
      { status: 500 }
    );
  }
}
