"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { auth } from "@/lib/firebase";
import { getOrdersByUserId } from "@/lib/firebase/orders";
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
  pending: "Pendiente",
  klarna: "Klarna",
  card: "Tarjeta",
  transfer: "Transferencia",
};

export default function MisPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getOrdersByUserId(user.uid)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (cents: number) => (cents / 100).toFixed(2);
  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#6B5BB6]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Mis pedidos</h1>
      <p className="text-gray-500 text-sm mb-6">
        Pedidos asociados a tu cuenta. Los realizados como invitado no aparecen aquí.
      </p>

      {orders.length === 0 ? (
        <p className="text-gray-500 py-8">
          Aún no tienes pedidos con esta cuenta. Cuando hagas un pedido iniciando sesión antes del checkout, aparecerán aquí.
        </p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-[#6B5BB6]/30 transition-colors"
            >
              <Link href={`/mi-cuenta/pedidos/${order.id}`} className="block">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-gray-800">Pedido #{order.id.slice(0, 8)}</span>
                    <span className="ml-2 text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-[#6B5BB6]">
                      €{formatPrice(order.total)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {order.items.length} producto{order.items.length !== 1 ? "s" : ""}
                  <span className="text-gray-500"> · Pago: {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
                </p>
              </Link>
              {order.status === "pending" && order.paymentStatus === "pending" && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      const res = await fetch("/api/create-checkout-session", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          orderId: order.id,
                          baseUrl: typeof window !== "undefined" ? window.location.origin : "",
                        }),
                      });
                      const json = await res.json();
                      if (json.url) window.location.href = json.url;
                      else throw new Error(json.error || "Error");
                    } catch {
                      alert("Error al iniciar el pago. Inténtalo de nuevo.");
                    }
                  }}
                  className="mt-3 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#6B5BB6] text-white rounded-lg text-sm font-medium hover:bg-[#5B4BA5] transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  Pagar ahora
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
