import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "@/types";

const COLLECTION_NAME = "orders";

const convertTimestamp = (timestamp: unknown): Date => {
  if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
    return (timestamp as { toDate: () => Date }).toDate();
  }
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

/** Convierte un producto anidado (puede tener Timestamp) a formato normal */
function normalizeProduct(data: any): any {
  if (!data || typeof data !== "object") return data;
  const out = { ...data };
  if (out.createdAt != null) out.createdAt = convertTimestamp(out.createdAt);
  if (out.updatedAt != null) out.updatedAt = convertTimestamp(out.updatedAt);
  return out;
}

function firestoreToOrder(data: any, id: string): Order {
  const items: OrderItem[] = (data.items || []).map((item: any) => ({
    productId: item.productId,
    product: normalizeProduct(item.product),
    quantity: item.quantity ?? 0,
    price: item.price ?? 0,
  }));
  const addr = data.shippingAddress ?? {};
  return {
    id,
    userId: data.userId ?? "",
    customerName: data.customerName,
    customerGivenName: data.customerGivenName,
    customerFamilyName: data.customerFamilyName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    items,
    total: data.total ?? 0,
    shipping: data.shipping ?? 0,
    tax: data.tax ?? 0,
    shippingOptionName: data.shippingOptionName,
    status: (data.status as OrderStatus) ?? "pending",
    paymentMethod: data.paymentMethod ?? "pending",
    paymentStatus: (data.paymentStatus as PaymentStatus) ?? "pending",
    shippingAddress: {
      street: addr.street ?? "",
      street2: addr.street2,
      city: addr.city ?? "",
      postalCode: addr.postalCode ?? "",
      country: addr.country ?? "",
      state: addr.state,
    },
    trackingNumber: data.trackingNumber,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
}

/** Elimina undefined de un objeto recursivamente (Firestore no acepta undefined) */
function removeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefined(item)) as T;
  }
  if (typeof obj === "object" && obj.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        out[key] = removeUndefined(value);
      }
    }
    return out as T;
  }
  return obj;
}

/** Convierte Order a objeto para Firestore (Date → Timestamp, sin undefined) */
function orderToFirestore(
  order: Omit<Order, "id" | "createdAt" | "updatedAt">
): Record<string, unknown> {
  const shippingAddress: Record<string, unknown> = {
    street: order.shippingAddress.street,
    city: order.shippingAddress.city,
    postalCode: order.shippingAddress.postalCode,
    country: order.shippingAddress.country,
  };
  if (order.shippingAddress.street2 != null)
    shippingAddress.street2 = order.shippingAddress.street2;
  if (order.shippingAddress.state != null)
    shippingAddress.state = order.shippingAddress.state;

  const out: Record<string, unknown> = {
    userId: order.userId,
    items: order.items,
    total: order.total,
    shipping: order.shipping,
    tax: order.tax,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shippingAddress,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  if (order.customerName != null) out.customerName = order.customerName;
  if (order.customerGivenName != null)
    out.customerGivenName = order.customerGivenName;
  if (order.customerFamilyName != null)
    out.customerFamilyName = order.customerFamilyName;
  if (order.customerEmail != null) out.customerEmail = order.customerEmail;
  if (order.customerPhone != null) out.customerPhone = order.customerPhone;
  if (order.shippingOptionName != null)
    out.shippingOptionName = order.shippingOptionName;
  if (order.trackingNumber != null) out.trackingNumber = order.trackingNumber;
  return removeUndefined(out);
}

export interface CreateOrderInput {
  userId?: string;
  customerName: string;
  customerGivenName: string;
  customerFamilyName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  shipping: number;
  tax?: number;
  paymentMethod?: string;
  /** Nombre del envío para Klarna (ej: "Envío estándar"). Precio en cents en `shipping`. */
  shippingOptionName?: string;
  shippingAddress: {
    street: string;
    street2?: string;
    city: string;
    postalCode: string;
    country: string;
    state?: string;
  };
}

/** Crea una orden en Firestore y devuelve su id */
export async function createOrder(input: CreateOrderInput): Promise<string> {
  const orderData = orderToFirestore({
    userId: input.userId ?? "guest",
    customerName: input.customerName,
    customerGivenName: input.customerGivenName,
    customerFamilyName: input.customerFamilyName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    items: input.items,
    total: input.total,
    shipping: input.shipping,
    tax: input.tax ?? 0,
    shippingOptionName: input.shippingOptionName,
    status: "pending",
    paymentMethod: input.paymentMethod ?? "pending",
    paymentStatus: "pending",
    shippingAddress: input.shippingAddress,
  });
  const ref = await addDoc(collection(db, COLLECTION_NAME), orderData);
  return ref.id;
}

/** Obtiene una orden por id */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const ref = doc(db, COLLECTION_NAME, orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return firestoreToOrder(snap.data(), snap.id);
}

/** Lista todas las órdenes, más recientes primero. Opcionalmente filtra por estado (en memoria). */
export async function getOrders(status?: OrderStatus): Promise<Order[]> {
  const ordersRef = collection(db, COLLECTION_NAME);
  const q = query(ordersRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  let orders = snapshot.docs.map((d) => firestoreToOrder(d.data(), d.id));
  if (status != null) {
    orders = orders.filter((o) => o.status === status);
  }
  return orders;
}

/** Lista órdenes de un usuario (para Mi cuenta → Mis pedidos). */
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  if (!userId) return [];
  const ordersRef = collection(db, COLLECTION_NAME);
  const q = query(
    ordersRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => firestoreToOrder(d.data(), d.id));
}

/** Actualiza el estado de una orden y opcionalmente el número de seguimiento. */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, orderId);
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: Timestamp.now(),
  };
  if (trackingNumber !== undefined) {
    if (trackingNumber.trim() === "") {
      updateData.trackingNumber = deleteField();
    } else {
      updateData.trackingNumber = trackingNumber.trim();
    }
  }
  await updateDoc(ref, updateData);
}

/** Actualiza el estado de pago de una orden (llamado desde webhook de Stripe). */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  paymentMethod?: string
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, orderId);
  const updateData: Record<string, unknown> = {
    paymentStatus,
    updatedAt: Timestamp.now(),
  };
  if (paymentMethod != null) {
    updateData.paymentMethod = paymentMethod;
  }
  if (paymentStatus === "paid") {
    updateData.status = "confirmed";
  }
  await updateDoc(ref, updateData);
}
