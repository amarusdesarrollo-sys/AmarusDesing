"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-bold text-[#6B5BB6] mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5B4BA5] transition-colors"
          >
            <Home className="h-5 w-5" />
            Ir al inicio
          </Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (typeof window !== "undefined") window.history.back();
            }}
            className="inline-flex items-center justify-center gap-2 border-2 border-[#6B5BB6] text-[#6B5BB6] px-6 py-3 rounded-lg font-medium hover:bg-[#F5EFFF] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver atrás
          </a>
        </div>
      </div>
    </div>
  );
}
