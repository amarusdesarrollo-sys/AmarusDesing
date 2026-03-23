/**
 * Verificación de token Firebase en el servidor (API routes).
 * Solo usar en rutas que deben estar restringidas a admin.
 *
 * Credenciales Admin (una de las dos):
 * - FIREBASE_SERVICE_ACCOUNT_KEY (JSON)
 * - FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 (JSON en Base64; útil en Vercel)
 */

import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirebaseAdminApp, hasFirebaseAdminCredentials } from "@/lib/firebase-admin-server";
import { isAdminEmail } from "@/lib/auth-admin";

let authInstance: ReturnType<typeof getAuth> | null = null;

function getAdminAuth(): ReturnType<typeof getAuth> {
  if (authInstance) return authInstance;
  try {
    authInstance = getAuth(getFirebaseAdminApp());
    return authInstance;
  } catch (e) {
    console.error("Firebase Admin init error:", e);
    throw e instanceof Error ? e : new Error("Configuración de Firebase Admin inválida");
  }
}

/**
 * Verifica el token Bearer y que el usuario sea admin.
 * Devuelve el email si es válido y admin; lanza o devuelve null si no.
 */
export async function requireAdminToken(
  request: Request
): Promise<{ email: string } | { error: string; status: number }> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return { error: "Falta token de autorización", status: 401 };
  }
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    const email = decoded.email;
    if (!email || !isAdminEmail(email)) {
      return { error: "Acceso denegado", status: 403 };
    }
    return { email };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("requireAdminToken error:", err);
    }
    return { error: "Token inválido o expirado", status: 401 };
  }
}

/**
 * Helper para usar en API route.
 * Siempre exige Firebase Admin + token admin válido.
 * Sin credenciales Admin en el servidor → 503 (no se ejecuta la ruta sin auth).
 */
export async function requireAdmin(
  request: Request
): Promise<{ email: string } | NextResponse> {
  if (!hasFirebaseAdminCredentials()) {
    return NextResponse.json(
      {
        error:
          "Firebase Admin no configurado en el servidor (FIREBASE_SERVICE_ACCOUNT_KEY o FIREBASE_SERVICE_ACCOUNT_KEY_BASE64)",
      },
      { status: 503 }
    );
  }
  const result = await requireAdminToken(request);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return result;
}

/**
 * Verifica token Bearer (usuario autenticado, no necesariamente admin).
 * Requiere credenciales Admin. Si no están configuradas, devuelve 503.
 */
export async function requireUser(
  request: Request
): Promise<
  | { uid: string; email?: string | null }
  | { error: string; status: number }
> {
  if (!hasFirebaseAdminCredentials()) {
    return {
      error:
        "Firebase Admin no configurado (FIREBASE_SERVICE_ACCOUNT_KEY o FIREBASE_SERVICE_ACCOUNT_KEY_BASE64)",
      status: 503,
    };
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return { error: "Falta token de autorización", status: 401 };
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("requireUser error:", err);
    }
    return { error: "Token inválido o expirado", status: 401 };
  }
}
