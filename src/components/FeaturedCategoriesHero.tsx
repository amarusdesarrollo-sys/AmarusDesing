"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { getFeaturedCategories } from "@/lib/firebase/categories";
import { getCloudinaryUrl, getCloudinaryBaseUrl } from "@/lib/cloudinary";
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

  // Prioridad: imageUrl (de Cloudinary al subir) > image como URL > image como publicId
  const getHeroImageUrl = (): string | null => {
    // 1. imageUrl es la URL completa guardada al subir - siempre funciona
    if (category.imageUrl?.trim()) return category.imageUrl.trim();
    const img = category.image?.trim();
    if (!img) return null;
    // 2. Si image es URL completa, usarla
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    // 3. image es publicId - usar URL base SIN transformaciones (más compatible)
    // Las transformaciones a veces fallan si el formato de imagen es atípico
    const baseUrl = getCloudinaryBaseUrl(img);
    if (baseUrl?.trim()) return baseUrl.trim();
    const url = getCloudinaryUrl(img, {
      width: 1920,
      height: 1080,
      crop: "fill",
      quality: "auto",
      format: "auto",
      gravity: "auto",
    });
    return url?.trim() || null;
  };

  const heroImageUrl = getHeroImageUrl();
  const hasValidImage = heroImageUrl && !imageError;

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
              loading={index < 2 ? "eager" : "lazy"}
              onError={() => setImageError(true)}
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
        <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6 md:mb-12 leading-tight drop-shadow-lg">
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
          className="px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold text-base md:text-lg border-2 border-white text-white bg-white/10 hover:bg-white hover:text-black backdrop-blur-sm"
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
export default function FeaturedCategoriesHero() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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
    load();
  }, []);

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
