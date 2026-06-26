"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

type LazyProductVideoProps = {
  src: string;
  className?: string;
  /** Reproduce en bucle cuando entra en pantalla (galería principal). */
  autoPlayWhenVisible?: boolean;
};

/**
 * Evita descargar vídeos de Supabase hasta que el usuario los necesita.
 * Reduce Cached Egress en el plan gratuito de Supabase.
 */
export default function LazyProductVideo({
  src,
  className = "",
  autoPlayWhenVisible = false,
}: LazyProductVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!autoPlayWhenVisible || !shouldLoad) return;
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoPlayWhenVisible, shouldLoad]);

  if (!shouldLoad) {
    return (
      <button
        type="button"
        onClick={() => setShouldLoad(true)}
        className={`relative flex h-full w-full items-center justify-center bg-gray-900 ${className}`}
        aria-label="Reproducir video del producto"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg">
          <Play className="h-7 w-7 translate-x-0.5" aria-hidden />
        </span>
      </button>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      muted
      loop={autoPlayWhenVisible}
      playsInline
      controls={!autoPlayWhenVisible}
      preload="none"
      autoPlay={autoPlayWhenVisible}
    />
  );
}

/** Icono estático para miniaturas de galería (sin descargar el vídeo). */
export function VideoThumbnailPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gray-800 ${className}`}
      aria-hidden
    >
      <Play className="h-6 w-6 text-white/90" />
    </div>
  );
}
