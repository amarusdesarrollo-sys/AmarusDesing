"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  getCloudinaryUrl,
  getCloudinaryBaseUrl,
  isSupabaseStorageUrl,
} from "@/lib/cloudinary";
import AnimatedButton from "@/components/AnimatedButton";
import type { Category } from "@/types";

export default function CategoryHeroSection({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  const [imageError, setImageError] = useState(false);
  const [triedOptimized, setTriedOptimized] = useState(false);

  const getHeroImageUrls = (): { optimized: string | null; fallback: string | null } => {
    const img = category.image?.trim();
    const imageUrl = category.imageUrl?.trim() || null;

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

    if (imageUrl) return { optimized: imageUrl, fallback: imageUrl };
    if (img && (img.startsWith("http://") || img.startsWith("https://"))) {
      return { optimized: img, fallback: img };
    }

    return { optimized: null, fallback: null };
  };

  const { optimized, fallback } = getHeroImageUrls();
  const heroImageUrl = triedOptimized ? fallback : optimized;
  const hasValidImage = !!heroImageUrl && !imageError;

  return (
    <section className="hero-section relative overflow-hidden" aria-label={category.name}>
      <div className="absolute inset-0 z-0">
        {hasValidImage ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImageUrl!}
              alt=""
              width={1600}
              height={900}
              decoding="async"
              className="hero-image"
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
          <div className="absolute inset-0 bg-gradient-to-br from-[#6B5BB6]/30 to-[#E5D9F2]" aria-hidden />
        )}
      </div>
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"
        aria-hidden
      />
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
          <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" aria-hidden />
        </AnimatedButton>
      </div>
    </section>
  );
}
