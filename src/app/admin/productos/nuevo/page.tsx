"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Plus, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createProduct } from "@/lib/firebase/products";
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
  attributesText: z.string().optional(), // "Clave: Valor" uno por línea
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

export default function NuevoProductoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      discountPercent: undefined,
      category: "",
      subcategory: "",
      inStock: true,
      stock: 0,
      featured: false,
      tags: "",
      materials: "",
      dimensions: "",
      weight: undefined,
      attributesText: "",
    },
  });

  useEffect(() => {
    getActiveCategories().then((cats) =>
      setCategories(cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug })))
    );
  }, []);

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

  const removeImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (next.length && next.every((img) => !img.isPrimary))
        next[0].isPrimary = true;
      return next;
    });
  };

  const setPrimary = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.id === id }))
    );
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);
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
      const product = {
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
      };
      const id = await createProduct(product);
      router.push("/admin/productos");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear el producto"
      );
    } finally {
      setLoading(false);
    }
  };

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
          Nuevo producto
        </h1>
        <p className="text-gray-600 mb-8">Completa los datos del producto</p>

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
                Precio original (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("price", { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                placeholder="Ej: 50.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.price.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Precio antes de descuento. Si no hay descuento, es el precio
                final.
              </p>
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
                Ej: 10 → precio final = 45 € (50 − 10%)
              </p>
            </div>
          </div>
          {typeof watch("price") === "number" &&
            watch("price") > 0 &&
            (watch("discountPercent") ?? 0) > 0 && (
              <p className="text-sm font-medium text-[#6B5BB6]">
                Precio de venta:{" "}
                {(
                  watch("price") *
                  (1 - (watch("discountPercent") ?? 0) / 100)
                ).toFixed(2)}{" "}
                €
              </p>
            )}

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
              disabled={loading}
              className="flex-1 bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              {loading ? "Guardando..." : "Crear producto"}
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
