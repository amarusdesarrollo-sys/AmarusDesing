/**
 * Firebase Admin para rutas API (Firestore server-side).
 * Soporta:
 * - FIREBASE_SERVICE_ACCOUNT_KEY (JSON en una línea)
 * - FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 (mismo JSON en Base64; recomendado en Vercel)
 */

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";

function getServiceAccountJsonRaw(): string | null {
  const plain = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (plain) return plain;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64?.trim();
  if (!b64) return null;
  try {
    return Buffer.from(b64, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function hasFirebaseAdminCredentials(): boolean {
  return Boolean(getServiceAccountJsonRaw()?.trim());
}

export function getFirebaseAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing as App;

  const raw = getServiceAccountJsonRaw();
  if (!raw?.trim()) {
    console.error("Firebase Admin env missing in runtime:", {
      nodeEnv: process.env.NODE_ENV,
      hasKey: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim()),
      hasKeyBase64: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64?.trim()),
      vercelEnv: process.env.VERCEL_ENV,
      vercelUrl: process.env.VERCEL_URL,
    });
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY no configurada");
  }

  let serviceAccount: object;
  try {
    serviceAccount = JSON.parse(raw) as object;
  } catch (e) {
    console.error("Firebase Admin: JSON inválido", e);
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY no es un JSON válido");
  }

  return initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
  });
}
