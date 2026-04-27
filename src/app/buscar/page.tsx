import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedGrid from "@/components/AnimatedGrid";
import { Search, SlidersHorizontal } from "lucide-react";
import { getAllProducts, getProductsByCategory } from "@/lib/firebase/products";
import { getActiveCategories } from "@/lib/firebase/categories";
export const revalidate = 300;

export default async function BuscarPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    cat?: string;
    min?: string;
    max?: string;
    sort?: string;
  }>;
}) {
  const resolvedSearchParams = (await searchParams) || {};
  const q = resolvedSearchParams.q?.trim() || "";
  const cat = resolvedSearchParams.cat || "";
  const minPrice = resolvedSearchParams.min ? Number(resolvedSearchParams.min) : null;
  const maxPrice = resolvedSearchParams.max ? Number(resolvedSearchParams.max) : null;
  const sort = resolvedSearchParams.sort || "relevance";

  const categories = await getActiveCategories().catch(() => []);
  let products = cat
    ? await getProductsByCategory(cat).catch(() => getAllProducts())
    : await getAllProducts().catch(() => []);

  if (q) {
    const lower = q.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (p.description && p.description.toLowerCase().includes(lower)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(lower)))
    );
  }
  if (minPrice != null && minPrice > 0) {
    products = products.filter((p) => p.price >= minPrice * 100);
  }
  if (maxPrice != null && maxPrice > 0) {
    products = products.filter((p) => p.price <= maxPrice * 100);
  }
  if (sort === "price-asc") products = [...products].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") products = [...products].sort((a, b) => b.price - a.price);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-[#6B5BB6] transition-colors">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <Link href="/tienda-online" className="hover:text-[#6B5BB6] transition-colors">
            Tienda
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium">Buscar</span>
        </nav>

        {/* Barra de búsqueda */}
        <AnimatedSection>
          <form action="/buscar" method="GET" className="mb-8">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar productos por nombre, descripción..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[#6B5BB6] text-white rounded-lg font-medium hover:bg-[#5B4BA5] transition-colors"
              >
                Buscar
              </button>
            </div>
          </form>
        </AnimatedSection>

        {/* Filtros */}
        <AnimatedSection>
          <form
            action="/buscar"
            method="GET"
            className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-100"
          >
            <span className="flex items-center gap-2 text-gray-700 font-medium">
              <SlidersHorizontal className="h-5 w-5" />
              Filtros:
            </span>

            <div>
              <label className="sr-only">Categoría</label>
              <select
                name="cat"
                defaultValue={cat}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="sr-only">Ordenar</label>
              <select
                name="sort"
                defaultValue={sort}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              >
                <option value="relevance">Relevancia</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input type="hidden" name="q" value={q} />
              <input
                name="min"
                type="number"
                placeholder="Min €"
                min="0"
                step="0.01"
                defaultValue={minPrice ?? ""}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              />
              <span className="text-gray-500">-</span>
              <input
                name="max"
                type="number"
                placeholder="Max €"
                min="0"
                step="0.01"
                defaultValue={maxPrice ?? ""}
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

        {/* Resultados */}
        {products.length === 0 ? (
          <AnimatedSection>
            <div className="text-center py-20">
              <p className="text-xl text-gray-600 mb-4">
                {q || cat || minPrice || maxPrice
                  ? "No se encontraron productos con esos criterios."
                  : "Introduce un término de búsqueda o usa los filtros."}
              </p>
              <Link
                href="/tienda-online"
                className="text-[#6B5BB6] hover:text-[#5B4BA5] font-medium"
              >
                Ver todas las categorías
              </Link>
            </div>
          </AnimatedSection>
        ) : (
          <AnimatedSection>
            <p className="text-gray-600 mb-6">
              {products.length} {products.length === 1 ? "producto" : "productos"} encontrados
            </p>
            <AnimatedGrid className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </AnimatedGrid>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
}
