import { NextResponse } from "next/server";

/**
 * Debug temporal para validar qué variables ve el runtime en Vercel.
 * No expone secretos, solo presencia y longitudes.
 */
export async function GET() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "";
  const keyB64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 ?? "";
  const stripeSecret = process.env.STRIPE_SECRET_KEY ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  return NextResponse.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelUrl: process.env.VERCEL_URL ?? null,
    firebase: {
      keyPresent: key.trim().length > 0,
      keyLength: key.length,
      keyBase64Present: keyB64.trim().length > 0,
      keyBase64Length: keyB64.length,
    },
    stripe: {
      secretPresent: stripeSecret.trim().length > 0,
      secretPrefix: stripeSecret.slice(0, 7) || null,
      webhookPresent: webhookSecret.trim().length > 0,
      webhookPrefix: webhookSecret.slice(0, 6) || null,
    },
  });
}
