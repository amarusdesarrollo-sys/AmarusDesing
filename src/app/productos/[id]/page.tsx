"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Heart,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Package,
  Ruler,
  Weight,
  User,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { getProductById, getProductsByCategory } from "@/lib/firebase/products";
import { getCategoryBySlug } from "@/lib/firebase/categories";
import ProductCard from "@/components/ProductCard";
import AnimatedSection from "@/components/AnimatedSection";
import {
  getProductImageUrl,
  isCloudinaryUrl,
  extractPublicIdFromUrl,
} from "@/lib/cloudinary";
import type { Product, Category } from "@/types";
import { mockProducts } from "@/data/mockProducts";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);

        // Intentar obtener producto desde Firebase
        let productData = await getProductById(productId);

        // Si no existe en Firebase, buscar en mock data
        if (!productData) {
          productData = mockProducts.find((p) => p.id === productId) || null;
        }

        if (!productData) {
          setNotFoundState(true);
          return;
        }

        setProduct(productData);

        // Cargar categoría
        if (productData.category) {
          try {
            const categoryData = await getCategoryBySlug(productData.category);
            setCategory(categoryData);
          } catch (error) {
            console.warn("Error loading category:", error);
          }
        }

        // Cargar productos relacionados (misma categoría, excluyendo el actual)
        try {
          const related = await getProductsByCategory(productData.category);
          const filtered = related
            .filter((p) => p.id !== productId)
            .slice(0, 4);
          setRelatedProducts(filtered);
        } catch (error) {
          console.warn("Error loading related products:", error);
          // Fallback a mock data
          const mockRelated = mockProducts
            .filter(
              (p) => p.category === productData.category && p.id !== productId
            )
            .slice(0, 4);
          setRelatedProducts(mockRelated);
        }
      } catch (error) {
        console.error("Error loading product:", error);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  // Función helper para obtener URL de imagen optimizada
  const getImageUrl = (
    image: { url: string; publicId?: string },
    size: "large" | "medium" | "small" | "thumbnail" = "large"
  ) => {
    // Si tiene publicId, usar función optimizada de Cloudinary
    if (image.publicId) {
      return getProductImageUrl(image.publicId, size, image.url);
    }

    // Si la URL ya es de Cloudinary, intentar extraer publicId
    if (isCloudinaryUrl(image.url)) {
      const publicId = extractPublicIdFromUrl(image.url);
      if (publicId) {
        return getProductImageUrl(publicId, size, image.url);
      }
    }

    // Fallback a URL directa
    return image.url;
  };

  const hasStock = product && product.inStock && (product.stock ?? 0) > 0;

  const handleAddToCart = () => {
    if (!product || !hasStock) return;

    addItem(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const increaseQuantity = () => {
    const maxQty = product?.stock ?? 0;
    if (product && quantity < maxQty) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const previousImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImageIndex(
        (prev) => (prev - 1 + product.images.length) % product.images.length
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6B5BB6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (notFoundState || !product) {
    notFound();
  }

  const selectedImage = product.images[selectedImageIndex] || product.images[0];
  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#6B5BB6] transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link
              href="/tienda-online"
              className="hover:text-[#6B5BB6] transition-colors"
            >
              Tienda
            </Link>
            {category && (
              <>
                <span>/</span>
                <Link
                  href={`/categorias/${category.slug}`}
                  className="hover:text-[#6B5BB6] transition-colors"
                >
                  {category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Galería de imágenes */}
          <AnimatedSection className="space-y-4">
            {/* Imagen principal */}
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
              {product.images.length > 0 ? (
                <>
                  <Image
                    src={
                      selectedImage
                        ? getImageUrl(selectedImage, "large")
                        : primaryImage
                        ? getImageUrl(primaryImage, "large")
                        : "/images/placeholder.jpg"
                    }
                    alt={selectedImage?.alt || product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    unoptimized={isCloudinaryUrl(
                      selectedImage?.url || primaryImage?.url || ""
                    )}
                  />

                  {/* Navegación de imágenes si hay más de una */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={previousImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all z-10"
                        aria-label="Imagen anterior"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all z-10"
                        aria-label="Siguiente imagen"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>

                      {/* Indicador de imagen */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {selectedImageIndex + 1} / {product.images.length}
                      </div>
                    </>
                  )}

                  {/* Badges */}
                  {product.featured && (
                    <span className="absolute top-4 left-4 bg-[#6B5BB6] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Destacado
                    </span>
                  )}
                  {!hasStock && (
                    <span className="absolute top-4 right-4 bg-gray-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Agotado
                    </span>
                  )}
                  {product.originalPrice && (
                    <span className="absolute bottom-4 right-4 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      -
                      {Math.round(
                        (1 - product.price / product.originalPrice) * 100
                      )}
                      %
                    </span>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <div className="text-sm">Sin imagen</div>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-[#6B5BB6] ring-2 ring-[#6B5BB6] ring-offset-2"
                        : "border-gray-200 hover:border-[#6B5BB6]"
                    }`}
                  >
                    <Image
                      src={getImageUrl(image, "thumbnail")}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 12vw"
                      unoptimized={isCloudinaryUrl(image.url)}
                    />
                  </button>
                ))}
              </div>
            )}
          </AnimatedSection>

          {/* Información del producto */}
          <AnimatedSection delay={0.1}>
            <div className="space-y-6">
              {/* Título y categoría */}
              <div>
                {category && (
                  <Link
                    href={`/categorias/${category.slug}`}
                    className="text-[#6B5BB6] hover:text-[#5B4BA5] text-sm font-medium mb-2 inline-block transition-colors"
                  >
                    {category.name}
                  </Link>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
              </div>

              {/* Precio */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-[#6B5BB6]">
                  €{formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-2xl text-gray-400 line-through">
                    €{formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Descripción
                </h2>
                <div
                  className={`text-gray-600 leading-relaxed ${
                    descriptionExpanded ? "" : "line-clamp-3"
                  }`}
                >
                  {product.description}
                </div>
                {product.description.length > 150 && (
                  <button
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                    className="text-[#6B5BB6] hover:text-[#5B4BA5] font-medium text-sm transition-colors"
                  >
                    {descriptionExpanded ? "Ver menos" : "Ver más"}
                  </button>
                )}
              </div>

              {/* Información adicional */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                {product.materials && product.materials.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Package className="h-5 w-5 text-[#6B5BB6] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Materiales
                      </p>
                      <p className="text-sm text-gray-600">
                        {product.materials.join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {product.dimensions && (
                  <div className="flex items-start gap-2">
                    <Ruler className="h-5 w-5 text-[#6B5BB6] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Dimensiones
                      </p>
                      <p className="text-sm text-gray-600">
                        {product.dimensions}
                      </p>
                    </div>
                  </div>
                )}

                {product.weight && (
                  <div className="flex items-start gap-2">
                    <Weight className="h-5 w-5 text-[#6B5BB6] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Peso</p>
                      <p className="text-sm text-gray-600">
                        {product.weight} g
                      </p>
                    </div>
                  </div>
                )}

                {product.artisan && (
                  <div className="flex items-start gap-2">
                    <User className="h-5 w-5 text-[#6B5BB6] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Artesano
                      </p>
                      <p className="text-sm text-gray-600">
                        {product.artisan.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {hasStock ? (
                    <span className="text-green-600 font-medium">
                      ✓ Solo quedan {(product.stock ?? 0)} unidades
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ Agotado</span>
                  )}
                </p>
              </div>

              {/* Selector de cantidad y agregar al carrito */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-900">
                    Cantidad:
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 min-w-[60px] text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={increaseQuantity}
                      disabled={!hasStock || quantity >= (product.stock ?? 0)}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={handleAddToCart}
                    disabled={!hasStock}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                      hasStock
                        ? addedToCart
                          ? "bg-green-500 text-white"
                          : "bg-[#6B5BB6] text-white hover:bg-[#5B4BA5]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="h-5 w-5" />
                        Agregado
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        {hasStock ? "Agregar al carrito" : "Agotado"}
                      </>
                    )}
                  </motion.button>

                  <button
                    className="p-4 border-2 border-gray-300 rounded-lg hover:border-[#6B5BB6] hover:text-[#6B5BB6] transition-colors"
                    aria-label="Agregar a favoritos"
                  >
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>

        {/* Productos relacionados */}
        {relatedProducts.length > 0 && (
          <AnimatedSection delay={0.2} className="mt-16">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Productos relacionados
                </h2>
                {category && (
                  <Link
                    href={`/categorias/${category.slug}`}
                    className="text-[#6B5BB6] hover:text-[#5B4BA5] font-medium flex items-center gap-2 transition-colors"
                  >
                    Ver todos
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                  />
                ))}
              </div>
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
}
