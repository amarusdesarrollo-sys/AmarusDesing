import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/firebase-admin";
import { isAdminEmail } from "@/lib/auth-admin";

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
            "FIREBASE_SERVICE_ACCOUNT_KEY no configurada. No se puede eliminar usuarios desde admin.",
        },
        { status: 503 }
      );
    }

    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const body = (await request.json().catch(() => null)) as
      | { uid?: string; email?: string }
      | null;
    const uid = body?.uid?.toString().trim() || "";
    const email = body?.email?.toString().trim() || "";
    if (!uid && !email) {
      return NextResponse.json(
        { success: false, message: "Falta uid o email" },
        { status: 400 }
      );
    }

    const app = getAdminApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Evita eliminar accidentalmente el admin principal.
    if (email && isAdminEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "No se puede eliminar el usuario administrador principal",
        },
        { status: 403 }
      );
    }

    // Si hay uid intentamos borrar cuenta Auth y perfil users/{uid}.
    let authState: "deleted" | "not-found" = "deleted";
    if (uid) {
      try {
        const user = await auth.getUser(uid);
        if (isAdminEmail(user.email)) {
          return NextResponse.json(
            {
              success: false,
              message: "No se puede eliminar el usuario administrador principal",
            },
            { status: 403 }
          );
        }
        await auth.deleteUser(uid);
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === "auth/user-not-found") {
          authState = "not-found";
        } else {
          throw err;
        }
      }
      await db.collection("users").doc(uid).delete();
    }

    // Elimina pedidos relacionados (cuentas registradas, huérfanas e invitados).
    // Se hace en memoria para soportar coincidencia case-insensitive por email.
    const ordersSnap = await db.collection("orders").get();
    const emailLower = email.toLowerCase();
    const related = ordersSnap.docs.filter((d) => {
      const data = d.data() as { userId?: string; customerEmail?: string };
      const sameUid = uid && data.userId === uid;
      const sameEmail =
        emailLower &&
        typeof data.customerEmail === "string" &&
        data.customerEmail.toLowerCase() === emailLower;
      return Boolean(sameUid || sameEmail);
    });

    await Promise.all(related.map((d) => d.ref.delete()));

    return NextResponse.json({
      success: true,
      uid: uid || null,
      email: email || null,
      auth: uid ? authState : "skipped",
      deletedOrders: related.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      {
        success: false,
        message,
        error: message,
      },
      { status: 500 }
    );
  }
}
