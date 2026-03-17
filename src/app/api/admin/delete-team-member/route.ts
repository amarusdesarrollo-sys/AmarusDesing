import { NextRequest, NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary-server";
import { requireAdmin } from "@/lib/firebase-admin";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

    const app = getAdminApp();
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
    const publicIds = [data?.imagePublicId]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0);

    const cloudinary = getCloudinary();
    const results = await Promise.allSettled(
      publicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId, { invalidate: true })
      )
    );

    const cloudinaryDeleted = results.filter((r) => r.status === "fulfilled").length;
    const cloudinaryFailed = results.length - cloudinaryDeleted;

    await ref.delete();

    return NextResponse.json({
      success: true,
      teamMemberId,
      cloudinary: {
        total: results.length,
        deleted: cloudinaryDeleted,
        failed: cloudinaryFailed,
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

