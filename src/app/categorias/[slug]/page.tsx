import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedGrid from "@/components/AnimatedGrid";
import { SlidersHorizontal } from "lucide-react";
import { getCategoryBySlug } from "@/lib/firebase/categories";
import { getProductsByCategory } from "@/lib/firebase/products";
import {
  getProductsByCategory as getMockProductsByCategory,
} from "@/data/mockProducts";
import type { Product } from "@/types";
export const revalidate = 300;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    sort?: "relevance" | "price-asc" | "price-desc";
    min?: string;
    max?: string;
    sub?: string;
  }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const slug = resolvedParams.slug;
  const sort = resolvedSearchParams.sort || "relevance";
  const minPrice = resolvedSearchParams.min || "";
  const maxPrice = resolvedSearchParams.max || "";
  const subcategory = resolvedSearchParams.sub || "";

  const formatCategoryName = (slug: string): string => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  let category = await getCategoryBySlug(slug).catch(() => null);
  let products = await getProductsByCategory(slug).catch(() => [] as Product[]);

  if (!category && products.length === 0) {
    const mockProductsList = getMockProductsByCategory(slug);
    if (mockProductsList.length > 0) {
      category = {
        id: slug,
        name: formatCategoryName(slug),
        slug,
        description: `Productos de ${formatCategoryName(slug)}`,
        order: 0,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      products = mockProductsList;
    }
  }
  if (!category) notFound();

  let filteredProducts = [...products];
  const min = minPrice ? Number(minPrice) * 100 : null;
  const max = maxPrice ? Number(maxPrice) * 100 : null;
  if (min != null && !Number.isNaN(min)) filteredProducts = filteredProducts.filter((p) => p.price >= min);
  if (max != null && !Number.isNaN(max)) filteredProducts = filteredProducts.filter((p) => p.price <= max);
  if (subcategory) filteredProducts = filteredProducts.filter((p) => (p.subcategory || "") === subcategory);
  if (sort === "price-asc") filteredProducts.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") filteredProducts.sort((a, b) => b.price - a.price);

  const subcategoryOptions = Array.from(new Set(products.map((p) => p.subcategory).filter(Boolean) as string[]))
    .sort((a, b) => a.localeCompare(b));

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
              {filteredProducts.length}{" "}
              {products.length === 1 ? "producto" : "productos"} disponible
              {products.length !== 1 ? "s" : ""}
            </p>
          </div>
        </AnimatedSection>

        {/* Filtros */}
        <AnimatedSection>
          <form
            action={`/categorias/${slug}`}
            method="GET"
            className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-100"
          >
            <span className="flex items-center gap-2 text-gray-700 font-medium">
              <SlidersHorizontal className="h-5 w-5" />
              Filtros:
            </span>
            <select
              name="sort"
              defaultValue={sort}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
            >
              <option value="relevance">Relevancia</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
            </select>
            <select
              name="sub"
              defaultValue={subcategory}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              disabled={subcategoryOptions.length === 0}
              title={subcategoryOptions.length === 0 ? "No hay subcategorías en esta categoría" : "Filtrar por subcategoría"}
            >
              <option value="">
                {subcategoryOptions.length === 0 ? "Sin subcategorías" : "Todas las subcategorías"}
              </option>
              {subcategoryOptions.map((s) => (
                <option key={s} value={s}>
                  {formatCategoryName(s)}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                name="min"
                type="number"
                placeholder="Min €"
                min="0"
                step="0.01"
                defaultValue={minPrice}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              />
              <span className="text-gray-500">-</span>
              <input
                name="max"
                type="number"
                placeholder="Max €"
                min="0"
                step="0.01"
                defaultValue={maxPrice}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              />
              <button
                type="submit"
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Aplicar
              </button>
            </div>
          </form>
        </AnimatedSection>

        {/* Grid de productos */}
        {filteredProducts.length === 0 ? (
          <AnimatedSection>
            <div className="text-center py-20">
              <p className="text-xl text-gray-600 mb-4">
                {products.length === 0
                ? "No hay productos disponibles en esta categoría."
                : "No hay productos que coincidan con los filtros."}
              </p>
              <Link href="/tienda-online">
                <button className="text-[#6B5BB6] hover:text-[#5B4BA5] font-medium transition-colors">
                  Explorar otras categorías
                </button>
              </Link>
            </div>
          </AnimatedSection>
        ) : (
          <AnimatedGrid className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {filteredProducts.map((product, index) => (
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
