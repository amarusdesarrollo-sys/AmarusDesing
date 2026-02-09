"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { createOrder } from "@/lib/firebase/orders";
import type { OrderItem } from "@/types";

const checkoutSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email no válido"),
  telefono: z.string().min(1, "El teléfono es requerido (ej: +34 600 111 222)"),
  calle: z.string().min(1, "La dirección es requerida"),
  pisoPuerta: z.string().optional(),
  ciudad: z.string().min(1, "La ciudad es requerida"),
  codigoPostal: z.string().min(1, "El código postal es requerido"),
  pais: z.string().min(1, "El país es requerido"),
  estado: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items, getSubtotal, getShipping, getTotal, getTotalItems } =
    useCartStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      calle: "",
      pisoPuerta: "",
      ciudad: "",
      codigoPostal: "",
      pais: "ES",
      estado: "",
    },
  });

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const total = getTotal();
  const totalItems = getTotalItems();

  const formatPrice = (cents: number) => (cents / 100).toFixed(2);

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/carrito");
    }
  }, [items.length, router]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const orderItems: OrderItem[] = items.map((item) => ({
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        price: item.product.price,
      }));
      const orderId = await createOrder({
        customerName: `${data.nombre.trim()} ${data.apellido.trim()}`.trim(),
        customerGivenName: data.nombre.trim(),
        customerFamilyName: data.apellido.trim(),
        customerEmail: data.email.trim(),
        customerPhone: data.telefono.trim(),
        shippingOptionName: "Envío estándar",
        items: orderItems,
        total,
        shipping,
        tax: 0,
        paymentMethod: "pending",
        shippingAddress: {
          street: data.calle.trim(),
          street2: data.pisoPuerta?.trim() || undefined,
          city: data.ciudad.trim(),
          postalCode: data.codigoPostal.trim(),
          country: data.pais.trim(),
          state: data.estado?.trim() || undefined,
        },
      });
      // Redirigir primero; el carrito se vacía en la página de confirmación.
      // Si vaciáramos aquí, el useEffect de esta página nos mandaría a /carrito.
      router.push(`/checkout/confirmacion?orderId=${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">
          Redirigiendo al carrito...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/carrito"
          className="inline-flex items-center text-[#6B5BB6] hover:text-[#5B4BA5] mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver al carrito
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Checkout
        </h1>
        <p className="text-gray-600 mb-8">
          Completa tus datos para finalizar el pedido
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Formulario de envío */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8 space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Datos de contacto y envío
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    {...register("nombre")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                    placeholder="Tu nombre"
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.nombre.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    {...register("apellido")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                    placeholder="Tu apellido"
                  />
                  {errors.apellido && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.apellido.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                  placeholder="tu@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  {...register("telefono")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                  placeholder="+34 600 111 222"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Con prefijo internacional (recomendado +34 para España)
                </p>
                {errors.telefono && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.telefono.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calle y número *
                </label>
                <input
                  {...register("calle")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                  placeholder="Calle Mayor 123"
                />
                {errors.calle && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.calle.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Piso / puerta / bloque
                </label>
                <input
                  {...register("pisoPuerta")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                  placeholder="3º B (opcional)"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    {...register("ciudad")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                    placeholder="Ciudad"
                  />
                  {errors.ciudad && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.ciudad.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código postal *
                  </label>
                  <input
                    {...register("codigoPostal")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                    placeholder="CP"
                  />
                  {errors.codigoPostal && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.codigoPostal.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País *
                  </label>
                  <select
                    {...register("pais")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                  >
                    <option value="ES">España</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia
                  </label>
                  <input
                    {...register("estado")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                    placeholder="Ej: Madrid (opcional)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Resumen del pedido
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
              </p>
              <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100">
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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm line-clamp-2">
                        {item.product.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {item.quantity} × €{formatPrice(item.product.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">
                      €{formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>€{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Envío</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600">Gratis</span>
                    ) : (
                      `€${formatPrice(shipping)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-800 pt-2">
                  <span>Total</span>
                  <span className="text-[#6B5BB6]">€{formatPrice(total)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-[#6B5BB6] text-white py-4 rounded-lg font-semibold hover:bg-[#5B4BA5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Procesando..." : "Confirmar pedido"}
              </button>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Al confirmar, tu pedido quedará registrado. Te contactaremos
                para el pago y el envío.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
