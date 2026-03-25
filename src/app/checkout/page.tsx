"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firebase/users";
import { useCartStore } from "@/store/cartStore";
import { createOrder } from "@/lib/firebase/orders";
import { validateOrderStock } from "@/lib/firebase/products";
import { checkoutCustomerSchema, type CheckoutCustomerFormData } from "@/lib/validations/schemas";
import type { OrderItem } from "@/types";
import { getCouponByCode } from "@/lib/firebase/coupons";
import { CHECKOUT_COUNTRY_SELECT_GROUPS } from "@/lib/checkout-country-options";

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const { items, getSubtotal, getShippingForZone, getTotalItems } =
    useCartStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<CheckoutCustomerFormData>({
    resolver: zodResolver(checkoutCustomerSchema),
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
  // Determinar zona de envío según la dirección introducida
  const watchPais = watch("pais");
  const watchProvincia = watch("estado");
  const watchCP = watch("codigoPostal");

  const getZoneKey = (): "spainPeninsula" | "canarias" | "europe" | "world" => {
    const country = (watchPais || "ES").toString().toUpperCase();
    const province = (watchProvincia || "").toLowerCase();
    const cp = (watchCP || "").trim();

    // Canarias por provincia o por código postal 35xxx / 38xxx
    if (
      country === "ES" &&
      (province.includes("palmas") ||
        province.includes("tenerife") ||
        cp.startsWith("35") ||
        cp.startsWith("38"))
    ) {
      return "canarias";
    }

    // España peninsular (cualquier otra provincia de ES)
    if (country === "ES") {
      return "spainPeninsula";
    }

    // Europa (lista ampliada de países de la UE / EEE)
    const europeCountries = [
      "PT",
      "FR",
      "DE",
      "IT",
      "BE",
      "NL",
      "LU",
      "AT",
      "IE",
      "DK",
      "SE",
      "NO",
      "FI",
      "PL",
      "CZ",
      "SK",
      "HU",
      "RO",
      "BG",
      "GR",
      "SI",
      "HR",
      "EE",
      "LV",
      "LT",
      "CY",
      "MT",
    ];
    if (europeCountries.includes(country)) {
      return "europe";
    }

    // Resto del mundo
    return "world";
  };

  const zoneKey = getZoneKey();
  const shipping = getShippingForZone(zoneKey);
  const discount = appliedPromo?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + shipping;
  const totalItems = getTotalItems();

  const formatPrice = (cents: number) => (cents / 100).toFixed(2);

  const calculateDiscount = useMemo(() => {
    return (coupon: any): number => {
      if (!coupon?.active) return 0;
      const eligibleItems = items.filter((i) => {
        if (coupon.scope === "product") {
          return Array.isArray(coupon.productIds) && coupon.productIds.includes(i.productId);
        }
        if (coupon.scope === "category") {
          return Array.isArray(coupon.categorySlugs) && coupon.categorySlugs.includes(i.product.category);
        }
        return false;
      });
      const eligibleSubtotal = eligibleItems.reduce(
        (sum, i) => sum + i.product.price * i.quantity,
        0
      );
      if (eligibleSubtotal <= 0) return 0;
      if (coupon.discountType === "percent") {
        const pct = Math.min(99, Math.max(0, Number(coupon.value) || 0));
        return Math.round((eligibleSubtotal * pct) / 100);
      }
      // fixed
      const fixed = Math.max(0, Number(coupon.value) || 0);
      return Math.min(eligibleSubtotal, fixed);
    };
  }, [items]);

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/carrito");
    }
  }, [items.length, router]);

  // Si el usuario está logueado, rellenar con perfil y dirección por defecto (Klarna)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      getUserProfile(user.uid).then((profile) => {
        if (!profile) return;
        const defaultShipping =
          profile.addresses?.find((a) => a.type === "shipping" && a.isDefault) ??
          profile.addresses?.find((a) => a.type === "shipping") ??
          profile.addresses?.[0];
        reset({
          nombre: profile.firstName || "",
          apellido: profile.lastName || "",
          email: profile.email || user.email || "",
          telefono: profile.phone || "",
          calle: defaultShipping?.street ?? "",
          pisoPuerta: defaultShipping?.street2 ?? "",
          ciudad: defaultShipping?.city ?? "",
          codigoPostal: defaultShipping?.postalCode ?? "",
          pais: (defaultShipping?.country ?? "ES").toString().toUpperCase().slice(0, 2),
          estado: defaultShipping?.region ?? "",
        });
      });
    });
    return () => unsubscribe();
  }, [reset]);

  const onSubmit = async (data: CheckoutCustomerFormData) => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const orderItemsForValidation = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
      const { valid, invalidItems } = await validateOrderStock(
        orderItemsForValidation
      );
      if (!valid && invalidItems?.length) {
        const msg = invalidItems
          .map(
            (i) =>
              `${i.name}: pedido ${i.requested}, disponible ${i.available}`
          )
          .join(". ");
        setError(`Stock insuficiente: ${msg}`);
        setLoading(false);
        return;
      }

      const orderItems: OrderItem[] = items.map((item) => ({
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        price: item.product.price,
      }));
      const user = auth.currentUser;
      const orderId = await createOrder({
        userId: user?.uid,
        customerName: `${data.nombre.trim()} ${data.apellido.trim()}`.trim(),
        customerGivenName: data.nombre.trim(),
        customerFamilyName: data.apellido.trim(),
        customerEmail: data.email.trim(),
        customerPhone: data.telefono.trim(),
        shippingOptionName: "Envío estándar",
        items: orderItems,
        discount,
        promoCode: appliedPromo?.code,
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

      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, baseUrl }),
      });
      const text = await res.text();
      let json: { url?: string; error?: string } = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        setError("Error inesperado del servidor. Intenta de nuevo.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error(json.error || "Error al crear sesión de pago");
      }
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      throw new Error("No se recibió URL de pago");
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
                    {CHECKOUT_COUNTRY_SELECT_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                            {o.value !== "OTHER" ? ` (${o.value})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Si tu país no aparece, elige &quot;Otro país&quot;. Se aplicará la tarifa Internacional.
                  </p>
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
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código promocional
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 border rounded-lg"
                      placeholder="AMARUS10"
                    />
                    <button
                      type="button"
                      disabled={promoLoading}
                      onClick={async () => {
                        const c = promoCode.trim().toUpperCase();
                        if (!c) return;
                        setPromoLoading(true);
                        try {
                          const coupon = await getCouponByCode(c);
                          if (!coupon || !coupon.active) {
                            setAppliedPromo(null);
                            alert("Cupón no válido");
                            return;
                          }
                          const disc = calculateDiscount(coupon);
                          if (disc <= 0) {
                            setAppliedPromo(null);
                            alert("Este cupón no aplica a los productos del carrito");
                            return;
                          }
                          setAppliedPromo({ code: coupon.code, discount: disc });
                        } finally {
                          setPromoLoading(false);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {promoLoading ? "..." : "Aplicar"}
                    </button>
                  </div>
                  {appliedPromo && (
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-green-700">
                        Cupón aplicado: <strong>{appliedPromo.code}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedPromo(null);
                          setPromoCode("");
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
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
                {discount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Descuento</span>
                    <span className="text-green-700">-€{formatPrice(discount)}</span>
                  </div>
                )}
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
                {loading ? "Procesando…" : "Ir a pagar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
