"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import {
  getPoliticasContent,
  updatePoliticasContent,
} from "@/lib/firebase/content";
import type { PoliticasContent } from "@/types";

export default function AdminPoliticasPage() {
  const [content, setContent] = useState<PoliticasContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getPoliticasContent()
      .then(setContent)
      .catch((err) => {
        console.error("Error loading politicas:", err);
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
      await updatePoliticasContent(content);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    setContent((c) =>
      c
        ? {
            ...c,
            sections: [
              ...c.sections,
              { title: "Nueva sección", content: "" },
            ],
          }
        : null
    );
  };

  const updateSection = (idx: number, field: "title" | "content", value: string) => {
    setContent((c) => {
      if (!c) return c;
      const s = [...c.sections];
      s[idx] = { ...s[idx], [field]: value };
      return { ...c, sections: s };
    });
  };

  const removeSection = (idx: number) => {
    setContent((c) =>
      c
        ? {
            ...c,
            sections: c.sections.filter((_, i) => i !== idx),
          }
        : null
    );
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

      <h1 className="text-4xl font-bold text-gray-800 mb-6">Políticas</h1>

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

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
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
            Introducción
          </label>
          <textarea
            value={content.intro}
            onChange={(e) =>
              setContent({ ...content, intro: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Secciones
            </label>
            <button
              type="button"
              onClick={addSection}
              className="text-[#6B5BB6] hover:underline flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Añadir sección
            </button>
          </div>
          <div className="space-y-4">
            {content.sections.map((section, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-lg bg-gray-50 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) =>
                      updateSection(idx, "title", e.target.value)
                    }
                    placeholder="Título"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeSection(idx)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  value={section.content}
                  onChange={(e) =>
                    updateSection(idx, "content", e.target.value)
                  }
                  placeholder="Contenido"
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            ))}
          </div>
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
