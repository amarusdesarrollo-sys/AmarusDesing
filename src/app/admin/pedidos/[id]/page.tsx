"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Save, Truck, Trash2 } from "lucide-react";
import { getOrderById, updateOrderStatus } from "@/lib/firebase/orders";
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

export default function AdminPedidoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    if (!id) return;
    getOrderById(id)
      .then((o) => {
        setOrder(o ?? null);
        if (o) {
          setStatus(o.status);
          setTrackingNumber(o.trackingNumber ?? "");
        }
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveStatus = async () => {
    if (!order) return;
    setSaving(true);
    setError(null);
    try {
      const previousTracking = order.trackingNumber?.trim() || "";
      const nextTracking = trackingNumber.trim();
      // Si añades nº de seguimiento y el estado es pendiente/confirmado/en proceso, se marca como Enviado
      let statusToSave = status;
      if (
        nextTracking &&
        ["pending", "confirmed", "processing"].includes(status)
      ) {
        statusToSave = "shipped";
        setStatus("shipped");
      }
      await updateOrderStatus(order.id, statusToSave, trackingNumber);
      const shouldNotifyShipment =
        Boolean(nextTracking) &&
        (!previousTracking || previousTracking !== nextTracking);
      if (shouldNotifyShipment) {
        const res = await fetch("/api/admin/notify-shipment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders()),
          },
          body: JSON.stringify({
            orderId: order.id,
            trackingNumber: nextTracking,
          }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as
            | { message?: string }
            | null;
          const msg =
            payload?.message ||
            `No se pudo enviar el email de envío (HTTP ${res.status}). Revisa Vercel → Logs y que exista FIREBASE_SERVICE_ACCOUNT_KEY_BASE64.`;
          console.warn("notify-shipment:", msg);
          setError(msg);
        }
      }
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: statusToSave,
              trackingNumber: trackingNumber.trim() || undefined,
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;
    const label = order.customerName || order.customerEmail || order.id;
    const ok = confirm(
      `¿Eliminar definitivamente este pedido?\n\n${order.id}\n${label}\n\nNo se puede deshacer.`
    );
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
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
        throw new Error(data?.message || data?.error || "Error al eliminar");
      }
      router.push("/admin/pedidos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el pedido");
    } finally {
      setDeleting(false);
    }
  };

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="flex justify-center items-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="admin-shell">
        <p className="text-gray-600 mb-4">Pedido no encontrado.</p>
        <Link href="/admin/pedidos" className="text-[#6B5BB6] hover:underline">
          Volver a pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center text-[#6B5BB6] hover:text-[#5B4BA5] mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Volver a pedidos
      </Link>

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Pedido {order.id}
          </h1>
          <p className="text-gray-500 text-sm">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Estado:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#6B5BB6]"
            >
              {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-gray-500" />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Nº seguimiento"
              className="border border-gray-300 rounded-lg px-3 py-2 w-48 focus:ring-2 focus:ring-[#6B5BB6]"
            />
          </div>
          <button
            onClick={handleSaveStatus}
            disabled={saving || deleting}
            className="bg-[#6B5BB6] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#5B4BA5] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={handleDeleteOrder}
            disabled={deleting || saving}
            className="border border-red-300 text-red-700 bg-white px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Eliminando…" : "Eliminar pedido"}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6 -mt-2">
        Si añades un número de seguimiento y el estado es
        Pendiente/Confirmado/En proceso, al guardar pasará automáticamente a{" "}
        <strong>Enviado</strong>. También puedes cambiar el estado manualmente
        en el desplegable.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cliente y dirección */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Cliente y envío
          </h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <span className="font-medium">Nombre:</span>{" "}
              {order.customerName || "—"}
            </p>
            <p>
              <span className="font-medium">Email:</span>{" "}
              {order.customerEmail || "—"}
            </p>
            {order.customerPhone && (
              <p>
                <span className="font-medium">Teléfono:</span>{" "}
                {order.customerPhone}
              </p>
            )}
            <div className="pt-2 border-t border-gray-200 mt-2">
              <p className="font-medium text-gray-800">Dirección de envío</p>
              <p>
                {order.shippingAddress.street}
                {order.shippingAddress.street2 &&
                  `, ${order.shippingAddress.street2}`}
              </p>
              <p>
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
                {order.shippingAddress.state &&
                  `, ${order.shippingAddress.state}`}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
            {order.trackingNumber && (
              <p className="pt-2">
                <span className="font-medium">Seguimiento:</span>{" "}
                {order.trackingNumber}
              </p>
            )}
          </div>
        </div>

        {/* Resumen y productos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Resumen del pedido
          </h2>
          <div className="space-y-3 mb-6">
            {order.items.map((item, idx) => (
              <div
                key={`${item.productId}-${idx}-${JSON.stringify(item.selectedVariants ?? {})}`}
                className="flex gap-4 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                  <Image
                    src={
                      item.product.images?.find((i) => i.isPrimary && i.mediaType !== "video")?.url ||
                      item.product.images?.find((i) => i.mediaType !== "video")?.url ||
                      "/images/placeholder.jpg"
                    }
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">
                    {item.product.name}
                  </p>
                  {item.selectedVariants &&
                    Object.keys(item.selectedVariants).length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {Object.entries(item.selectedVariants).map(([k, v]) => (
                          <span key={k} className="mr-2">
                            {k}: {v}
                          </span>
                        ))}
                      </p>
                    )}
                  <p className="text-sm text-gray-500">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
                <p className="font-semibold text-gray-800">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>
                {formatPrice(
                  order.items.reduce((s, i) => s + i.price * i.quantity, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Envío</span>
              <span>
                {order.shipping === 0 ? "Gratis" : formatPrice(order.shipping)}
              </span>
            </div>
            {order.promoCode && (
              <div className="flex justify-between text-gray-700">
                <span>Cupón</span>
                <span className="font-semibold">{order.promoCode}</span>
              </div>
            )}
            {order.discount != null && order.discount > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Descuento</span>
                <span className="text-green-700">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-800">
              <span>Total</span>
              <span className="text-[#6B5BB6]">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
