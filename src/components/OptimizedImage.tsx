"use client";

import Image from "next/image";
import { useState } from "react";
import {
  getProductImageUrl,
  isCloudinaryUrl,
  extractPublicIdFromUrl,
} from "@/lib/cloudinary";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  fallback?: string;
  avifSrc?: string;
  webpSrc?: string;
  publicId?: string; // Cloudinary public ID
  cloudinarySize?: "small" | "medium" | "large" | "thumbnail";
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  sizes,
  quality = 85,
  placeholder = "empty",
  blurDataURL,
  fallback,
  avifSrc,
  webpSrc,
  publicId,
  cloudinarySize = "medium",
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Determinar la mejor imagen a usar
  const getBestImageSrc = () => {
    if (imageError && fallback) return fallback;

    // Si hay publicId de Cloudinary, usar función optimizada
    if (publicId) {
      return getProductImageUrl(publicId, cloudinarySize);
    }

    // Si la URL es de Cloudinary, intentar extraer publicId
    if (isCloudinaryUrl(src)) {
      const extractedPublicId = extractPublicIdFromUrl(src);
      if (extractedPublicId) {
        return getProductImageUrl(extractedPublicId, cloudinarySize);
      }
    }

    // Si hay versión AVIF específica, usarla
    if (avifSrc) return avifSrc;

    // Si hay versión WebP específica, usarla
    if (webpSrc) return webpSrc;

    // Si la imagen original es AVIF, usarla
    if (src.endsWith(".avif")) return src;

    // Si la imagen original es WebP, usarla
    if (src.endsWith(".webp")) return src;

    // Por defecto, usar la imagen original
    return src;
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      <Image
        src={getBestImageSrc()}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        priority={priority}
        sizes={
          sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        }
        quality={quality}
        placeholder={placeholder}
        blurDataURL={
          blurDataURL ||
          "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        }
        onLoad={handleImageLoad}
        onError={handleImageError}
        // Cloudinary maneja la optimización, no necesitamos que Next.js lo haga
        unoptimized={
          isCloudinaryUrl(src) || !!publicId || src.includes("cloudinary.com")
        }
      />

      {imageError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">Imagen no disponible</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente especializado para imágenes de productos
export function ProductImage({
  src,
  alt,
  className = "",
  priority = false,
  publicId,
  size = "medium",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  publicId?: string;
  size?: "small" | "medium" | "large" | "thumbnail";
}) {
  let imageUrl: string;
  
  if (publicId) {
    imageUrl = getProductImageUrl(publicId, size);
    console.log("🖼️ ProductImage - publicId:", publicId, "URL generada:", imageUrl);
  } else if (src && src.trim() !== "") {
    if (isCloudinaryUrl(src)) {
      const extractedPublicId = extractPublicIdFromUrl(src);
      imageUrl = extractedPublicId
        ? getProductImageUrl(extractedPublicId, size)
        : src;
    } else {
      imageUrl = src;
    }
  } else {
    // Si no hay ni publicId ni src válido, usar placeholder
    imageUrl = "/images/placeholder-category.jpg";
  }

  // Si después de todo no hay URL válida, no renderizar
  if (!imageUrl || imageUrl.trim() === "") {
    console.warn("⚠️ ProductImage - No hay URL válida para renderizar");
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Sin imagen</span>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={800}
      height={800}
      className={`object-cover rounded-lg ${className}`}
      priority={priority}
      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      quality={90}
      placeholder="empty"
      unoptimized={isCloudinaryUrl(src) || !!publicId}
    />
  );
}

// Componente especializado para imágenes hero
export function HeroImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
      priority={true}
      sizes="100vw"
      quality={85}
      placeholder="empty"
      unoptimized={src.includes("cloudinary.com")}
    />
  );
}

// Componente especializado para thumbnails
export function ThumbnailImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={400}
      className={`object-cover rounded-lg ${className}`}
      sizes="(max-width: 768px) 50vw, 25vw"
      quality={80}
      placeholder="empty"
    />
  );
}
