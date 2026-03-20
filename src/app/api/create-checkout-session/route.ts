import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrderById } from "@/lib/firebase/orders";

/**
 * URL base para success/cancel de Stripe (sin barra final).
 * 1) NEXT_PUBLIC_SITE_URL (dominio custom)
 * 2) VERCEL_URL (Vercel lo inyecta; evita success_url a localhost si falta la env pública)
 * 3) Header Origin (mismo origen en el navegador)
 * 4) localhost
 */
function getCheckoutOrigin(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
  if (fromEnv) return fromEnv;

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "").trim();
  if (vercel) {
    return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  }

  const origin = request.headers.get("origin")?.replace(/\/$/, "").trim();
  if (origin && /^https:\/\//i.test(origin)) return origin;
  if (origin && /^http:\/\/localhost(?::\d+)?$/i.test(origin)) return origin;

  return "http://localhost:3000";
}

/**
 * Crea una sesión de Stripe Checkout para pagar una orden.
 * POST body: { orderId: string }
 * La orden debe existir en Firestore y tener total en céntimos.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret || !secret.startsWith("sk_")) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY no configurada o inválida en el servidor" },
        { status: 500 }
      );
    }

    let body: { orderId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Cuerpo JSON inválido" },
        { status: 400 }
      );
    }

    const { orderId } = body;
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "orderId es requerido" },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    if (order.total <= 0) {
      return NextResponse.json(
        { error: "El total de la orden debe ser mayor que 0" },
        { status: 400 }
      );
    }

    const origin = getCheckoutOrigin(request);

    const stripe = new Stripe(secret);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "klarna"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: order.total,
            product_data: {
              name: `Pedido #${orderId.slice(0, 8)}`,
              description: `${order.items.length} producto(s) - Envío incluido`,
              images:
                order.items[0]?.product?.images?.[0]?.url
                  ? [order.items[0].product.images[0].url]
                  : undefined,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/checkout/confirmacion?orderId=${orderId}`,
      cancel_url: `${origin}/checkout`,
      metadata: { orderId },
      customer_email: order.customerEmail || undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    const message =
      err instanceof Error ? err.message : "Error al crear sesión de pago";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
