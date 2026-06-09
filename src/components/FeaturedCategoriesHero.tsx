"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { getFeaturedCategories } from "@/lib/firebase/categories";
import {
  getCloudinaryUrl,
  getCloudinaryBaseUrl,
  isSupabaseStorageUrl,
} from "@/lib/cloudinary";
import AnimatedButton from "@/components/AnimatedButton";
import type { Category } from "@/types";

/**
 * Sección hero para una categoría destacada.
 * Usa la imagen de Cloudinary si existe, sino un placeholder.
 */
function CategoryHeroSection({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  const [imageError, setImageError] = useState(false);
  const [triedOptimized, setTriedOptimized] = useState(false);

  // Preferimos una URL optimizada de Cloudinary para mejorar LCP.
  // Si falla, hacemos fallback a la URL original/base.
  const getHeroImageUrls = (): { optimized: string | null; fallback: string | null } => {
    const img = category.image?.trim();
    const imageUrl = category.imageUrl?.trim() || null;

    // URL guardada en Firestore (Supabase) tiene prioridad sobre publicId legacy
    if (
      imageUrl &&
      (isSupabaseStorageUrl(imageUrl) || imageUrl.startsWith("http"))
    ) {
      return { optimized: imageUrl, fallback: imageUrl };
    }

    if (img && !img.startsWith("http://") && !img.startsWith("https://")) {
      const optimized = getCloudinaryUrl(img, {
        width: 1600,
        height: 900,
        crop: "fill",
        quality: "auto",
        format: "auto",
        gravity: "auto",
      });
      const fallback = imageUrl || getCloudinaryBaseUrl(img) || null;
      return { optimized: optimized?.trim() || null, fallback: fallback?.trim() || null };
    }

    // Si solo tenemos URL completa, no podemos aplicar transformaciones de forma segura.
    if (imageUrl) return { optimized: imageUrl, fallback: imageUrl };
    if (img && (img.startsWith("http://") || img.startsWith("https://"))) {
      return { optimized: img, fallback: img };
    }

    return { optimized: null, fallback: null };
  };

  const { optimized, fallback } = getHeroImageUrls();
  const heroImageUrl = triedOptimized ? fallback : optimized;
  const hasValidImage = !!heroImageUrl && !imageError;

  // Debug temporal: si la imagen falla, mostrar URL completa para probar en el navegador
  if (process.env.NODE_ENV === "development" && category.featured && imageError && heroImageUrl) {
    console.log(`[Hero ${category.name}] La imagen falló. Prueba esta URL en una pestaña nueva:`, heroImageUrl);
  }

  return (
    <section className="hero-section relative overflow-hidden">
      {/* Capa de imagen o placeholder */}
      <div className="absolute inset-0 z-0">
        {hasValidImage ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImageUrl!}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              onError={() => {
                if (!triedOptimized && fallback && fallback !== optimized) {
                  setTriedOptimized(true);
                  return;
                }
                setImageError(true);
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#6B5BB6]/30 to-[#E5D9F2]" />
        )}
      </div>
      {/* Overlay oscuro - pointer-events-none para que el botón sea clickeable */}
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"
        aria-hidden
      />
      {/* Contenido (título + botón) - z-10 para estar encima, sin AnimatedSection para evitar whileInView que deja opacity 0 */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6 md:mb-12 leading-tight drop-shadow-lg tracking-[0.35em] md:tracking-[0.5em] lg:tracking-[0.6em]">
          {category.name.split(" ").length > 1 ? (
            <>
              <span className="text-white">
                {category.name.toUpperCase().split(" ").slice(0, -1).join(" ")}
              </span>
              <br />
              <span className="text-black drop-shadow-md">
                {category.name.toUpperCase().split(" ").slice(-1)[0]}
              </span>
            </>
          ) : (
            <span className="text-white">{category.name.toUpperCase()}</span>
          )}
        </h2>

        <AnimatedButton
          href={`/categorias/${category.slug}`}
          className="px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold text-base md:text-lg border-2 border-white text-white bg-white/10 hover:bg-white hover:text-black backdrop-blur-sm tracking-[0.25em] md:tracking-[0.35em]"
        >
          DESCUBRIR MÁS
          <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
        </AnimatedButton>
      </div>
    </section>
  );
}

/**
 * Componente que obtiene y muestra las categorías destacadas en la página principal.
 * Si no hay destacadas, muestra un mensaje o las secciones por defecto.
 */
export default function FeaturedCategoriesHero({
  initialCategories,
}: {
  initialCategories?: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);
  const [loading, setLoading] = useState(!initialCategories);

  useEffect(() => {
    const load = async () => {
      try {
        const featured = await getFeaturedCategories();
        setCategories(featured);
      } catch (error) {
        console.error("Error loading featured categories:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!initialCategories) {
      load();
    }
  }, [initialCategories]);

  if (loading) {
    return (
      <section className="hero-section relative overflow-hidden min-h-[60vh] flex items-center justify-center bg-gray-200">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <>
      {categories.map((category, index) => (
        <CategoryHeroSection
          key={category.id}
          category={category}
          index={index}
        />
      ))}
    </>
  );
}
