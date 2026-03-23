import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp, hasFirebaseAdminCredentials } from "@/lib/firebase-admin-server";
import { finalizePaidOrder } from "@/lib/finalize-paid-order";
import { checkoutSessionIndicatesPaid } from "@/lib/stripe-checkout-paid";

async function finalizeFromCheckoutSession(
  db: ReturnType<typeof getFirestore>,
  session: Stripe.Checkout.Session
) {
  const orderId = session.metadata?.orderId?.toString().trim();
  if (!orderId) {
    console.error("Stripe Checkout: falta metadata.orderId", session.id);
    return;
  }
  const paymentMethod = session.payment_method_types?.[0] ?? "card";
  const result = await finalizePaidOrder(db, orderId, paymentMethod);
  if (!result.ok) {
    console.error("finalizePaidOrder:", result.message, { orderId });
  }
}

/**
 * Webhook de Stripe. Confirma pago, stock y emails.
 *
 * Eventos:
 * - checkout.session.completed: solo si el pago ya consta como pagado (tarjeta inmediata).
 * - checkout.session.async_payment_succeeded: Klarna / métodos diferidos.
 * - payment_intent.succeeded: respaldo (metadata orderId en payment_intent_data al crear Checkout).
 *
 * En local: stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET no configurada");
    return NextResponse.json(
      { error: "Webhook no configurado" },
      { status: 500 }
    );
  }

  if (!hasFirebaseAdminCredentials()) {
    console.error("Webhook Stripe: Firebase Admin no configurado; no se puede actualizar pedidos");
    return NextResponse.json(
      { error: "Firebase Admin no configurado" },
      { status: 500 }
    );
  }

  let body: string;
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Falta firma Stripe" },
      { status: 400 }
    );
  }

  try {
    body = await request.text();
  } catch (err) {
    console.error("Error leyendo body del webhook:", err);
    return NextResponse.json(
      { error: "Error leyendo body" },
      { status: 400 }
    );
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY no configurada" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Firma inválida";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json(
      { error: `Webhook Error: ${msg}` },
      { status: 400 }
    );
  }

  try {
    const db = getFirestore(getFirebaseAdminApp());

    if (event.type === "checkout.session.completed") {
      const rawSession = event.data.object as Stripe.Checkout.Session;
      let session = rawSession;
      if (!checkoutSessionIndicatesPaid(rawSession)) {
        // Algunas veces checkout.session.completed llega sin payment_intent expandido.
        // Reconsultamos la sesión para confirmar estado real antes de esperar otros eventos.
        try {
          session = await stripe.checkout.sessions.retrieve(rawSession.id, {
            expand: ["payment_intent"],
          });
        } catch (err) {
          console.warn("No se pudo expandir checkout session:", err);
        }
      }
      if (!checkoutSessionIndicatesPaid(session)) {
        console.info(
          "checkout.session.completed: pago no confirmado aún; esperando async_payment_succeeded / payment_intent.succeeded",
          { id: session.id, payment_status: session.payment_status }
        );
      } else {
        await finalizeFromCheckoutSession(db, session);
      }
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      await finalizeFromCheckoutSession(db, session);
    } else if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.orderId?.toString().trim();
      if (orderId) {
        const paymentMethod = pi.payment_method_types?.[0] ?? "card";
        const result = await finalizePaidOrder(db, orderId, paymentMethod);
        if (!result.ok) {
          console.error("payment_intent.succeeded finalizePaidOrder:", result.message);
        }
      }
    }
  } catch (err) {
    console.error("Webhook: error procesando evento:", err);
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
