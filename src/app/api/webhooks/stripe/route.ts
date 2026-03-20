import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { sendOrderConfirmationEmail, sendNewOrderAlertToAdmin } from "@/lib/email";
import type { Order, OrderItem } from "@/types";

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

const toDate = (v: unknown): Date => {
  if (v && typeof v === "object" && "toDate" in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  if (v instanceof Date) return v;
  if (typeof v === "string") return new Date(v);
  return new Date();
};

function toOrder(data: any, id: string): Order {
  const items: OrderItem[] = (data?.items || []).map((item: any) => ({
    productId: item.productId ?? "",
    product: item.product,
    quantity: item.quantity ?? 0,
    price: item.price ?? 0,
  }));
  return {
    id,
    userId: data?.userId ?? "guest",
    customerName: data?.customerName,
    customerGivenName: data?.customerGivenName,
    customerFamilyName: data?.customerFamilyName,
    customerEmail: data?.customerEmail,
    customerPhone: data?.customerPhone,
    items,
    discount: data?.discount,
    promoCode: data?.promoCode,
    total: data?.total ?? 0,
    shipping: data?.shipping ?? 0,
    tax: data?.tax ?? 0,
    shippingOptionName: data?.shippingOptionName,
    status: data?.status ?? "pending",
    paymentMethod: data?.paymentMethod ?? "pending",
    paymentStatus: data?.paymentStatus ?? "pending",
    shippingAddress: {
      street: data?.shippingAddress?.street ?? "",
      street2: data?.shippingAddress?.street2,
      city: data?.shippingAddress?.city ?? "",
      postalCode: data?.shippingAddress?.postalCode ?? "",
      country: data?.shippingAddress?.country ?? "",
      state: data?.shippingAddress?.state,
    },
    trackingNumber: data?.trackingNumber,
    createdAt: toDate(data?.createdAt),
    updatedAt: toDate(data?.updatedAt),
  };
}

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
      const db = getFirestore(getAdminApp());
      const orderRef = db.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists) {
        console.error("Pedido no encontrado en webhook:", orderId);
        return NextResponse.json({ received: true }, { status: 200 });
      }
      const order = toOrder(orderSnap.data(), orderId);
      if (order.paymentStatus === "paid") {
        return NextResponse.json({ received: true, alreadyPaid: true }, { status: 200 });
      }

      await orderRef.update({
        paymentStatus: "paid",
        paymentMethod,
        status: "confirmed",
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Descontar stock de cada producto con Firebase Admin (no depende de reglas del cliente)
      if (order.items?.length) {
        for (const item of order.items) {
          try {
            await db.runTransaction(async (tx) => {
              const productRef = db.collection("products").doc(item.productId);
              const productSnap = await tx.get(productRef);
              if (!productSnap.exists) {
                throw new Error(`Producto ${item.productId} no encontrado`);
              }
              const currentStock = (productSnap.data()?.stock ?? 0) as number;
              const newStock = Math.max(0, currentStock - item.quantity);
              tx.update(productRef, {
                stock: newStock,
                inStock: newStock > 0,
                updatedAt: FieldValue.serverTimestamp(),
              });
            });
          } catch (stockErr) {
            console.error(
              `Error descontando stock de ${item.productId}:`,
              stockErr
            );
            // No fallar el webhook; la orden ya está pagada
          }
        }
      }

      // Emails: confirmación al cliente y aviso al admin
      const customerEmailRes = await sendOrderConfirmationEmail(order);
      if (!customerEmailRes.ok) {
        console.error("Resend fallo: email confirmación pedido:", {
          orderId: order.id,
          to: order.customerEmail,
          error: customerEmailRes.error,
        });
      }

      const adminAlertRes = await sendNewOrderAlertToAdmin(order);
      if (!adminAlertRes.ok) {
        console.error("Resend fallo: aviso admin nuevo pedido:", {
          orderId: order.id,
          to: process.env.ADMIN_NOTIFY_EMAIL || undefined,
          error: adminAlertRes.error,
        });
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
