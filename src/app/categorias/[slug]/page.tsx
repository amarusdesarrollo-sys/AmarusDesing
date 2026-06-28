import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedGrid from "@/components/AnimatedGrid";
import { SlidersHorizontal, Search } from "lucide-react";
import {
  getCategoryById,
  getCategoryBySlugUnfiltered,
  getSubcategories,
} from "@/lib/firebase/categories";
import { getProductsByCategory } from "@/lib/firebase/products";
import { getProductImageUrl } from "@/lib/cloudinary";
import {
  getProductsByCategory as getMockProductsByCategory,
} from "@/data/mockProducts";
import type { Category, Product } from "@/types";
export const revalidate = 300;

function normalizeSubSlug(s: string | undefined): string {
  return (s || "").trim().toLowerCase();
}

function resolveSubFromQuery(queryRaw: string, optionSlugs: string[]): string {
  const q = normalizeSubSlug(queryRaw);
  if (!q) return "";
  const hit = optionSlugs.find((s) => normalizeSubSlug(s) === q);
  return hit ?? "";
}

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
  const subcategoryQuery = (resolvedSearchParams.sub || "").trim();

  const formatCategoryName = (slug: string): string => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const record = await getCategoryBySlugUnfiltered(slug).catch(() => null);

  if (record?.active && record.parentId) {
    const parentCategory = await getCategoryById(record.parentId).catch(() => null);
    if (parentCategory?.active) {
      redirect(
        `/categorias/${parentCategory.slug}?sub=${encodeURIComponent(record.slug)}`
      );
    }
    notFound();
  }

  let category = record;
  let products = await getProductsByCategory(slug).catch(() => [] as Product[]);

  if (!category || !category.active) {
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
  if (!category || !category.active) notFound();

  let subcategoryOptions: string[] = [];
  let activeSubcategories: Category[] = [];

  if (category.id) {
    activeSubcategories = await getSubcategories(category.id).catch(() => []);
    activeSubcategories = activeSubcategories
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    subcategoryOptions = activeSubcategories.map((s) => s.slug);
  }

  const selectedSubcategory = resolveSubFromQuery(subcategoryQuery, subcategoryOptions);

  let filteredProducts = [...products];
  const min = minPrice ? Number(minPrice) * 100 : null;
  const max = maxPrice ? Number(maxPrice) * 100 : null;
  if (min != null && !Number.isNaN(min)) filteredProducts = filteredProducts.filter((p) => p.price >= min);
  if (max != null && !Number.isNaN(max)) filteredProducts = filteredProducts.filter((p) => p.price <= max);
  if (selectedSubcategory) {
    filteredProducts = filteredProducts.filter(
      (p) => normalizeSubSlug(p.subcategory) === normalizeSubSlug(selectedSubcategory)
    );
  }
  if (sort === "price-asc") filteredProducts.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") filteredProducts.sort((a, b) => b.price - a.price);

  const selectedSubcategoryData = selectedSubcategory
    ? activeSubcategories.find((s) => s.slug === selectedSubcategory)
    : undefined;
  const headerDescription =
    selectedSubcategoryData?.description?.trim() || category.description;

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
            <Link
              href={`/categorias/${category.slug}`}
              className="hover:text-[#6B5BB6] transition-colors"
            >
              {category.name}
            </Link>
            {selectedSubcategory ? (
              <>
                <span className="mx-2">/</span>
                <span className="text-gray-800 font-medium">
                  {activeSubcategories.find((s) => s.slug === selectedSubcategory)?.name ||
                    formatCategoryName(selectedSubcategory)}
                </span>
              </>
            ) : null}
          </nav>
        </AnimatedSection>

        {/* Header de la categoría */}
        <AnimatedSection>
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              {selectedSubcategory
                ? activeSubcategories.find((s) => s.slug === selectedSubcategory)?.name ||
                  formatCategoryName(selectedSubcategory)
                : category.name}
            </h1>
            {selectedSubcategory ? (
              <p className="text-sm text-gray-500 mb-2">
                Categoría:{" "}
                <Link
                  href={`/categorias/${category.slug}`}
                  className="font-medium text-[#6B5BB6] hover:text-[#5B4BA5]"
                >
                  {category.name}
                </Link>
              </p>
            ) : null}
            {headerDescription ? (
              <p className="text-lg text-gray-600 mb-4 whitespace-pre-line">
                {headerDescription}
              </p>
            ) : null}
            <p className="text-gray-600">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "producto" : "productos"} disponible
              {filteredProducts.length !== 1 ? "s" : ""}
              {selectedSubcategory && products.length !== filteredProducts.length ? (
                <span className="text-gray-500"> (filtrado)</span>
              ) : null}
            </p>
          </div>
        </AnimatedSection>

        {/* Solo en vista general de la categoría; al elegir una sub (?sub=) se oculta y se muestran los productos filtrados */}
        {activeSubcategories.length > 0 && !selectedSubcategory && (
          <AnimatedSection>
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Subcategorías
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {activeSubcategories.map((sub, index) => {
                  const imgSrc =
                    sub.imageUrl ||
                    (sub.image ? getProductImageUrl(sub.image, "medium") : "");
                  return (
                    <Link
                      key={sub.id}
                      href={`/categorias/${category.slug}?sub=${encodeURIComponent(sub.slug)}`}
                      className="group flex touch-manipulation flex-col items-center text-center"
                    >
                      <div className="relative mx-auto mb-2 aspect-square w-full max-w-[9.5rem] overflow-hidden rounded-full border-2 border-white bg-[#E5D9F2] shadow-md transition-transform duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.03] [@media(hover:hover)_and_(pointer:fine)]:group-hover:border-[#6B5BB6]/40">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt=""
                            className="h-full w-full object-cover"
                            loading={index < 5 ? "eager" : "lazy"}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl text-[#6B5BB6]/35">
                            ✿
                          </div>
                        )}
                      </div>
                      <span className="line-clamp-2 text-sm font-medium text-gray-800 transition-colors [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-[#6B5BB6]">
                        {sub.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Búsqueda (ancho completo) + filtros */}
        <AnimatedSection>
          <div className="mb-8 flex flex-col gap-4">
            <form
              action="/buscar"
              method="GET"
              className="w-full rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
            >
              <input type="hidden" name="cat" value={category.slug} />
              <label htmlFor="category-search-q" className="sr-only">
                Buscar productos en {category.name}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                    aria-hidden
                  />
                  <input
                    id="category-search-q"
                    type="search"
                    name="q"
                    placeholder={`Buscar en ${category.name}…`}
                    className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[#6B5BB6]"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-[#6B5BB6] px-6 py-3 font-medium text-white transition-colors hover:bg-[#5B4BA5] sm:self-stretch"
                >
                  Buscar
                </button>
              </div>
            </form>

          <form
            action={`/categorias/${category.slug}`}
            method="GET"
            className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100 w-full min-w-0"
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
              defaultValue={selectedSubcategory}
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
          </div>
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
              <Link
                href="/tienda-online"
                className="inline-block font-medium text-[#6B5BB6] transition-colors active:text-[#5B4BA5] [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#5B4BA5]"
              >
                Explorar otras categorías
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
