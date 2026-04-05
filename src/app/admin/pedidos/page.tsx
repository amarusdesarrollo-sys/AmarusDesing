"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, ShoppingCart, Trash2 } from "lucide-react";
import { getOrders } from "@/lib/firebase/orders";
import { getAuthHeaders } from "@/lib/auth-headers";
import type { Order, OrderStatus } from "@/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente de pago",
  confirmed: "Confirmado",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function isOrderStatus(s: string): s is OrderStatus {
  return ORDER_STATUSES.includes(s as OrderStatus);
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  /** Cola: pedidos pagados pendientes de envío (confirmado + en proceso) */
  const [fulfillmentQueue, setFulfillmentQueue] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  /** Filtros desde URL (?status=confirmed | ?queue=fulfillment) */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("queue") === "fulfillment") {
      setFulfillmentQueue(true);
      setStatusFilter("");
      return;
    }
    setFulfillmentQueue(false);
    const st = params.get("status");
    if (st && isOrderStatus(st)) {
      setStatusFilter(st);
    }
  }, []);

  useEffect(() => {
    filterOrders();
  }, [statusFilter, searchTerm, dateFilter, allOrders, fulfillmentQueue]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const list = await getOrders();
      setAllOrders(list);
      setError(null);
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...allOrders];

    if (fulfillmentQueue) {
      filtered = filtered.filter(
        (o) => o.status === "confirmed" || o.status === "processing"
      );
    } else if (statusFilter) {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.id.toLowerCase().includes(term) ||
          o.customerName?.toLowerCase().includes(term) ||
          o.customerEmail?.toLowerCase().includes(term)
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter((o) => {
        const orderDate = new Date(o.createdAt);
        if (dateFilter === "today") return orderDate >= today;
        if (dateFilter === "week") return orderDate >= weekAgo;
        if (dateFilter === "month") return orderDate >= monthAgo;
        return true;
      });
    }

    setOrders(filtered);
  };

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleDeleteOrder = async (order: Order) => {
    const label = order.customerName || order.customerEmail || order.id.slice(0, 12);
    const ok = confirm(
      `¿Eliminar el pedido ${order.id.slice(0, 12)}… (${label})?\n\nEsta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
      setDeletingId(order.id);
      setError(null);
      const res = await fetch("/api/admin/delete-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; message?: string; error?: string }
        | null;
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || data?.error || "Error al eliminar el pedido");
      }
      setAllOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (err) {
      console.error("Error deleting order:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar el pedido");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="flex justify-center items-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 sm:text-4xl">Pedidos</h1>
        <p className="text-gray-600">Gestiona los pedidos de la tienda. Podés eliminar pedidos uno por uno desde la tabla.</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          Filtrar por estado:
        </span>
        <select
          value={fulfillmentQueue ? "__fulfillment__" : statusFilter}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "__fulfillment__") {
              setFulfillmentQueue(true);
              setStatusFilter("");
            } else {
              setFulfillmentQueue(false);
              setStatusFilter((v || "") as OrderStatus | "");
            }
          }}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#6B5BB6]"
        >
          <option value="">Todos</option>
          <option value="__fulfillment__">
            Pagados por preparar (confirmado + en proceso)
          </option>
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-4">
            {searchTerm || statusFilter || fulfillmentQueue || dateFilter !== "all"
              ? "No hay pedidos que coincidan con los filtros."
              : "No hay pedidos aún."}
          </p>
          {(statusFilter || fulfillmentQueue) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setFulfillmentQueue(false);
              }}
              className="text-[#6B5BB6] hover:text-[#5B4BA5] font-medium"
            >
              Ver todos los pedidos
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pedido / Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cupón
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-gray-900">
                        {order.id.slice(0, 12)}…
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {order.customerName || "—"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customerEmail || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.promoCode ? (
                        <div>
                          <div className="font-semibold">{order.promoCode}</div>
                          {order.discount && order.discount > 0 ? (
                            <div className="text-xs text-green-700">
                              -{formatPrice(order.discount)}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          STATUS_COLORS[order.status]
                        }`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1">
                        <Link href={`/admin/pedidos/${order.id}`}>
                          <button
                            type="button"
                            className="p-2 text-[#6B5BB6] hover:bg-[#6B5BB6]/10 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Ver detalle"
                          >
                            <Eye className="h-5 w-5" />
                            Ver
                          </button>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order)}
                          disabled={deletingId === order.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                          title="Eliminar pedido"
                        >
                          <Trash2 className="h-5 w-5" />
                          {deletingId === order.id ? "…" : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
