import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrderById } from "@/lib/firebase/orders";

/**
 * Crea una sesión de Stripe Checkout para pagar una orden.
 * POST body: { orderId: string, baseUrl?: string }
 * La orden debe existir en Firestore y tener total en céntimos.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY no configurada" },
      { status: 500 }
    );
  }

  let body: { orderId?: string; baseUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo JSON inválido" },
      { status: 400 }
    );
  }

  const { orderId, baseUrl } = body;
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

  const origin =
    baseUrl && typeof baseUrl === "string"
      ? baseUrl.replace(/\/$/, "")
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const stripe = new Stripe(secret);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "klarna"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: order.total, // ya en céntimos
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
    console.error("Stripe create session error:", err);
    const message =
      err instanceof Error ? err.message : "Error al crear sesión de pago";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
