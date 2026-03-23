import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp, hasFirebaseAdminCredentials } from "@/lib/firebase-admin-server";
import { finalizePaidOrder } from "@/lib/finalize-paid-order";
import { checkoutSessionIndicatesPaid } from "@/lib/stripe-checkout-paid";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { orderId?: string; sessionId?: string }
      | null;
    const orderId = body?.orderId?.toString().trim() || "";
    const sessionId = body?.sessionId?.toString().trim() || "";
    if (!orderId || !sessionId) {
      return NextResponse.json(
        { success: false, message: "Faltan orderId o sessionId" },
        { status: 400 }
      );
    }

    if (!hasFirebaseAdminCredentials()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Firebase Admin no configurado en el servidor (FIREBASE_SERVICE_ACCOUNT_KEY o _BASE64). Sin esto no se puede confirmar el pago.",
        },
        { status: 503 }
      );
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret || !stripeSecret.startsWith("sk_")) {
      return NextResponse.json(
        { success: false, message: "STRIPE_SECRET_KEY no configurada" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecret);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const metaId = session.metadata?.orderId?.toString().trim();
    if (metaId !== orderId) {
      return NextResponse.json(
        { success: false, message: "Session no coincide con orderId" },
        { status: 400 }
      );
    }

    if (!checkoutSessionIndicatesPaid(session)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Stripe aún no marca el pago como completado. Reintenta en unos segundos o espera al webhook.",
          paymentStatus: session.payment_status,
          retry: true,
        },
        { status: 409 }
      );
    }

    const db = getFirestore(getFirebaseAdminApp());
    const paymentMethod = session.payment_method_types?.[0] ?? "card";
    const result = await finalizePaidOrder(db, orderId, paymentMethod);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyPaid: result.alreadyPaid,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("confirm-payment:", err);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
