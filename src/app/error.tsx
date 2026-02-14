"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Algo ha ido mal
        </h1>
        <p className="text-gray-600 mb-8">
          Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5B4BA5] transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center border-2 border-[#6B5BB6] text-[#6B5BB6] px-6 py-3 rounded-lg font-medium hover:bg-[#F5EFFF] transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
