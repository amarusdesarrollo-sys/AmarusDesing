"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, ArrowRight } from "lucide-react";
import { getOrderById } from "@/lib/firebase/orders";
import { useCartStore } from "@/store/cartStore";
import type { Order } from "@/types";

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(!!orderId);
  const [notFound, setNotFound] = useState(false);
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    getOrderById(orderId)
      .then((o) => {
        setOrder(o ?? null);
        setNotFound(!o);
        if (o) clearCart(); // Vaciar carrito solo cuando el pedido se cargó bien
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [orderId, clearCart]);

  const formatPrice = (cents: number) => (cents / 100).toFixed(2);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando tu pedido...</div>
      </div>
    );
  }

  if (!orderId || notFound || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            No encontramos tu pedido
          </h1>
          <p className="text-gray-600 mb-6">
            El enlace puede haber expirado o el número de pedido no es correcto.
          </p>
          <Link
            href="/tienda-online"
            className="inline-flex items-center gap-2 text-[#6B5BB6] hover:text-[#5B4BA5] font-medium"
          >
            Ir a la tienda
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Pedido recibido!
          </h1>
          <p className="text-gray-600 mb-6">
            Gracias por tu compra. Te hemos enviado los detalles a{" "}
            <strong>{order.customerEmail}</strong>.
          </p>
          <p className="text-lg font-semibold text-[#6B5BB6]">
            Número de pedido: <span className="font-mono">{order.id}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Guarda este número para cualquier consulta
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Resumen del pedido
          </h2>
          <div className="space-y-3 mb-6">
            {order.items.map((item) => (
              <div
                key={`${item.productId}-${item.quantity}`}
                className="flex gap-4 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                  <Image
                    src={
                      item.product.images.find((i) => i.isPrimary)?.url ||
                      item.product.images[0]?.url ||
                      "/images/placeholder.jpg"
                    }
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-gray-800">
                    {item.product.name}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Cantidad: {item.quantity} · €{formatPrice(item.price)}/u
                  </p>
                </div>
                <p className="font-semibold text-gray-800">
                  €{formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>
                €
                {formatPrice(
                  order.items.reduce((s, i) => s + i.price * i.quantity, 0)
                )}
              </span>
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
              <span className="text-[#6B5BB6]">
                €{formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-left">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            Dirección de envío
          </h2>
          <p className="text-gray-700">
            {order.customerName}
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
            <p className="text-gray-600 text-sm mt-2">
              Tel: {order.customerPhone}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/tienda-online"
            className="inline-flex items-center justify-center gap-2 bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5B4BA5] transition-colors"
          >
            Seguir comprando
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center text-[#6B5BB6] hover:text-[#5B4BA5] font-medium"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Cargando...</div>
        </div>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  );
}
