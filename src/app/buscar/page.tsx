"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedGrid from "@/components/AnimatedGrid";
import { Search, SlidersHorizontal } from "lucide-react";
import { getAllProducts, getProductsByCategory } from "@/lib/firebase/products";
import { getActiveCategories } from "@/lib/firebase/categories";
import type { Product, Category } from "@/types";

function BuscarContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() || "";
  const cat = searchParams.get("cat") || "";
  const minPrice = searchParams.get("min") ? Number(searchParams.get("min")) : null;
  const maxPrice = searchParams.get("max") ? Number(searchParams.get("max")) : null;
  const sort = searchParams.get("sort") || "relevance";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let list: Product[];
        if (cat) {
          try {
            list = await getProductsByCategory(cat);
          } catch {
            list = await getAllProducts();
          }
        } else {
          list = await getAllProducts();
        }

        // Filtrar por búsqueda
        if (q) {
          const lower = q.toLowerCase();
          list = list.filter(
            (p) =>
              p.name.toLowerCase().includes(lower) ||
              (p.description && p.description.toLowerCase().includes(lower)) ||
              (p.tags && p.tags.some((t) => t.toLowerCase().includes(lower)))
          );
        }

        // Filtrar por precio (en céntimos)
        if (minPrice != null && minPrice > 0) {
          list = list.filter((p) => p.price >= minPrice * 100);
        }
        if (maxPrice != null && maxPrice > 0) {
          list = list.filter((p) => p.price <= maxPrice * 100);
        }

        // Ordenar
        if (sort === "price-asc") {
          list = [...list].sort((a, b) => a.price - b.price);
        } else if (sort === "price-desc") {
          list = [...list].sort((a, b) => b.price - a.price);
        }

        setProducts(list);
      } catch (err) {
        console.error("Error buscando productos:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [q, cat, minPrice, maxPrice, sort]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getActiveCategories();
        setCategories(cats);
      } catch {
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  const buildUrl = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat) params.set("cat", cat);
    if (minPrice != null && minPrice > 0) params.set("min", String(minPrice));
    if (maxPrice != null && maxPrice > 0) params.set("max", String(maxPrice));
    if (sort && sort !== "relevance") params.set("sort", sort);

    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === "" || v === "relevance") {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    const s = params.toString();
    return s ? `/buscar?${s}` : "/buscar";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildUrl({ q: searchInput || null });
    window.location.href = url;
  };

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
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
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
          <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <span className="flex items-center gap-2 text-gray-700 font-medium">
              <SlidersHorizontal className="h-5 w-5" />
              Filtros:
            </span>

            <div>
              <label className="sr-only">Categoría</label>
              <select
                value={cat}
                onChange={(e) => window.location.assign(buildUrl({ cat: e.target.value || null }))}
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
                value={sort}
                onChange={(e) => window.location.assign(buildUrl({ sort: e.target.value || null }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              >
                <option value="relevance">Relevancia</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
              </select>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const minVal = (form.querySelector('[name="min"]') as HTMLInputElement)?.value;
                const maxVal = (form.querySelector('[name="max"]') as HTMLInputElement)?.value;
                window.location.assign(
                  buildUrl({
                    min: minVal ? Number(minVal) : null,
                    max: maxVal ? Number(maxVal) : null,
                  })
                );
              }}
              className="flex items-center gap-2"
            >
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
            </form>
          </div>
        </AnimatedSection>

        {/* Resultados */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
          </div>
        ) : products.length === 0 ? (
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

export default function BuscarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
        </div>
      }
    >
      <BuscarContent />
    </Suspense>
  );
}
