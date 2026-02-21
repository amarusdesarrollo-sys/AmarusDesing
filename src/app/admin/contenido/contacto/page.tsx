"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import {
  getContactoContent,
  updateContactoContent,
} from "@/lib/firebase/content";
import type { ContactoContent } from "@/types";

export default function AdminContactoPage() {
  const [content, setContent] = useState<ContactoContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getContactoContent()
      .then(setContent)
      .catch((err) => {
        console.error("Error loading contacto:", err);
        setError(`Error al cargar: ${err instanceof Error ? err.message : "Error desconocido"}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      await updateContactoContent(content);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-8">
        <p className="text-red-600">No se pudo cargar el contenido</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/admin/contenido"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-[#6B5BB6] mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Contenido
      </Link>

      <h1 className="text-4xl font-bold text-gray-800 mb-6">Contacto</h1>

      <p className="text-gray-600 mb-6">
        Los datos de contacto (email, teléfono, dirección) se editan en{" "}
        <Link
          href="/admin/configuracion"
          className="text-[#6B5BB6] hover:underline"
        >
          Configuración
        </Link>
        . Aquí solo editas el texto del hero de la página.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          Guardado correctamente
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título del hero
          </label>
          <input
            type="text"
            value={content.heroTitle}
            onChange={(e) =>
              setContent({ ...content, heroTitle: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subtítulo
          </label>
          <textarea
            value={content.heroSubtitle}
            onChange={(e) =>
              setContent({ ...content, heroSubtitle: e.target.value })
            }
            rows={3}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-[#5B4BA5] disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}
