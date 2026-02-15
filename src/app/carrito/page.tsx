"use client";

import { useCartStore } from "@/store/cartStore";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedButton from "@/components/AnimatedButton";

export default function CarritoPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getShipping,
    getTotal,
    getTotalItems,
    shippingConfig,
  } = useCartStore();

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const total = getTotal();
  const totalItems = getTotalItems();

  // Formatear precio (convertir centavos a euros)
  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="text-center py-20">
              <ShoppingBag className="h-24 w-24 text-[#6B5BB6] mx-auto mb-6 opacity-50" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Tu carrito está vacío
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                ¡Agrega algunos productos increíbles a tu carrito!
              </p>
              <Link href="/tienda-online">
                <AnimatedButton className="bg-[#6B5BB6] text-white px-8 py-4 text-lg rounded-lg hover:bg-[#5B4BA5] transition-colors">
                  Explorar Tienda
                </AnimatedButton>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8">
            Carrito de Compras
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <AnimatedSection key={item.productId}>
                <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row gap-6">
                  {/* Imagen del producto */}
                  <div className="relative w-full md:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={
                        item.product.images.find((img) => img.isPrimary)?.url ||
                        item.product.images[0]?.url ||
                        "/images/placeholder.jpg"
                      }
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={`/productos/${item.product.id}`}>
                        <h3 className="text-xl md:text-2xl font-semibold text-gray-800 hover:text-[#6B5BB6] transition-colors mb-2">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {item.product.description}
                      </p>
                      <p className="text-2xl font-bold text-[#6B5BB6]">
                        €{formatPrice(item.product.price)}
                      </p>
                    </div>

                    {/* Controles */}
                    <div className="flex items-center justify-between mt-4">
                      {/* Selector de cantidad */}
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="p-2 hover:bg-gray-100 transition-colors rounded-l-lg"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="h-5 w-5 text-gray-700" />
                        </button>
                        <span className="px-4 py-2 text-lg font-semibold text-gray-800 min-w-[60px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          className="p-2 hover:bg-gray-100 transition-colors rounded-r-lg"
                          aria-label="Aumentar cantidad"
                          disabled={
                            !item.product.inStock ||
                            item.quantity >= item.product.stock
                          }
                        >
                          <Plus className="h-5 w-5 text-gray-700" />
                        </button>
                      </div>

                      {/* Subtotal del item */}
                      <p className="text-xl font-semibold text-gray-800">
                        €{formatPrice(item.product.price * item.quantity)}
                      </p>

                      {/* Botón eliminar */}
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}

            {/* Botón limpiar carrito */}
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Limpiar carrito
            </button>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <AnimatedSection>
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Resumen del Pedido
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">
                      €{formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Envío</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-green-600">Gratis</span>
                      ) : (
                        `€${formatPrice(shipping)}`
                      )}
                    </span>
                  </div>
                  {shipping > 0 && (() => {
                    const threshold = shippingConfig?.freeShippingThreshold ?? 0;
                    if (threshold <= 0) return null;
                    const missing = threshold - subtotal;
                    if (missing <= 0) return null;
                    return (
                      <p className="text-sm text-gray-600">
                        Falta €{formatPrice(missing)} para envío gratis
                      </p>
                    );
                  })()}
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between text-xl font-bold text-gray-800">
                      <span>Total</span>
                      <span className="text-[#6B5BB6]">
                        €{formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full bg-[#6B5BB6] text-white py-4 text-lg font-semibold rounded-lg hover:bg-[#5B4BA5] transition-colors mb-4 text-center focus:outline-none focus:ring-2 focus:ring-[#6B5BB6] focus:ring-offset-2"
                >
                  Proceder al pago
                </Link>

                <Link href="/tienda-online">
                  <button className="w-full text-[#6B5BB6] hover:text-[#5B4BA5] font-medium transition-colors">
                    Continuar comprando
                  </button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}
