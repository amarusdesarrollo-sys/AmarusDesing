import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { sendOrderConfirmationEmail, sendNewOrderAlertToAdmin } from "@/lib/email";
import type { Order, OrderItem } from "@/types";

const toDate = (v: unknown): Date => {
  if (v && typeof v === "object" && "toDate" in v) {
    return (v as { toDate: () => Date }).toDate();
  }
  if (v instanceof Date) return v;
  if (typeof v === "string") return new Date(v);
  return new Date();
};

export function firestoreDataToOrder(data: Record<string, unknown> | undefined, id: string): Order {
  const items: OrderItem[] = ((data?.items as unknown[]) || []).map((item: any) => ({
    productId: item.productId ?? "",
    product: item.product,
    quantity: item.quantity ?? 0,
    price: item.price ?? 0,
  }));
  const addr = (data?.shippingAddress as Record<string, unknown>) || {};
  return {
    id,
    userId: (data?.userId as string) ?? "guest",
    customerName: data?.customerName as string | undefined,
    customerGivenName: data?.customerGivenName as string | undefined,
    customerFamilyName: data?.customerFamilyName as string | undefined,
    customerEmail: data?.customerEmail as string | undefined,
    customerPhone: data?.customerPhone as string | undefined,
    items,
    discount: data?.discount as number | undefined,
    promoCode: data?.promoCode as string | undefined,
    total: (data?.total as number) ?? 0,
    shipping: (data?.shipping as number) ?? 0,
    tax: (data?.tax as number) ?? 0,
    shippingOptionName: data?.shippingOptionName as string | undefined,
    status: (data?.status as Order["status"]) ?? "pending",
    paymentMethod: (data?.paymentMethod as string) ?? "pending",
    paymentStatus: (data?.paymentStatus as Order["paymentStatus"]) ?? "pending",
    shippingAddress: {
      street: (addr.street as string) ?? "",
      street2: addr.street2 as string | undefined,
      city: (addr.city as string) ?? "",
      postalCode: (addr.postalCode as string) ?? "",
      country: (addr.country as string) ?? "",
      state: addr.state as string | undefined,
    },
    trackingNumber: data?.trackingNumber as string | undefined,
    createdAt: toDate(data?.createdAt),
    updatedAt: toDate(data?.updatedAt),
  };
}

/**
 * Marca pedido pagado, descuenta stock y envía emails (idempotente si ya estaba paid).
 */
export async function finalizePaidOrder(
  db: Firestore,
  orderId: string,
  paymentMethod: string
): Promise<{ ok: true; alreadyPaid: boolean } | { ok: false; message: string }> {
  const orderRef = db.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    return { ok: false, message: "Pedido no encontrado" };
  }

  const data = orderSnap.data() as Record<string, unknown> | undefined;
  const current = firestoreDataToOrder(data, orderId);
  if (current.paymentStatus === "paid") {
    return { ok: true, alreadyPaid: true };
  }

  await orderRef.update({
    paymentStatus: "paid",
    paymentMethod,
    status: "confirmed",
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (current.items?.length) {
    for (const item of current.items) {
      const pid = item.productId?.toString().trim();
      if (!pid) continue;
      try {
        await db.runTransaction(async (tx) => {
          const productRef = db.collection("products").doc(pid);
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
      } catch (stockErr) {
        console.error(`Error descontando stock de ${pid}:`, stockErr);
      }
    }
  }

  const paidOrder: Order = {
    ...current,
    paymentStatus: "paid",
    status: "confirmed",
    paymentMethod,
  };

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

  return { ok: true, alreadyPaid: false };
}
