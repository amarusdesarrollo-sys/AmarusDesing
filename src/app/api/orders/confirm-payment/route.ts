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

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret || !stripeSecret.startsWith("sk_")) {
      return NextResponse.json(
        { success: false, message: "STRIPE_SECRET_KEY no configurada" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecret);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadataOrderId = session.metadata?.orderId;
    if (metadataOrderId !== orderId) {
      return NextResponse.json(
        { success: false, message: "Session no coincide con orderId" },
        { status: 400 }
      );
    }
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          success: false,
          message: "El pago aún no figura como pagado en Stripe",
          paymentStatus: session.payment_status,
        },
        { status: 409 }
      );
    }

    const db = getFirestore(getAdminApp());
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json(
        { success: false, message: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const currentOrder = toOrder(orderSnap.data(), orderId);
    if (currentOrder.paymentStatus === "paid") {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    const paymentMethod = session.payment_method_types?.[0] ?? "card";
    await orderRef.update({
      paymentStatus: "paid",
      paymentMethod,
      status: "confirmed",
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (currentOrder.items?.length) {
      for (const item of currentOrder.items) {
        try {
          await db.runTransaction(async (tx) => {
            const productRef = db.collection("products").doc(item.productId);
            const productSnap = await tx.get(productRef);
            if (!productSnap.exists) return;
            const currentStock = (productSnap.data()?.stock ?? 0) as number;
            const newStock = Math.max(0, currentStock - item.quantity);
            tx.update(productRef, {
              stock: newStock,
              inStock: newStock > 0,
              updatedAt: FieldValue.serverTimestamp(),
            });
          });
        } catch (err) {
          console.error(`Error descontando stock de ${item.productId}:`, err);
        }
      }
    }

    const paidOrder: Order = { ...currentOrder, paymentStatus: "paid", status: "confirmed", paymentMethod };
    const customerEmailRes = await sendOrderConfirmationEmail(paidOrder);
    if (!customerEmailRes.ok) {
      console.error("Resend fallo: email confirmación pedido:", {
        orderId: paidOrder.id,
        to: paidOrder.customerEmail,
        error: customerEmailRes.error,
      });
    }
    const adminAlertRes = await sendNewOrderAlertToAdmin(paidOrder);
    if (!adminAlertRes.ok) {
      console.error("Resend fallo: aviso admin nuevo pedido:", {
        orderId: paidOrder.id,
        error: adminAlertRes.error,
      });
    }

    return NextResponse.json({ success: true, alreadyPaid: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
