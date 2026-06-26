"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Plus, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createProduct } from "@/lib/firebase/products";
import { getActiveCategories, getSubcategoriesByParentSlug } from "@/lib/firebase/categories";
import type { ProductImage as ProductImageType } from "@/types";
import { getAuthHeaders } from "@/lib/auth-headers";
import { uploadAdminMedia } from "@/lib/admin-media-upload";
import { parseProductAttributesText } from "@/lib/parse-attributes-text";
import { matchSubcategoryToAllowedList } from "@/lib/product-subcategory";
import {
  parseAdminPurchaseOptionRows,
  allPurchaseSelections,
} from "@/lib/product-purchase-options";
import { variantSelectionKey } from "@/lib/cart-line-id";
import VariantStockTable from "@/components/admin/VariantStockTable";

const productSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0").optional(),
  discountPercent: z.number().min(0).max(99).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  inStock: z.boolean().optional(),
  stock: z.number().min(0, "Stock debe ser >= 0").optional(),
  featured: z.boolean().optional(),
  tags: z.string().optional(),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.number().min(0).optional().nullable(),
  attributesText: z.string().optional(), // "Clave: Valor" uno por línea
});

type ProductFormData = z.infer<typeof productSchema>;

type PurchaseOptionRow = { id: string; name: string; valuesText: string };

function newPurchaseRowId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `po-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface UploadedImage {
  id: string;
  publicId: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  isPrimary: boolean;
  mediaType: "image" | "video";
  mimeType?: string;
}

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"];
const ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".m4v", ".hevc", ".webm", ".avi", ".wmv", ".3gp", ".3g2", ".mts", ".m2ts"];

export default function NuevoProductoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [subcategories, setSubcategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [purchaseOptionRows, setPurchaseOptionRows] = useState<
    PurchaseOptionRow[]
  >([]);
  const [variantStockByKey, setVariantStockByKey] = useState<
    Record<string, number>
  >({});

  const parsedPurchaseOptions = useMemo(
    () => parseAdminPurchaseOptionRows(purchaseOptionRows),
    [purchaseOptionRows]
  );

  useEffect(() => {
    if (!parsedPurchaseOptions?.length) {
      setVariantStockByKey({});
      return;
    }
    const combos = allPurchaseSelections(parsedPurchaseOptions);
    setVariantStockByKey((prev) => {
      const next: Record<string, number> = {};
      for (const sel of combos) {
        const k = variantSelectionKey(sel);
        next[k] = prev[k] ?? 0;
      }
      return next;
    });
  }, [parsedPurchaseOptions]);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
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
      setCategories(
        cats
          .filter((c) => !c.parentId)
          .map((c) => ({ id: c.id, name: c.name, slug: c.slug }))
      )
    );
  }, []);

  const selectedCategory = watch("category");
  const watchedSubcategory = watch("subcategory");
  const watchedPrice = watch("price");
  const watchedDiscount = watch("discountPercent") ?? 0;
  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setValue("subcategory", "");
      return;
    }
    getSubcategoriesByParentSlug(selectedCategory)
      .then((subs) => {
        const list = subs.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
        }));
        setSubcategories(list);
        const current = getValues("subcategory")?.trim() ?? "";
        if (!current) return;
        const hit = matchSubcategoryToAllowedList(current, list);
        if (!hit) setValue("subcategory", "");
        else if (hit.slug !== current) setValue("subcategory", hit.slug);
      })
      .catch(() => setSubcategories([]));
  }, [selectedCategory, getValues, setValue]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext)
    );
    const hasAllowedVideoExtension = ALLOWED_VIDEO_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext)
    );
    const normalizedMime = (file.type || "").toLowerCase().split(";")[0].trim();
    const hasValidImageMime = normalizedMime.startsWith("image/");
    const hasValidVideoMime = normalizedMime.startsWith("video/");
    const isImage = hasValidImageMime || hasAllowedExtension;
    const isVideo = hasValidVideoMime || hasAllowedVideoExtension;
    if (!isImage && !isVideo) {
      setError("Formato no válido. Usa imagen o video (JPG, PNG, HEIC, HEIF, MP4, MOV, HEVC, etc).");
      return;
    }
    const maxSize = isVideo ? 30 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(isVideo ? "El video no puede ser mayor a 30MB" : "La imagen no puede ser mayor a 5MB");
      return;
    }
    setUploadingImage(true);
    setError(null);
    setUploadStatus(null);
    try {
      const data = await uploadAdminMedia(file, "products", (p) => {
        setUploadStatus(p.message);
      });
      const hasAnyImage = images.some((media) => media.mediaType === "image");
      setImages((prev) => [
        ...prev,
        {
          id: `img-${Date.now()}`,
          publicId: data.publicId,
          url: data.url,
          alt: "",
          width: data.width || 800,
          height: data.height || 800,
          isPrimary: !hasAnyImage && (data.resourceType || "image") !== "video",
          mediaType: (data.resourceType || "image") === "video" ? "video" : "image",
          mimeType: file.type || undefined,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al subir el archivo";
      if (message.toLowerCase().includes("did not match the expected pattern")) {
        setError("No se pudo procesar el video HEVC. Prueba grabar en 'Más compatible' (H.264) o convertirlo a MP4/MOV antes de subir.");
      } else {
        setError(message);
      }
    } finally {
      setUploadingImage(false);
      setUploadStatus(null);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      if (next.length && next.every((img) => !img.isPrimary)) {
        const firstImageIndex = next.findIndex((img) => img.mediaType === "image");
        if (firstImageIndex >= 0) next[firstImageIndex].isPrimary = true;
      }
      return next;
    });
  };

  const setPrimary = (id: string) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id === id && img.mediaType === "video") {
          return img;
        }
        return { ...img, isPrimary: img.mediaType === "image" && img.id === id };
      })
    );
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);
      setError(null);
      const productName = data.name?.trim() || "";
      const productDescription = data.description?.trim() || "";
      const productImages: ProductImageType[] = images.map((img) => ({
        id: img.id,
        publicId: img.publicId,
        url: img.url,
        alt: img.alt || productName,
        width: img.width,
        height: img.height,
        isPrimary: img.isPrimary,
        mediaType: img.mediaType,
        ...(img.mimeType ? { mimeType: img.mimeType } : {}),
      }));
      const purchaseOptions = parseAdminPurchaseOptionRows(
        purchaseOptionRows
      );
      const attributes = parseProductAttributesText(data.attributesText);
      if (data.attributesText?.trim() && Object.keys(attributes).length === 0) {
        setError(
          "Hay texto en atributos adicionales pero no se pudo leer ningún par. Usa una línea por par con el formato Clave: Valor (dos puntos normal)."
        );
        setLoading(false);
        return;
      }
      const rawSub = data.subcategory?.trim() ?? "";
      let subToSave: string | undefined;
      if (rawSub) {
        const hit = matchSubcategoryToAllowedList(rawSub, subcategories);
        if (!hit) {
          setError(
            "La subcategoría no coincide con ninguna activa de la categoría elegida. Elige una opción del desplegable (o “Sin subcategoría”)."
          );
          setLoading(false);
          return;
        }
        subToSave = hit.slug;
      } else {
        subToSave = undefined;
      }
      const originalPriceEur = data.price ?? 0;
      const discount =
        data.discountPercent != null && data.discountPercent > 0
          ? data.discountPercent
          : 0;
      const salePriceEur = originalPriceEur * (1 - discount / 100);
      let stockNum = data.stock ?? 0;
      let variantStockPayload: Record<string, number> | undefined;
      if (purchaseOptions && purchaseOptions.length > 0) {
        const combos = allPurchaseSelections(purchaseOptions);
        variantStockPayload = {};
        for (const sel of combos) {
          const k = variantSelectionKey(sel);
          variantStockPayload[k] = Math.max(
            0,
            Math.floor(Number(variantStockByKey[k]) || 0)
          );
        }
        stockNum = Object.values(variantStockPayload).reduce((a, b) => a + b, 0);
      }
      const product = {
        name: productName,
        description: productDescription,
        price: Math.round(salePriceEur * 100),
        originalPrice:
          discount > 0 && originalPriceEur > 0
            ? Math.round(originalPriceEur * 100)
            : undefined,
        category: data.category?.trim() || "",
        subcategory: subToSave,
        images: productImages,
        inStock: data.inStock ?? true,
        stock: stockNum,
        featured: data.featured ?? false,
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
        // Sin valor → no se guarda peso (no aparece en la ficha)
        weight:
          data.weight != null && !Number.isNaN(data.weight) ? data.weight : undefined,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        ...(purchaseOptions ? { purchaseOptions } : {}),
        ...(variantStockPayload && Object.keys(variantStockPayload).length > 0
          ? { variantStock: variantStockPayload }
          : {}),
        seo: {
          title: productName,
          description: productDescription.substring(0, 160),
          keywords: data.tags
            ? data.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        },
      };
      await createProduct(product);
      try {
        sessionStorage.setItem("adminProductosFlash", "created");
      } catch {
        /* ignore */
      }
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
    <div className="admin-shell">
      <div className="max-w-4xl mx-auto min-w-0">
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
          noValidate
          className="bg-white rounded-lg shadow-md p-6 md:p-8 space-y-6"
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg border-2 border-red-600 bg-red-50 px-4 py-4 text-red-900 shadow-md"
            >
              <p className="font-semibold text-base">Error</p>
              <p className="mt-1 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
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
              Descripción
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
                Precio original (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("price", {
                  setValueAs: (v) => (v === "" || Number.isNaN(Number(v)) ? undefined : Number(v)),
                })}
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
                {...register("discountPercent", {
                  setValueAs: (v) =>
                    v === "" || Number.isNaN(Number(v)) ? undefined : Number(v),
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                placeholder="Ej: 10"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ej: 10 → precio final = 45 € (50 − 10%)
              </p>
            </div>
          </div>
          {typeof watchedPrice === "number" &&
            watchedPrice > 0 &&
            watchedDiscount > 0 && (
              <p className="text-sm font-medium text-[#6B5BB6]">
                Precio de venta:{" "}
                {(watchedPrice * (1 - watchedDiscount / 100)).toFixed(2)} €
              </p>
            )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcategoría (opcional)
            </label>
            <select
              {...register("subcategory")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              disabled={!selectedCategory || subcategories.length === 0}
            >
              <option value="">
                {selectedCategory
                  ? subcategories.length > 0
                    ? "— Sin subcategoría —"
                    : "No hay subcategorías para esta categoría"
                  : "Selecciona una categoría primero"}
              </option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Solo se guarda el <strong>slug</strong> de la subcategoría (el mismo que en Admin → Categorías). El desplegable muestra el nombre para evitar errores.
            </p>
            {selectedCategory && subcategories.length > 0 && watchedSubcategory?.trim()
              ? (() => {
                  const hit = matchSubcategoryToAllowedList(
                    watchedSubcategory,
                    subcategories
                  );
                  return hit ? (
                    <p className="mt-1 text-xs text-gray-600">
                      Slug que se usará en la tienda:{" "}
                      <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">
                        {hit.slug}
                      </code>
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-amber-800">
                      Este valor no coincide con ninguna subcategoría de la categoría actual. Elige una del listado o “Sin subcategoría”.
                    </p>
                  );
                })()
              : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Multimedia (imágenes y videos)
            </label>
            <div className="flex flex-wrap gap-4 items-start">
              {images.map((img) => (
                <div key={img.id} className="flex w-28 shrink-0 flex-col">
                  <div className="w-28 h-28 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                    {img.mediaType === "video" ? (
                      <video
                        src={img.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {img.mediaType === "image" && img.isPrimary ? (
                    <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[#6B5BB6]">
                      Principal
                    </p>
                  ) : (
                    <span className="mt-1 block h-4" aria-hidden />
                  )}
                  <div className="mt-1 flex w-full flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPrimary(img.id)}
                      disabled={img.mediaType === "video"}
                      className="touch-manipulation w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-center text-[11px] font-medium leading-tight text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {img.mediaType === "video"
                        ? "Video (no portada)"
                        : img.isPrimary
                          ? "Es la portada"
                          : "Poner como portada"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="touch-manipulation flex w-full items-center justify-center gap-1 rounded-md bg-red-500 px-2 py-2 text-[11px] font-medium text-white hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              <label className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#6B5BB6] transition-colors">
                <input
                  type="file"
                  accept="image/*,video/*,.heic,.heif,.mov,.m4v"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <span className="text-sm text-gray-500">
                    {uploadStatus || "Subiendo…"}
                  </span>
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
                {parsedPurchaseOptions && parsedPurchaseOptions.length > 0
                  ? "Stock total (suma de variantes)"
                  : "Stock"}
              </label>
              {parsedPurchaseOptions && parsedPurchaseOptions.length > 0 ? (
                <p className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 font-medium">
                  {Object.values(variantStockByKey).reduce(
                    (a, v) => a + Math.max(0, Math.floor(Number(v)) || 0),
                    0
                  )}{" "}
                  uds.
                </p>
              ) : (
                <>
                  <input
                    type="number"
                    min="0"
                    {...register("stock", {
                      setValueAs: (v) =>
                        v === "" || Number.isNaN(Number(v))
                          ? undefined
                          : Number(v),
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.stock.message}
                    </p>
                  )}
                </>
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
              {/* Subcategoría se gestiona arriba como dropdown */}
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
                    Peso (gramos) – opcional
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("weight", {
                      setValueAs: (v) =>
                        v === "" || Number.isNaN(Number(v))
                          ? undefined
                          : Number(v),
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                    placeholder="Ej: 15"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Déjalo vacío si no quieres mostrar peso en la ficha del producto.
                  </p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Opciones al comprar (talles, medidas…)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPurchaseOptionRows((rows) => [
                        ...rows,
                        { id: newPurchaseRowId(), name: "", valuesText: "" },
                      ])
                    }
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#6B5BB6] hover:text-[#5B4BA5]"
                  >
                    <Plus className="h-4 w-4" />
                    Añadir opción
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Cada fila es un desplegable en la tienda: nombre (ej. Talle) y
                  valores, uno por línea o separados por coma.
                </p>
                {purchaseOptionRows.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    Sin opciones: el producto se añade al carrito directamente.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {purchaseOptionRows.map((row, idx) => (
                      <li
                        key={row.id}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start border-t border-gray-100 pt-3 first:border-0 first:pt-0"
                      >
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nombre ({idx + 1})
                          </label>
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) =>
                              setPurchaseOptionRows((rows) =>
                                rows.map((r) =>
                                  r.id === row.id
                                    ? { ...r, name: e.target.value }
                                    : r
                                )
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                            placeholder="Ej: Talle, Talla de anillo"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 min-w-0">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Valores
                            </label>
                            <textarea
                              value={row.valuesText}
                              onChange={(e) =>
                                setPurchaseOptionRows((rows) =>
                                  rows.map((r) =>
                                    r.id === row.id
                                      ? { ...r, valuesText: e.target.value }
                                      : r
                                  )
                                )
                              }
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] text-sm"
                              placeholder={"S\nM\nL\no: S, M, L"}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setPurchaseOptionRows((rows) =>
                                rows.filter((r) => r.id !== row.id)
                              )
                            }
                            className="mt-6 p-2 text-gray-400 hover:text-red-600 rounded-lg border border-transparent hover:border-red-100"
                            aria-label="Quitar opción"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {parsedPurchaseOptions && parsedPurchaseOptions.length > 0 && (
                <VariantStockTable
                  options={parsedPurchaseOptions}
                  value={variantStockByKey}
                  onChange={setVariantStockByKey}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Atributos adicionales
                </label>
                <textarea
                  {...register("attributesText")}
                  rows={4}
                  autoComplete="off"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="none"
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
