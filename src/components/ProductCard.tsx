"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Heart, Check } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import {
  getProductImageUrl,
  isCloudinaryUrl,
  isDirectMediaUrl,
  extractPublicIdFromUrl,
} from "@/lib/cloudinary";
import type { Product } from "@/types";
import {
  productRequiresPurchaseSelection,
  productHasAnyStock,
  totalSellableStock,
} from "@/lib/product-purchase-options";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({
  product,
  priority = false,
}: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const [added, setAdded] = useState(false);
  const hasStock = product.inStock && productHasAnyStock(product);
  const totalStock = totalSellableStock(product);
  const needsOptions = productRequiresPurchaseSelection(product);
  const primaryMedia =
    product.images.find((img) => img.isPrimary && img.mediaType !== "video") ||
    product.images.find((img) => img.mediaType !== "video");

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const getImageUrl = (image: { url: string; publicId?: string }) => {
    if (image.publicId) {
      return getProductImageUrl(image.publicId, "medium", image.url);
    }

    if (isCloudinaryUrl(image.url)) {
      const publicId = extractPublicIdFromUrl(image.url);
      if (publicId) {
        return getProductImageUrl(publicId, "medium", image.url);
      }
    }

    return image.url;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasStock) return;
    if (needsOptions) {
      router.push(`/productos/${product.id}`);
      return;
    }
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const primaryImageSrc = primaryMedia
    ? getImageUrl(primaryMedia)
    : "/images/placeholder.jpg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="group h-full"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-md touch-manipulation">
        <Link
          href={`/productos/${product.id}`}
          className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-[#6B5BB6] focus-visible:ring-inset"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
            <Image
              src={primaryImageSrc}
              alt={primaryMedia?.alt || product.name}
              fill
              className="object-cover transition-transform duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-110"
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized={isDirectMediaUrl(primaryImageSrc)}
            />

            {product.featured && (
              <span className="absolute top-2 left-2 rounded-full bg-[#6B5BB6] px-2 py-1 text-xs font-semibold text-white">
                Destacado
              </span>
            )}
            {!hasStock && (
              <span className="absolute top-2 right-2 rounded-full bg-gray-500 px-2 py-1 text-xs font-semibold text-white">
                Agotado
              </span>
            )}
            {hasStock && totalStock > 0 && totalStock <= 5 && (
              <span className="absolute top-2 right-2 rounded-full bg-amber-500 px-2 py-1 text-xs font-semibold text-white">
                Solo quedan {totalStock}
              </span>
            )}
            {product.originalPrice && (
              <span className="absolute bottom-2 left-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col p-3">
            <h3 className="mb-1 line-clamp-2 text-base font-semibold text-gray-800 transition-colors [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-[#6B5BB6] md:text-lg">
              {product.name}
            </h3>

            <p className="mb-2 line-clamp-2 flex-1 text-xs text-gray-600">
              {product.description}
            </p>

            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl font-bold text-[#6B5BB6]">
                €{formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-base text-gray-400 line-through">
                  €{formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>
        </Link>

        <div className="flex gap-1.5 px-3 pb-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!hasStock}
            aria-label={
              hasStock
                ? needsOptions
                  ? `Elegir opciones para ${product.name}`
                  : added
                    ? `${product.name} agregado al carrito`
                    : `Agregar ${product.name} al carrito`
                : `${product.name} agotado`
            }
            className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              hasStock
                ? added && !needsOptions
                  ? "bg-green-600 text-white"
                  : "bg-[#6B5BB6] text-white active:bg-[#5B4BA5] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#5B4BA5]"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
            }`}
          >
            {added && !needsOptions ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            {hasStock
              ? needsOptions
                ? "Elegir opciones"
                : added
                  ? "Agregado"
                  : "Agregar"
              : "Agotado"}
          </button>

          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border-2 border-gray-300 p-2 transition-colors active:border-[#6B5BB6] active:text-[#6B5BB6] [@media(hover:hover)_and_(pointer:fine)]:hover:border-[#6B5BB6] [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#6B5BB6]"
            aria-label={`Agregar ${product.name} a favoritos`}
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>

        {added && (
          <div className="px-3 pb-3 text-xs text-green-700">
            Producto agregado ({totalItems} en carrito).{" "}
            <Link
              href="/carrito"
              className="font-semibold underline underline-offset-2 hover:text-green-800"
            >
              Ver carrito
            </Link>
          </div>
        )}
      </article>
    </motion.div>
  );
}
