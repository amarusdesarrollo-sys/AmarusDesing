"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedGrid from "@/components/AnimatedGrid";
import { getCategoryBySlug } from "@/lib/firebase/categories";
import { getProductsByCategory } from "@/lib/firebase/products";
import {
  mockProducts,
  getProductsByCategory as getMockProductsByCategory,
} from "@/data/mockProducts";
import type { Product, Category } from "@/types";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    const loadCategoryAndProducts = async () => {
      try {
        setLoading(true);

        // Intentar obtener categoría desde Firestore
        const categoryData = await getCategoryBySlug(slug);

        if (categoryData) {
          // Si la categoría existe en Firestore
          setCategory(categoryData);

          // Obtener productos desde Firestore
          try {
            const firestoreProducts = await getProductsByCategory(slug);
            setProducts(firestoreProducts);
          } catch (error) {
            // Si falla, usar mock data como fallback
            console.warn(
              "Error loading products from Firestore, using mock data:",
              error
            );
            const mockProductsList = getMockProductsByCategory(slug);
            setProducts(mockProductsList);
          }
        } else {
          // Si no existe en Firestore, intentar con mock data
          // (para mantener compatibilidad con categorías existentes)
          const mockProductsList = getMockProductsByCategory(slug);

          if (mockProductsList.length > 0) {
            // Crear categoría temporal basada en el slug
            setCategory({
              id: slug,
              name: formatCategoryName(slug),
              slug: slug,
              description: `Productos de ${formatCategoryName(slug)}`,
              order: 0,
              active: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            setProducts(mockProductsList);
          } else {
            // No se encontró ni en Firestore ni en mock data
            setNotFoundState(true);
          }
        }
      } catch (error) {
        console.error("Error loading category:", error);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadCategoryAndProducts();
    }
  }, [slug]);

  // Formatear nombre de categoría desde slug
  const formatCategoryName = (slug: string): string => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6] mb-4"></div>
            <p className="text-xl text-gray-600">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFoundState || !category) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="text-center py-20">
              <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1>
              <h2 className="text-3xl font-semibold text-gray-700 mb-4">
                Categoría no encontrada
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                La categoría que buscas no existe o ha sido eliminada.
              </p>
              <Link href="/tienda-online">
                <button className="bg-[#6B5BB6] text-white px-8 py-4 text-lg font-semibold rounded-lg hover:bg-[#5B4BA5] transition-colors">
                  Volver a la Tienda
                </button>
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
        {/* Breadcrumbs */}
        <AnimatedSection>
          <nav className="text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-[#6B5BB6] transition-colors">
              Inicio
            </Link>
            <span className="mx-2">/</span>
            <Link
              href="/tienda-online"
              className="hover:text-[#6B5BB6] transition-colors"
            >
              Tienda Online
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-800 font-medium">{category.name}</span>
          </nav>
        </AnimatedSection>

        {/* Header de la categoría */}
        <AnimatedSection>
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-gray-600 mb-4">
                {category.description}
              </p>
            )}
            <p className="text-gray-600">
              {products.length}{" "}
              {products.length === 1 ? "producto" : "productos"} disponible
              {products.length !== 1 ? "s" : ""}
            </p>
          </div>
        </AnimatedSection>

        {/* Grid de productos */}
        {products.length === 0 ? (
          <AnimatedSection>
            <div className="text-center py-20">
              <p className="text-xl text-gray-600 mb-4">
                No hay productos disponibles en esta categoría.
              </p>
              <Link href="/tienda-online">
                <button className="text-[#6B5BB6] hover:text-[#5B4BA5] font-medium transition-colors">
                  Explorar otras categorías
                </button>
              </Link>
            </div>
          </AnimatedSection>
        ) : (
          <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 3}
              />
            ))}
          </AnimatedGrid>
        )}
      </div>
    </div>
  );
}
