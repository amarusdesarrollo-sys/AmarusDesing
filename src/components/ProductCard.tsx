"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Heart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import {
  getProductImageUrl,
  isCloudinaryUrl,
  extractPublicIdFromUrl,
} from "@/lib/cloudinary";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({
  product,
  priority = false,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  // Función helper para obtener URL de imagen optimizada
  const getImageUrl = (image: { url: string; publicId?: string }) => {
    // Si tiene publicId, usar función optimizada de Cloudinary
    if (image.publicId) {
      return getProductImageUrl(image.publicId, "medium", image.url);
    }
    
    // Si la URL ya es de Cloudinary, intentar extraer publicId
    if (isCloudinaryUrl(image.url)) {
      const publicId = extractPublicIdFromUrl(image.url);
      if (publicId) {
        return getProductImageUrl(publicId, "medium", image.url);
      }
    }
    
    // Fallback a URL directa
    return image.url;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.inStock) {
      addItem(product, 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link
        href={`/productos/${product.id}`}
        className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col"
      >
        {/* Imagen del producto */}
        <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
          <Image
            src={
              primaryImage
                ? getImageUrl(primaryImage)
                : "/images/placeholder.jpg"
            }
            alt={primaryImage?.alt || product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized={
              primaryImage
                ? isCloudinaryUrl(primaryImage.url)
                : false
            }
          />

          {/* Badges */}
          {product.featured && (
            <span className="absolute top-2 left-2 bg-[#6B5BB6] text-white text-xs font-semibold px-2 py-1 rounded-full">
              Destacado
            </span>
          )}
          {!product.inStock && (
            <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Agotado
            </span>
          )}
          {product.originalPrice && (
            <span className="absolute bottom-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Información del producto */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 group-hover:text-[#6B5BB6] transition-colors line-clamp-2">
            {product.name}
          </h3>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
            {product.description}
          </p>

          {/* Precio */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold text-[#6B5BB6]">
              €{formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-gray-400 line-through">
                €{formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                product.inStock
                  ? "bg-[#6B5BB6] text-white hover:bg-[#5B4BA5]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              {product.inStock ? "Agregar" : "Agotado"}
            </button>

            <button
              className="p-2 border-2 border-gray-300 rounded-lg hover:border-[#6B5BB6] hover:text-[#6B5BB6] transition-colors"
              aria-label="Agregar a favoritos"
            >
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
