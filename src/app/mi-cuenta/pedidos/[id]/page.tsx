"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/firebase";
import { getOrderById } from "@/lib/firebase/orders";
import type { Order, OrderStatus } from "@/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente de pago",
  confirmed: "Confirmado",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: "Pendiente de pago",
  klarna: "Klarna",
  card: "Tarjeta",
  transfer: "Transferencia",
};

/**
 * Vista detalle de un pedido (solo lectura). Solo el dueño puede verla.
 * Muestra estado y método de pago. Sin datos financieros.
 */
export default function PedidoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!id) {
      setLoading(false);
      return;
    }
    getOrderById(id)
      .then((o) => {
        if (!o) {
          setOrder(null);
          return;
        }
        if (o.userId !== user.uid) {
          setForbidden(true);
          setOrder(null);
          return;
        }
        setOrder(o);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id, router]);

  const formatPrice = (cents: number) => (cents / 100).toFixed(2);
  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#6B5BB6]" />
      </div>
    );
  }

  if (forbidden || !order) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-8">
        <h1 className="text-xl font-bold text-gray-800 mb-4">
          {forbidden ? "No tienes acceso a este pedido" : "Pedido no encontrado"}
        </h1>
        <Link
          href="/mi-cuenta/pedidos"
          className="inline-flex items-center gap-2 text-[#6B5BB6] font-medium hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Mis pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-8">
      <Link
        href="/mi-cuenta/pedidos"
        className="inline-flex items-center gap-2 text-[#6B5BB6] font-medium hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Mis pedidos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Pedido #{order.id.slice(0, 8)}
        </h1>
        <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.status === "delivered"
                ? "bg-green-100 text-green-800"
                : order.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {STATUS_LABELS[order.status]}
          </span>
          <span className="text-sm text-gray-600">
            Pago: {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Productos</h2>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li
                key={`${item.productId}-${item.quantity}`}
                className="flex gap-4 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                  <Image
                    src={
                      item.product.images?.find((i) => i.isPrimary)?.url ||
                      item.product.images?.[0]?.url ||
                      "/images/placeholder.jpg"
                    }
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{item.product.name}</p>
                  <p className="text-gray-500 text-sm">
                    Cantidad: {item.quantity} · €{formatPrice(item.price)}/u
                  </p>
                </div>
                <p className="font-semibold text-gray-800">
                  €{formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="border-t border-gray-200 pt-4 flex flex-col gap-2">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>€{formatPrice(order.items.reduce((s, i) => s + i.price * i.quantity, 0))}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Envío</span>
            <span>
              {order.shipping === 0 ? (
                <span className="text-green-600">Gratis</span>
              ) : (
                `€${formatPrice(order.shipping)}`
              )}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-800">
            <span>Total</span>
            <span className="text-[#6B5BB6]">€{formatPrice(order.total)}</span>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Dirección de envío</h2>
          <p className="text-gray-700">
            {order.customerGivenName} {order.customerFamilyName}
            <br />
            {order.shippingAddress.street}
            {order.shippingAddress.street2 && (
              <>
                <br />
                {order.shippingAddress.street2}
              </>
            )}
            <br />
            {order.shippingAddress.postalCode} {order.shippingAddress.city}
            {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
            <br />
            {order.shippingAddress.country}
          </p>
          {order.customerPhone && (
            <p className="text-gray-600 text-sm mt-2">Tel: {order.customerPhone}</p>
          )}
        </section>

        {order.trackingNumber && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Seguimiento</h2>
            <p className="text-gray-700 font-mono">{order.trackingNumber}</p>
          </section>
        )}
      </div>
    </div>
  );
}
