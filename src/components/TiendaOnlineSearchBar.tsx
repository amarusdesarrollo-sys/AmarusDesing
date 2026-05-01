"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import AnimatedGrid from "@/components/AnimatedGrid";
import type { Product } from "@/types";

function filterProductsByQuery(products: Product[], raw: string): Product[] {
  const q = raw.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
  );
}

type Props = {
  products: Product[];
};

export default function TiendaOnlineSearchBar({ products }: Props) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => filterProductsByQuery(products, query),
    [products, query]
  );
  const trimmed = query.trim();

  return (
    <div className="w-full max-w-3xl mx-auto mb-10 md:mb-12">
      <label htmlFor="tienda-buscar" className="sr-only">
        Buscar productos
      </label>
      <div className="relative shadow-sm rounded-xl">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
          aria-hidden
        />
        <input
          id="tienda-buscar"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar productos por nombre, descripción o etiqueta…"
          autoComplete="off"
          className="w-full pl-12 pr-4 py-3.5 md:py-4 border border-gray-200/80 rounded-xl bg-white/90 backdrop-blur-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6B5BB6]/40 focus:border-[#6B5BB6]"
        />
      </div>

      {trimmed && (
        <div className="mt-8 text-left rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm p-4 md:p-6 shadow-sm max-h-[min(70vh,720px)] overflow-y-auto">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <p className="text-sm font-medium text-gray-700">
              {filtered.length === 0
                ? "Sin resultados"
                : `${filtered.length} ${filtered.length === 1 ? "producto" : "productos"}`}
            </p>
            <Link
              href={`/buscar?q=${encodeURIComponent(trimmed)}`}
              className="text-sm text-[#6B5BB6] hover:text-[#5B4BA5] font-medium underline-offset-2 hover:underline"
            >
              Filtros y orden (precio, categoría…)
            </Link>
          </div>
          {filtered.length === 0 ? (
            <p className="text-gray-600 text-sm py-4 text-center">
              Probá con otras palabras o usá la búsqueda avanzada.
            </p>
          ) : (
            <AnimatedGrid
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
              staggerDelay={0.05}
            >
              {filtered.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </AnimatedGrid>
          )}
        </div>
      )}
    </div>
  );
}
