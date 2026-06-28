"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";

type LazyProductVideoProps = {
  src: string;
  className?: string;
  /** Reproduce en bucle cuando entra en pantalla (galería principal). */
  autoPlayWhenVisible?: boolean;
};

const prefetchedVideos = new Set<string>();

/** Precarga en caché del navegador al pasar el ratón por una miniatura de vídeo. */
export function prefetchProductVideo(url: string) {
  if (!url || prefetchedVideos.has(url) || typeof document === "undefined") return;
  prefetchedVideos.add(url);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  video.load();
}

/**
 * En galería (autoPlayWhenVisible): carga al seleccionar el vídeo, sin segundo clic.
 * Modo manual: botón play hasta que el usuario lo pida (ahorro de egress).
 */
export default function LazyProductVideo({
  src,
  className = "",
  autoPlayWhenVisible = false,
}: LazyProductVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(autoPlayWhenVisible);
  const [isBuffering, setIsBuffering] = useState(autoPlayWhenVisible);

  useEffect(() => {
    if (autoPlayWhenVisible) {
      setShouldLoad(true);
      setIsBuffering(true);
    }
  }, [src, autoPlayWhenVisible]);

  useEffect(() => {
    if (!shouldLoad) return;
    const el = videoRef.current;
    if (!el) return;

    const handlePlaying = () => setIsBuffering(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => {
      setIsBuffering(false);
      if (autoPlayWhenVisible) {
        el.play().catch(() => {});
      }
    };

    el.addEventListener("playing", handlePlaying);
    el.addEventListener("waiting", handleWaiting);
    el.addEventListener("canplay", handleCanPlay);

    if (autoPlayWhenVisible && el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      handleCanPlay();
    }

    let observer: IntersectionObserver | undefined;
    if (autoPlayWhenVisible) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.play().catch(() => {});
          } else {
            el.pause();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
    }

    return () => {
      el.removeEventListener("playing", handlePlaying);
      el.removeEventListener("waiting", handleWaiting);
      el.removeEventListener("canplay", handleCanPlay);
      observer?.disconnect();
    };
  }, [shouldLoad, src, autoPlayWhenVisible]);

  if (!shouldLoad) {
    return (
      <button
        type="button"
        onClick={() => {
          setShouldLoad(true);
          setIsBuffering(true);
        }}
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
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        src={src}
        className={className}
        muted
        loop={autoPlayWhenVisible}
        playsInline
        controls={!autoPlayWhenVisible}
        preload="auto"
        autoPlay={autoPlayWhenVisible}
      />
      {isBuffering && autoPlayWhenVisible && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-900/40"
          aria-hidden
        >
          <Loader2 className="h-10 w-10 animate-spin text-white/90" />
        </div>
      )}
    </div>
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
