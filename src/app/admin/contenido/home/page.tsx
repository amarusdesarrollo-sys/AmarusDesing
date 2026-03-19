"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { getHomeContent, updateHomeContent } from "@/lib/firebase/content";
import type { HomeContent } from "@/types";
import { getAuthHeaders } from "@/lib/auth-headers";

export default function AdminHomePage() {
  const [content, setContent] = useState<HomeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [originalHistoriaImagePublicId, setOriginalHistoriaImagePublicId] = useState<string | undefined>(undefined);

  useEffect(() => {
    getHomeContent()
      .then((data) => {
        setContent(data);
        setOriginalHistoriaImagePublicId(data.historia.imagePublicId);
      })
      .catch((err) => {
        console.error("Error loading home:", err);
        setError(`Error al cargar: ${err instanceof Error ? err.message : "Error desconocido"}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleHistoriaImageUpload = async (
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
      if (!res.ok || !data?.success) throw new Error(data?.message || "Error al subir imagen");

      setContent((c) => {
        if (!c) return c;
        return {
          ...c,
          historia: {
            ...c.historia,
            imagePublicId: data.publicId,
            imageUrl: data.url ?? "",
          },
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al subir la imagen"
      );
    } finally {
      setUploadingImage(false);
      // reset input value so selecting same file again triggers change
      if (e.target) e.target.value = "";
    }
  };

  const handleHistoriaRemoveImage = () => {
    setContent((c) => {
      if (!c) return c;
      return {
        ...c,
        historia: {
          ...c.historia,
          imagePublicId: undefined,
          imageUrl: undefined,
        },
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
      const nextHistoriaPublicId = content.historia.imagePublicId;
      const original = originalHistoriaImagePublicId;
      if (original && original !== nextHistoriaPublicId) {
        await fetch("/api/admin/delete-cloudinary-assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders()),
          },
          body: JSON.stringify({ publicIds: [original] }),
        }).catch(() => null);
      }
      await updateHomeContent(content);
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

      <h1 className="text-4xl font-bold text-gray-800 mb-6">Home</h1>

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

      <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
        <div className="p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Sección Proyecto Familiar
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={content.proyectoFamiliar.title}
                onChange={(e) =>
                  setContent({
                    ...content,
                    proyectoFamiliar: {
                      ...content.proyectoFamiliar,
                      title: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Párrafos (uno por bloque)
              </label>
              <textarea
                value={content.proyectoFamiliar.paragraphs.join("\n\n")}
                onChange={(e) =>
                  setContent({
                    ...content,
                    proyectoFamiliar: {
                      ...content.proyectoFamiliar,
                      paragraphs: e.target.value
                        .split("\n\n")
                        .map((p) => p.trim())
                        .filter(Boolean),
                    },
                  })
                }
                rows={6}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Sección Historia
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={content.historia.title}
                onChange={(e) =>
                  setContent({
                    ...content,
                    historia: {
                      ...content.historia,
                      title: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Párrafos (uno por bloque)
              </label>
              <textarea
                value={content.historia.paragraphs.join("\n\n")}
                onChange={(e) =>
                  setContent({
                    ...content,
                    historia: {
                      ...content.historia,
                      paragraphs: e.target.value
                        .split("\n\n")
                        .map((p) => p.trim())
                        .filter(Boolean),
                    },
                  })
                }
                rows={8}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            {/* Imagen (hero / sección historia dentro de Home) */}
            <div className="space-y-2 pt-2">
              <label className="block text-sm font-medium text-gray-700">
                Imagen (historia)
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = handleHistoriaImageUpload as any;
                    input.click();
                  }}
                  disabled={uploadingImage}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                >
                  {uploadingImage
                    ? "Subiendo..."
                    : content?.historia?.imageUrl
                      ? "Cambiar imagen"
                      : "Seleccionar imagen"}
                </button>

                {content?.historia?.imageUrl && (
                  <button
                    type="button"
                    onClick={handleHistoriaRemoveImage}
                    className="px-3 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Quitar imagen
                  </button>
                )}
              </div>

              {content?.historia?.imageUrl && (
                <div className="mt-2 w-32 h-32 rounded overflow-hidden border border-gray-200 bg-gray-100">
                  <img
                    src={content.historia.imageUrl}
                    alt="Preview historia"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
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
