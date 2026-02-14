"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Error crítico
          </h1>
          <p className="text-gray-600 mb-6">
            Ha ocurrido un error grave. Por favor, recarga la página.
          </p>
          <button
            type="button"
            onClick={reset}
            className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5B4BA5] transition-colors"
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
