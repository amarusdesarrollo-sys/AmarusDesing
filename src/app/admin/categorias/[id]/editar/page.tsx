"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { getCategoryById, updateCategory } from "@/lib/firebase/categories";

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

export default function EditarCategoriaPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setSaving(true);
      setError(null);

      const categoryData = {
        ...data,
        description: data.description || "",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
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
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
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
