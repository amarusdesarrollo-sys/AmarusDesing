import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrderById, updateOrderPaymentStatus } from "@/lib/firebase/orders";
import { decrementStock } from "@/lib/firebase/products";
import { sendOrderConfirmationEmail } from "@/lib/email";

/**
 * Webhook de Stripe. Recibe eventos (p. ej. checkout.session.completed)
 * y actualiza la orden en Firestore cuando el pago es exitoso.
 *
 * IMPORTANTE: El body debe leerse como texto raw para verificar la firma.
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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.error("checkout.session.completed sin metadata.orderId");
      return NextResponse.json({ received: true }, { status: 200 });
    }
    const paymentMethod =
      session.payment_method_types?.[0] ?? "card";
    try {
      await updateOrderPaymentStatus(orderId, "paid", paymentMethod);

      // Descontar stock de cada producto
      const order = await getOrderById(orderId);
      if (order?.items?.length) {
        for (const item of order.items) {
          try {
            await decrementStock(item.productId, item.quantity);
          } catch (stockErr) {
            console.error(
              `Error descontando stock de ${item.productId}:`,
              stockErr
            );
            // No fallar el webhook; la orden ya está pagada
          }
        }
      }

      // Enviar email de confirmación (opcional si RESEND_API_KEY está configurada)
      if (order) {
        try {
          await sendOrderConfirmationEmail(order);
        } catch (emailErr) {
          console.error("Error enviando email de confirmación:", emailErr);
          // No fallar el webhook
        }
      }
    } catch (err) {
      console.error("Error actualizando orden:", err);
      return NextResponse.json(
        { error: "Error actualizando orden" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
