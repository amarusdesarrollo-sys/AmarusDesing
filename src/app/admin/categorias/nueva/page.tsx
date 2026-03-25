"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createCategory } from "@/lib/firebase/categories";
import { getAuthHeaders } from "@/lib/auth-headers";

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

type PendingSubcategory = {
  localId: string;
  name: string;
  slug: string;
  order: number;
  active: boolean;
};

function generateSubcatSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NuevaCategoriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // URL completa para hero

  const [pendingSubcategories, setPendingSubcategories] = useState<
    PendingSubcategory[]
  >([]);
  const [showNewSubcat, setShowNewSubcat] = useState(false);
  const [subcatName, setSubcatName] = useState("");
  const [subcatSlug, setSubcatSlug] = useState("");
  const [subcatOrder, setSubcatOrder] = useState(0);
  const [subcatActive, setSubcatActive] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      order: 0,
      active: true,
      featured: false,
    },
  });

  const parentSlug = watch("slug");

  // Auto-generar slug desde el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue("name", name);
    // Generar slug automáticamente
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .replace(/[^a-z0-9]+/g, "-") // Reemplazar espacios y caracteres especiales con guiones
      .replace(/^-+|-+$/g, ""); // Quitar guiones del inicio y final
    setValue("slug", slug);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecciona un archivo de imagen válido");
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede ser mayor a 5MB");
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Subir a Cloudinary
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
        setImageUrl(result.url || null); // Guardar URL completa para hero
      } else {
        console.error("❌ Error al subir imagen:", result);
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
  };

  const slugRegex = /^[a-z0-9-]+$/;

  const addPendingSubcategory = () => {
    const name = subcatName.trim();
    const slug = (subcatSlug.trim() || generateSubcatSlug(name)).trim();
    if (!name || !slug) return;
    if (!slugRegex.test(slug)) {
      setError(
        "El slug de la subcategoría solo puede tener minúsculas, números y guiones."
      );
      return;
    }
    if (slug === (parentSlug || "").trim().toLowerCase()) {
      setError("La subcategoría no puede usar el mismo slug que la categoría principal.");
      return;
    }
    if (pendingSubcategories.some((s) => s.slug === slug)) {
      setError("Ya añadiste una subcategoría con ese slug en la lista.");
      return;
    }
    setError(null);
    setPendingSubcategories((prev) => [
      ...prev,
      {
        localId: `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name,
        slug,
        order: subcatOrder,
        active: subcatActive,
      },
    ]);
    setSubcatName("");
    setSubcatSlug("");
    setSubcatOrder((n) => n + 1);
    setSubcatActive(true);
    setShowNewSubcat(false);
  };

  const removePendingSubcategory = (localId: string) => {
    setPendingSubcategories((prev) => prev.filter((s) => s.localId !== localId));
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setLoading(true);
      setError(null);

      const categoryData = {
        ...data,
        description: data.description || "",
        image: imagePublicId || undefined,
        imageUrl: imageUrl || undefined, // URL completa para hero (prioritaria)
        featured: data.featured,
      };

      const categoryId = await createCategory(categoryData);

      for (const sub of pendingSubcategories) {
        await createCategory({
          name: sub.name,
          slug: sub.slug,
          description: "",
          order: sub.order,
          active: sub.active,
          featured: false,
          parentId: categoryId,
        });
      }

      router.push("/admin/categorias");
    } catch (err) {
      console.error("❌ Error creating category:", err);
      setError(
        "Error al crear la categoría o alguna subcategoría. Revisa que los slugs no estén duplicados."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
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
            Nueva Categoría
          </h1>
          <p className="text-gray-600">
            Crea una nueva categoría para organizar tus productos
          </p>
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
              onChange={handleNameChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: Joyería Artesanal"
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
              placeholder="joyeria-artesanal"
            />
            <p className="mt-1 text-sm text-gray-500">
              URL amigable. Se genera automáticamente desde el nombre, pero
              puedes editarlo.
              <br />
              Ejemplo:{" "}
              <code className="bg-gray-100 px-1 rounded">
                /categorias/joyeria-artesanal
              </code>
            </p>
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
          </div>

          {/* Subcategorías (se crean al guardar, bajo esta categoría) */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Subcategorías
                </h3>
                <p className="text-sm text-gray-500">
                  Opcional: añade subcategorías ahora; se crearán en cuanto guardes
                  esta categoría (mismo comportamiento que en «Editar»).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewSubcat((v) => {
                    const open = !v;
                    if (open) {
                      setSubcatOrder(pendingSubcategories.length);
                      setError(null);
                    }
                    return open;
                  });
                }}
                className="px-4 py-2 rounded-lg bg-[#6B5BB6] text-white hover:bg-[#5B4BA5] shrink-0"
              >
                {showNewSubcat ? "Cancelar" : "Añadir subcategoría"}
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
                      id="newSubcatActive"
                      type="checkbox"
                      checked={subcatActive}
                      onChange={(e) => setSubcatActive(e.target.checked)}
                      className="h-4 w-4 text-[#6B5BB6] border-gray-300 rounded"
                    />
                    <label htmlFor="newSubcatActive" className="text-sm text-gray-700">
                      Activa
                    </label>
                  </div>
                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={addPendingSubcategory}
                      className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                    >
                      Añadir a la lista
                    </button>
                  </div>
                </div>
              </div>
            )}

            {pendingSubcategories.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay subcategorías en la lista. Puedes añadirlas con el botón de
                arriba.
              </p>
            ) : (
              <ul className="space-y-2">
                {pendingSubcategories.map((s) => (
                  <li
                    key={s.localId}
                    className="flex items-center justify-between gap-3 border rounded-lg p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{s.slug}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          s.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {s.active ? "Activa" : "Inactiva"}
                      </span>
                      <span className="text-xs text-gray-500">ord. {s.order}</span>
                      <button
                        type="button"
                        onClick={() => removePendingSubcategory(s.localId)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
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
                    ✓ Imagen subida correctamente
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
                    {uploadingImage ? "Subiendo..." : "Haz clic para subir una imagen"}
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
              placeholder="Descripción de la categoría (opcional)"
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
              placeholder="0"
            />
            <p className="mt-1 text-sm text-gray-500">
              Define el orden en que aparecerán las categorías (menor número =
              aparece primero)
            </p>
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

          {/* Destacada - aparece en página principal */}
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
              <span className="font-medium">Destacada</span> — Mostrar en la página principal como sección grande con imagen. Sube una imagen arriba para que se vea en el hero.
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              {loading ? "Creando..." : "Crear Categoría"}
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
