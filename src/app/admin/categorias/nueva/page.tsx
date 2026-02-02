"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Upload, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createCategory } from "@/lib/firebase/categories";

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
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function NuevaCategoriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);

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
    },
  });

  // Auto-generar slug desde el nombre
  const nameWatch = watch("name");
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
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Imagen subida exitosamente:", {
          publicId: result.publicId,
          url: result.url,
        });
        setImagePublicId(result.publicId);
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
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setLoading(true);
      setError(null);

      const categoryData = {
        ...data,
        description: data.description || "",
        image: imagePublicId || undefined,
      };

      console.log("📦 Guardando categoría con datos:", {
        name: categoryData.name,
        slug: categoryData.slug,
        image: categoryData.image,
        hasImage: !!categoryData.image,
      });

      const categoryId = await createCategory(categoryData);
      
      console.log("✅ Categoría creada exitosamente con ID:", categoryId);

      router.push("/admin/categorias");
    } catch (err) {
      console.error("❌ Error creating category:", err);
      setError(
        "Error al crear la categoría. Verifica que el slug no esté duplicado."
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
