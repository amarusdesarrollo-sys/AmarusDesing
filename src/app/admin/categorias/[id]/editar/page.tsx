"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  createCategory,
  getCategoryById,
  getSubcategories,
  updateCategory,
} from "@/lib/firebase/categories";
import { getProductImageUrl } from "@/lib/cloudinary";
import { getAuthHeaders } from "@/lib/auth-headers";
import type { Category } from "@/types";

// Esquema de validación
const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z
    .string()
    .min(1, "El slug es requerido")
    .regex(
      /^[a-z0-9-]+$/,
      "El slug solo puede contener letras minúsculas, números y guiones"
    ),
  description: z.string().optional().or(z.literal("")),
  order: z.number().min(0, "El orden debe ser mayor o igual a 0"),
  active: z.boolean(),
  featured: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function EditarCategoriaPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // URL completa para hero
  const [currentImagePublicId, setCurrentImagePublicId] = useState<string | null>(null);
  const [subcategories, setSubcategoriesList] = useState<Category[]>([]);
  const [subcatLoading, setSubcatLoading] = useState(false);
  const [showNewSubcat, setShowNewSubcat] = useState(false);
  const [subcatName, setSubcatName] = useState("");
  const [subcatSlug, setSubcatSlug] = useState("");
  const [subcatOrder, setSubcatOrder] = useState(0);
  const [subcatActive, setSubcatActive] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    const loadCategory = async () => {
      try {
        setLoading(true);
        const category = await getCategoryById(categoryId);

        if (!category) {
          setError("Categoría no encontrada");
          return;
        }

        // Cargar datos en el formulario
        setValue("name", category.name);
        setValue("slug", category.slug);
        setValue("description", category.description || "");
        setValue("order", category.order);
        setValue("active", category.active);
        setValue("featured", category.featured ?? false);
        
        // Cargar imagen si existe
        if (category.image) {
          setCurrentImagePublicId(category.image);
          setImagePublicId(category.image);
          setImageUrl(category.imageUrl || null);
          // Preview: preferir imageUrl si existe, sino generar desde publicId
          setImagePreview(
            category.imageUrl || getProductImageUrl(category.image, "medium")
          );
        }
      } catch (err) {
        console.error("Error loading category:", err);
        setError("Error al cargar la categoría");
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      loadCategory();
    }
  }, [categoryId, setValue]);

  const loadSubcategories = async () => {
    try {
      setSubcatLoading(true);
      const subs = await getSubcategories(categoryId);
      setSubcategoriesList(subs);
      // sugerir próximo orden
      const maxOrder = subs.reduce((m, s) => Math.max(m, s.order ?? 0), 0);
      setSubcatOrder(subs.length ? maxOrder + 1 : 0);
    } catch {
      setSubcategoriesList([]);
    } finally {
      setSubcatLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) loadSubcategories();
  }, [categoryId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecciona un archivo de imagen válido");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede ser mayor a 5MB");
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "categories");

      const response = await fetch("/api/upload-image", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImagePublicId(result.publicId);
        setImageUrl(result.url || null);
      } else {
        throw new Error(result.message || "Error al subir la imagen");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al subir la imagen. Intenta nuevamente."
      );
      setImagePreview(null);
      setImagePublicId(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImagePublicId(null);
    setImageUrl(null);
    setCurrentImagePublicId(null);
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setSaving(true);
      setError(null);

      // Si se cambió o eliminó la imagen, borrar la anterior en Cloudinary
      if (currentImagePublicId && currentImagePublicId !== imagePublicId) {
        await fetch("/api/admin/delete-cloudinary-assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders()),
          },
          body: JSON.stringify({ publicIds: [currentImagePublicId] }),
        }).catch(() => null);
      }

      const categoryData = {
        ...data,
        description: data.description || "",
        image: imagePublicId || undefined,
        imageUrl: imageUrl || undefined,
        featured: data.featured,
      };

      await updateCategory(categoryId, categoryData);

      router.push("/admin/categorias");
    } catch (err) {
      console.error("Error updating category:", err);
      setError(
        "Error al actualizar la categoría. Verifica que el slug no esté duplicado."
      );
    } finally {
      setSaving(false);
    }
  };

  const generateSubcatSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleCreateSubcategory = async () => {
    if (!subcatName.trim()) return;
    const slug = (subcatSlug || generateSubcatSlug(subcatName)).trim();
    if (!slug) return;
    try {
      setSubcatLoading(true);
      await createCategory({
        name: subcatName.trim(),
        slug,
        description: "",
        order: subcatOrder,
        active: subcatActive,
        featured: false,
        parentId: categoryId,
      });
      setShowNewSubcat(false);
      setSubcatName("");
      setSubcatSlug("");
      setSubcatActive(true);
      await loadSubcategories();
    } catch (e) {
      alert("Error al crear subcategoría (revisa que el slug no esté duplicado)");
    } finally {
      setSubcatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="max-w-3xl mx-auto min-w-0">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6] mb-4"></div>
            <p className="text-xl text-gray-600">Cargando categoría...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="admin-shell">
        <div className="max-w-3xl mx-auto min-w-0">
          <div className="bg-white rounded-lg shadow-md p-6 text-center sm:p-8">
            <p className="text-xl text-red-600 mb-4">{error}</p>
            <Link href="/admin/categorias">
              <button className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] transition-colors">
                Volver a categorías
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="max-w-3xl mx-auto min-w-0">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/categorias"
            className="inline-flex items-center text-[#6B5BB6] hover:text-[#5B4BA5] mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver a categorías
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Editar Categoría
          </h1>
          <p className="text-gray-600">Modifica los datos de la categoría</p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-lg shadow-md p-6 md:p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              id="name"
              {...register("name")}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Slug (URL) *
            </label>
            <input
              type="text"
              id="slug"
              {...register("slug")}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent ${
                errors.slug ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-sm text-gray-500">
              URL amigable. Ten cuidado al cambiarlo, puede afectar los enlaces
              existentes.
            </p>
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
          </div>

          {/* Subcategorías */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Subcategorías
                </h3>
                <p className="text-sm text-gray-500">
                  Crea subcategorías dentro de esta categoría (ej: Anillos, Aros, Cabujones).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewSubcat((v) => !v)}
                className="px-4 py-2 rounded-lg bg-[#6B5BB6] text-white hover:bg-[#5B4BA5]"
              >
                {showNewSubcat ? "Cancelar" : "Nueva subcategoría"}
              </button>
            </div>

            {showNewSubcat && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={subcatName}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSubcatName(v);
                        setSubcatSlug(generateSubcatSlug(v));
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ej: Anillos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (URL) *
                    </label>
                    <input
                      type="text"
                      value={subcatSlug}
                      onChange={(e) => setSubcatSlug(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="ej: anillos"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orden
                    </label>
                    <input
                      type="number"
                      value={subcatOrder}
                      onChange={(e) => setSubcatOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                      min={0}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-7">
                    <input
                      id="subcatActive"
                      type="checkbox"
                      checked={subcatActive}
                      onChange={(e) => setSubcatActive(e.target.checked)}
                      className="h-4 w-4 text-[#6B5BB6] border-gray-300 rounded"
                    />
                    <label htmlFor="subcatActive" className="text-sm text-gray-700">
                      Activa
                    </label>
                  </div>
                  <div className="pt-6">
                    <button
                      type="button"
                      disabled={subcatLoading}
                      onClick={handleCreateSubcategory}
                      className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {subcatLoading ? "Creando..." : "Crear subcategoría"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {subcatLoading ? (
              <p className="text-sm text-gray-500">Cargando subcategorías...</p>
            ) : subcategories.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aún no hay subcategorías en esta categoría.
              </p>
            ) : (
              <div className="space-y-2">
                {subcategories.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 border rounded-lg p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500 truncate">{s.slug}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          s.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {s.active ? "Activa" : "Inactiva"}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          await updateCategory(s.id, { active: !s.active });
                          await loadSubcategories();
                        }}
                        className="px-3 py-1.5 text-xs rounded-lg border hover:bg-gray-50"
                      >
                        {s.active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`¿Eliminar definitivamente "${s.name}"?`)) return;
                          const res = await fetch("/api/admin/delete-category", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              ...(await getAuthHeaders()),
                            },
                            body: JSON.stringify({ categoryId: s.id }),
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok || !data?.success) {
                            alert(data?.message || "Error al eliminar definitivamente");
                            return;
                          }
                          await loadSubcategories();
                        }}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Imagen */}
          <div>
            <label
              htmlFor="image"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Imagen de la Categoría
            </label>
            
            {imagePreview ? (
              <div className="relative w-full max-w-md">
                <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-300">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                {imagePublicId && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ Imagen {currentImagePublicId && currentImagePublicId === imagePublicId ? "actual" : "actualizada"} correctamente
                  </p>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#6B5BB6] transition-colors">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                <label
                  htmlFor="image"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
                  <span className="text-gray-600 font-medium mb-2">
                    {uploadingImage ? "Subiendo..." : "Haz clic para subir o cambiar la imagen"}
                  </span>
                  <span className="text-sm text-gray-500">
                    PNG, JPG, WEBP hasta 5MB
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Descripción
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent"
            />
          </div>

          {/* Orden */}
          <div>
            <label
              htmlFor="order"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Orden de Visualización
            </label>
            <input
              type="number"
              id="order"
              {...register("order", { valueAsNumber: true })}
              min={0}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent ${
                errors.order ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.order && (
              <p className="mt-1 text-sm text-red-600">
                {errors.order.message}
              </p>
            )}
          </div>

          {/* Activa */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              {...register("active")}
              className="h-4 w-4 text-[#6B5BB6] focus:ring-[#6B5BB6] border-gray-300 rounded"
            />
            <label
              htmlFor="active"
              className="ml-2 block text-sm text-gray-700"
            >
              Categoría activa (visible en la tienda)
            </label>
          </div>

          {/* Destacada */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              {...register("featured")}
              className="h-4 w-4 text-[#6B5BB6] focus:ring-[#6B5BB6] border-gray-300 rounded"
            />
            <label
              htmlFor="featured"
              className="ml-2 block text-sm text-gray-700"
            >
              <span className="font-medium">Destacada</span> — Mostrar en la página principal como sección hero. La imagen de arriba se usará como fondo.
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
            <Link href="/admin/categorias">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
