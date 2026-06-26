"use client";

import Image from "next/image";
import { useState } from "react";
import {
  getProductImageUrl,
  isCloudinaryUrl,
  isSupabaseStorageUrl,
  isDirectMediaUrl,
  extractPublicIdFromUrl,
} from "@/lib/cloudinary";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Clases del contenedor (reserva de espacio / layout). */
  wrapperClassName?: string;
  /** Clases de la imagen (`object-cover`, etc.). Si no se pasa, usa `className`. */
  imageClassName?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  fallback?: string;
  avifSrc?: string;
  webpSrc?: string;
  publicId?: string;
  cloudinarySize?: "small" | "medium" | "large" | "thumbnail";
  /** Ocupa el contenedor padre (`position: absolute; inset: 0`). El padre debe ser `relative` con tamaño fijo. */
  fill?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  wrapperClassName = "",
  imageClassName,
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
  fill = false,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imgClasses = imageClassName ?? className;
  const reservedAspect =
    !fill && width && height ? `${width} / ${height}` : undefined;

  // Determinar la mejor imagen a usar
  const getBestImageSrc = () => {
    if (imageError && fallback) return fallback;

    if (publicId) {
      return getProductImageUrl(publicId, cloudinarySize, src);
    }

    // Si hay versión AVIF específica, usarla
    if (avifSrc) return avifSrc;

    // Si hay versión WebP específica, usarla
    if (webpSrc) return webpSrc;

    // Si la imagen original es AVIF, usarla
    if (src.endsWith(".avif")) return src;

    // Si la imagen original es WebP, usarla
    if (src.endsWith(".webp")) return src;

    // Por defecto, usar la imagen original (incluye URLs directas de Cloudinary)
    return src;
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const resolvedSrc = getBestImageSrc();

  return (
    <div
      className={`overflow-hidden bg-gray-200 ${
        fill ? `absolute inset-0 ${wrapperClassName}` : `relative w-full ${wrapperClassName}`
      }`}
      style={reservedAspect ? { aspectRatio: reservedAspect } : undefined}
    >
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          aria-hidden
        />
      )}

      <Image
        src={resolvedSrc}
        alt={alt}
        {...(fill
          ? { fill: true }
          : { width: width ?? 800, height: height ?? 600 })}
        className={`transition-opacity duration-300 ${
          fill ? `object-cover ${imgClasses}` : `h-full w-full ${imgClasses}`
        } ${isLoading ? "opacity-0" : "opacity-100"}`}
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
        unoptimized={isDirectMediaUrl(resolvedSrc)}
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

// Placeholder para cuando no hay imagen o falla
function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
      <span className="text-gray-400 text-sm">Sin imagen</span>
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
  const [error, setError] = useState(false);

  let imageUrl: string;
  
  // Si src es URL completa (http), usarla directamente
  if (src && (src.startsWith("http://") || src.startsWith("https://"))) {
    imageUrl = src;
  } else if (publicId) {
    const preferred =
      src && (src.startsWith("http://") || src.startsWith("https://")) ? src : undefined;
    imageUrl = getProductImageUrl(publicId, size, preferred);
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
    return <ImagePlaceholder className={className} />;
  }

  if (!imageUrl || imageUrl.trim() === "" || error) {
    return <ImagePlaceholder className={className} />;
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
      unoptimized={isDirectMediaUrl(imageUrl)}
      onError={() => setError(true)}
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
      unoptimized={isDirectMediaUrl(src)}
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
