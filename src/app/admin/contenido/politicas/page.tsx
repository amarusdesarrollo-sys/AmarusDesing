"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import {
  getPoliticasContent,
  updatePoliticasContent,
} from "@/lib/firebase/content";
import type { PoliticasContent } from "@/types";
import { getAuthHeaders } from "@/lib/auth-headers";

export default function AdminPoliticasPage() {
  const [content, setContent] = useState<PoliticasContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [originalHeroImagePublicId, setOriginalHeroImagePublicId] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    getPoliticasContent()
      .then((data) => {
        setContent(data);
        setOriginalHeroImagePublicId(data.heroImagePublicId);
      })
      .catch((err) => {
        console.error("Error loading politicas:", err);
        setError(`Error al cargar: ${err instanceof Error ? err.message : "Error desconocido"}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleHeroImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setUploadingImage(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "content");
      const res = await fetch("/api/upload-image", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.message || "Error al subir imagen");

      setContent((c) => {
        if (!c) return c;
        return {
          ...c,
          heroImagePublicId: data.publicId,
          heroImageUrl: data.url ?? "",
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al subir la imagen"
      );
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleHeroRemoveImage = () => {
    setContent((c) => {
      if (!c) return c;
      return {
        ...c,
        heroImagePublicId: undefined,
        heroImageUrl: undefined,
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      // Si se reemplazó o quitó la imagen, limpiamos el asset anterior en Cloudinary
      const nextHeroImagePublicId = content.heroImagePublicId;
      if (
        originalHeroImagePublicId &&
        originalHeroImagePublicId !== nextHeroImagePublicId
      ) {
        await fetch("/api/admin/delete-cloudinary-assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders()),
          },
          body: JSON.stringify({ publicIds: [originalHeroImagePublicId] }),
        }).catch(() => null);
      }
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
      <div className="admin-shell flex justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="admin-shell">
        <p className="text-red-600">No se pudo cargar el contenido</p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
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

        {/* Imagen hero */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Imagen del hero (opcional)
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = handleHeroImageUpload as any;
                input.click();
              }}
              disabled={uploadingImage}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
            >
              {uploadingImage
                ? "Subiendo..."
                : content?.heroImageUrl
                  ? "Cambiar imagen"
                  : "Seleccionar imagen"}
            </button>

            {content?.heroImageUrl && (
              <button
                type="button"
                onClick={handleHeroRemoveImage}
                className="px-3 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
              >
                Quitar imagen
              </button>
            )}
          </div>

          {content?.heroImageUrl && (
            <div className="mt-2 w-40 h-24 rounded overflow-hidden border border-gray-200 bg-gray-100">
              <img
                src={content.heroImageUrl}
                alt="Preview hero"
                className="w-full h-full object-cover"
              />
            </div>
          )}
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
