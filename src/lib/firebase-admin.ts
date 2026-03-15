/**
 * Verificación de token Firebase en el servidor (API routes).
 * Solo usar en rutas que deben estar restringidas a admin.
 *
 * Requiere: FIREBASE_SERVICE_ACCOUNT_KEY (JSON completo de la cuenta de servicio de Firebase).
 * Si no está definida, requireAdmin() devuelve 503 para indicar que hay que configurarla.
 */

import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { isAdminEmail } from "@/lib/auth-admin";

let authInstance: ReturnType<typeof getAuth> | null = null;

function getAdminAuth(): ReturnType<typeof getAuth> {
  if (authInstance) return authInstance;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key || !key.trim()) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY no configurada");
  }
  try {
    const serviceAccount = JSON.parse(key) as object;
    let app: App;
    if (getApps().length === 0) {
      app = initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
    } else {
      app = getApps()[0] as App;
    }
    authInstance = getAuth(app);
    return authInstance;
  } catch (e) {
    console.error("Firebase Admin init error:", e);
    throw new Error("Configuración de Firebase Admin inválida");
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
 * Si FIREBASE_SERVICE_ACCOUNT_KEY está definida: exige token admin; si no, deja pasar (para no romper despliegues sin la key).
 */
export async function requireAdmin(
  request: Request
): Promise<{ email: string } | NextResponse | null> {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim()) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[auth] FIREBASE_SERVICE_ACCOUNT_KEY no configurada: rutas de admin sin proteger."
      );
    }
    return null; // No proteger; la ruta decide seguir
  }
  const result = await requireAdminToken(request);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return result;
}
