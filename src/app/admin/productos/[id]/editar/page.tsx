"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { getProductById, updateProduct } from "@/lib/firebase/products";
import { getActiveCategories } from "@/lib/firebase/categories";
import type { ProductImage as ProductImageType } from "@/types";

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  discountPercent: z.number().min(0).max(99).optional().nullable(),
  category: z.string().min(1, "Selecciona una categoría"),
  subcategory: z.string().optional(),
  inStock: z.boolean(),
  stock: z.number().min(0, "Stock debe ser >= 0"),
  featured: z.boolean(),
  tags: z.string().optional(),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.number().min(0).optional().nullable(),
  attributesText: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface UploadedImage {
  id: string;
  publicId: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  isPrimary: boolean;
}

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    Promise.all([getProductById(id), getActiveCategories()]).then(
      ([product, cats]) => {
        setCategories(
          cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))
        );
        if (!product) {
          setNotFound(true);
          setError("Producto no encontrado");
          setLoading(false);
          return;
        }
        setValue("name", product.name);
        setValue("description", product.description);
        setValue("price", product.price / 100);
        setValue(
          "discountPercent",
          product.originalPrice != null &&
            product.originalPrice > product.price &&
            product.price > 0
            ? Math.round((1 - product.price / product.originalPrice) * 100)
            : undefined
        );
        setValue("category", product.category);
        setValue("subcategory", product.subcategory || "");
        setValue("inStock", product.inStock);
        setValue("stock", product.stock);
        setValue("featured", product.featured);
        setValue("tags", product.tags?.join(", ") || "");
        setValue("materials", product.materials?.join(", ") || "");
        setValue("dimensions", product.dimensions || "");
        setValue("weight", product.weight ?? undefined);
        setValue(
          "attributesText",
          product.attributes && typeof product.attributes === "object"
            ? Object.entries(product.attributes)
                .map(([k, v]) => `${k}: ${v}`)
                .join("\n")
            : ""
        );
        setImages(
          (product.images || []).map((img) => ({
            id: img.id,
            publicId: img.publicId,
            url: img.url,
            alt: img.alt,
            width: img.width || 800,
            height: img.height || 800,
            isPrimary: img.isPrimary,
          }))
        );
        setLoading(false);
      }
    );
  }, [id, setValue]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede ser mayor a 5MB");
      return;
    }
    setUploadingImage(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "products");
      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const isFirst = images.length === 0;
      setImages((prev) => [
        ...prev,
        {
          id: `img-${Date.now()}`,
          publicId: data.publicId,
          url: data.url,
          alt: "",
          width: data.width || 800,
          height: data.height || 800,
          isPrimary: isFirst,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== imageId);
      if (next.length && next.every((img) => !img.isPrimary))
        next[0].isPrimary = true;
      return next;
    });
  };

  const setPrimary = (imageId: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.id === imageId }))
    );
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setSaving(true);
      setError(null);
      const productImages: ProductImageType[] = images.map((img) => ({
        id: img.id,
        publicId: img.publicId,
        url: img.url,
        alt: img.alt || data.name,
        width: img.width,
        height: img.height,
        isPrimary: img.isPrimary,
      }));
      const attributes: Record<string, string> = {};
      if (data.attributesText?.trim()) {
        data.attributesText.split("\n").forEach((line) => {
          const idx = line.indexOf(":");
          if (idx > 0) {
            const key = line.slice(0, idx).trim();
            const value = line.slice(idx + 1).trim();
            if (key && value) attributes[key] = value;
          }
        });
      }
      const originalPriceEur = data.price;
      const discount =
        data.discountPercent != null && data.discountPercent > 0
          ? data.discountPercent
          : 0;
      const salePriceEur = originalPriceEur * (1 - discount / 100);
      await updateProduct(id, {
        name: data.name,
        description: data.description,
        price: Math.round(salePriceEur * 100),
        originalPrice:
          discount > 0 && originalPriceEur > 0
            ? Math.round(originalPriceEur * 100)
            : undefined,
        category: data.category,
        subcategory: data.subcategory?.trim() || undefined,
        images: productImages,
        inStock: data.inStock,
        stock: data.stock,
        featured: data.featured,
        tags: data.tags
          ? data.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        materials: data.materials
          ? data.materials
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        dimensions: data.dimensions?.trim() || undefined,
        weight:
          data.weight != null && data.weight > 0 ? data.weight : undefined,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        seo: {
          title: data.name,
          description: data.description.substring(0, 160),
          keywords: data.tags
            ? data.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        },
      });
      router.push("/admin/productos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-xl text-red-600 mb-4">Producto no encontrado</p>
          <Link
            href="/admin/productos"
            className="text-[#6B5BB6] hover:underline"
          >
            Volver a productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/productos"
          className="inline-flex items-center text-[#6B5BB6] hover:text-[#5B4BA5] mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a productos
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Editar producto
        </h1>
        <p className="text-gray-600 mb-8">Modifica los datos del producto</p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-lg shadow-md p-6 md:p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              {...register("name")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              placeholder="Ej: Anillo de plata con cuarzo"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              placeholder="Descripción del producto"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("price", { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.price.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descuento (%) – opcional
              </label>
              <input
                type="number"
                min="0"
                max="99"
                step="1"
                {...register("discountPercent", { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                placeholder="Ej: 10"
              />
              <p className="mt-1 text-xs text-gray-500">
                Si pones ej. 10, se mostrará el precio tachado y -10%
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <select
              {...register("category")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes
            </label>
            <div className="flex flex-wrap gap-4">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <div className="w-28 h-28 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPrimary(img.id)}
                      className="px-2 py-1 bg-white text-gray-800 text-xs rounded"
                    >
                      {img.isPrimary ? "Principal" : "Usar como principal"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="p-1 bg-red-500 text-white rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <label className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#6B5BB6] transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <span className="text-sm text-gray-500">Subiendo...</span>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Añadir</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                min="0"
                {...register("stock", { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.stock.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 pt-8">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("inStock")}
                  className="rounded text-[#6B5BB6]"
                />
                <span className="text-sm text-gray-700">
                  En stock / visible
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("featured")}
                  className="rounded text-[#6B5BB6]"
                />
                <span className="text-sm text-gray-700">Destacado</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiquetas (separadas por coma)
            </label>
            <input
              {...register("tags")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              placeholder="plata, cuarzo, artesanal"
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              Atributos opcionales
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Rellena solo los que apliquen a este producto.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategoría
                </label>
                <input
                  {...register("subcategory")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                  placeholder="Ej: anillos, colgantes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Materiales (separados por coma)
                </label>
                <input
                  {...register("materials")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                  placeholder="Ej: Plata 925, Cuarzo rosa"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimensiones
                  </label>
                  <input
                    {...register("dimensions")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                    placeholder="Ej: 10 x 5 cm, Talla 16"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (gramos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    {...register("weight", { valueAsNumber: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                    placeholder="Ej: 15"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Atributos adicionales
                </label>
                <textarea
                  {...register("attributesText")}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                  placeholder={
                    'Uno por línea, formato "Clave: Valor":\nColor: Plateado\nTalla: 16\nPiedra: Cuarzo rosa'
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <Link href="/admin/productos">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
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
