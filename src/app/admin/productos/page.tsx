"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, Package, Search, Filter, X, CheckCircle2, CheckSquare, Square } from "lucide-react";
import { getAllProducts, deactivateProduct, activateProduct, clearProductCaches } from "@/lib/firebase/products";
import { getAllCategories } from "@/lib/firebase/categories";
import { getAdminThumbnailUrl } from "@/lib/cloudinary";
import type { Product, Category } from "@/types";
import { getAuthHeaders } from "@/lib/auth-headers";
import { totalSellableStock } from "@/lib/product-purchase-options";

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [flashSuccess, setFlashSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    try {
      const v = sessionStorage.getItem("adminProductosFlash");
      if (v === "created") {
        setFlashSuccess("Producto creado correctamente.");
        sessionStorage.removeItem("adminProductosFlash");
      } else if (v === "updated") {
        setFlashSuccess("Producto actualizado correctamente.");
        sessionStorage.removeItem("adminProductosFlash");
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    filterProducts();
    setSelectedIds(new Set());
  }, [searchTerm, categoryFilter, stockFilter, statusFilter, allProducts]);

  const revalidateStorefront = async () => {
    try {
      await fetch("/api/admin/revalidate-catalog", {
        method: "POST",
        headers: await getAuthHeaders(),
      });
    } catch {
      /* ignore */
    }
  };

  const reloadProductsList = async () => {
    clearProductCaches();
    const list = await getAllProducts({ fresh: true });
    setAllProducts(list);
    setError(null);
  };

  const loadCategories = async () => {
    try {
      const cats = await getAllCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      clearProductCaches();
      const list = await getAllProducts({ fresh: true });
      setAllProducts(list);
      setProducts(list);
      setError(null);
    } catch (err) {
      console.error("Error loading products:", err);
      setError(
        "No se pudieron cargar los productos. Comprueba la conexión e inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...allProducts];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.inStock);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((p) => !p.inStock);
    }

    if (stockFilter === "low") {
      filtered = filtered.filter(
        (p) => totalSellableStock(p) < 10 && p.inStock
      );
    } else if (stockFilter === "out") {
      filtered = filtered.filter(
        (p) => !p.inStock || totalSellableStock(p) === 0
      );
    } else if (stockFilter === "in") {
      filtered = filtered.filter(
        (p) => p.inStock && totalSellableStock(p) > 0
      );
    }

    setProducts(filtered);
  };

  const handleToggleStock = async (product: Product) => {
    const action = product.inStock ? "desactivar" : "activar";
    if (!confirm(`¿${action === "desactivar" ? "Desactivar" : "Activar"} "${product.name}"?`)) return;
    try {
      if (product.inStock) {
        await deactivateProduct(product.id);
      } else {
        await activateProduct(product.id);
      }
      clearProductCaches();
      await reloadProductsList();
      await revalidateStorefront();
      setFlashSuccess(
        action === "desactivar"
          ? `"${product.name}" desactivado. Ya no aparece en la tienda.`
          : `"${product.name}" activado. Ya visible en la tienda.`
      );
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      alert(`Error al ${action} el producto`);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const runBulkAction = async (action: "deactivate" | "activate" | "delete") => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    if (action === "deactivate") {
      const n = ids.filter((id) => products.find((p) => p.id === id)?.inStock).length;
      if (n === 0) {
        alert("Ninguno de los seleccionados está activo.");
        return;
      }
      if (!confirm(`¿Desactivar ${n} producto(s)? No se verán en la tienda.`)) return;
    } else if (action === "activate") {
      const n = ids.filter((id) => !products.find((p) => p.id === id)?.inStock).length;
      if (n === 0) {
        alert("Ninguno de los seleccionados está desactivado.");
        return;
      }
      if (!confirm(`¿Activar ${n} producto(s)?`)) return;
    }

    try {
      setBulkWorking(true);
      setError(null);
      const res = await fetch("/api/admin/bulk-products", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({ action, productIds: ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Error en la operación masiva");
      }
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      setFlashSuccess(data.message || "Operación completada.");
      clearProductCaches();
      await reloadProductsList();
    } catch (err) {
      console.error("Bulk action error:", err);
      setError(err instanceof Error ? err.message : "Error en operación masiva");
    } finally {
      setBulkWorking(false);
    }
  };

  const handleDeletePermanently = async () => {
    if (!productToDelete) return;
    try {
      const res = await fetch("/api/admin/delete-product", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({ productId: productToDelete.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Error al eliminar definitivamente");
      }
      setProductToDelete(null);
      setFlashSuccess("Producto eliminado. Imágenes y vídeos borrados de Storage.");
      clearProductCaches();
      await reloadProductsList();
    } catch (err) {
      console.error("Error eliminando producto:", err);
      alert("Error al eliminar el producto");
    }
  };

  const primaryImage = (p: Product) => {
    const primary =
      p.images?.find((img) => img.isPrimary && img.mediaType !== "video") ||
      p.images?.find((img) => img.mediaType !== "video");
    if (!primary) return null;
    const source = primary.url || primary.publicId;
    if (!source) return null;
    return getAdminThumbnailUrl(source);
  };

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="flex justify-center items-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {flashSuccess && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-lg border-2 border-emerald-600 bg-emerald-50 px-4 py-4 text-emerald-950 shadow-md"
        >
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700 mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base">Listo</p>
            <p className="mt-0.5 text-sm leading-relaxed">{flashSuccess}</p>
          </div>
          <button
            type="button"
            onClick={() => setFlashSuccess(null)}
            className="shrink-0 rounded p-1 text-emerald-800 hover:bg-emerald-100"
            aria-label="Cerrar aviso"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 sm:text-4xl">Productos</h1>
          <p className="text-gray-700">Gestiona el catálogo de la tienda</p>
        </div>
        <Link href="/admin/productos/nuevo" className="w-full sm:w-auto shrink-0">
          <button className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] transition-colors flex w-full items-center justify-center gap-2 sm:w-auto">
            <Plus className="h-5 w-5" />
            Nuevo producto
          </button>
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border-2 border-red-600 bg-red-50 px-4 py-4 text-red-900 shadow-md"
        >
          <p className="font-semibold text-base">Error</p>
          <p className="mt-1 text-sm leading-relaxed">{error}</p>
        </div>
      )}

      {/* Búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, descripción..."
              aria-label="Buscar productos por nombre o descripción"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoría"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
          >
            <option value="">Todas las categorías</option>
            {categories
              .filter((c) => c.active)
              .map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estado del producto"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
          >
            <option value="">Activos y desactivados</option>
            <option value="active">Solo activos</option>
            <option value="inactive">Solo desactivados</option>
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            aria-label="Filtrar por stock"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6] sm:col-span-2 lg:col-span-1"
          >
            <option value="">Todo el stock</option>
            <option value="in">En stock</option>
            <option value="low">Stock bajo (&lt;10)</option>
            <option value="out">Sin stock</option>
          </select>
        </div>
        {(searchTerm || categoryFilter || stockFilter || statusFilter) && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
            <Filter className="h-4 w-4" />
            <span>
              Mostrando {products.length} de {allProducts.length} productos
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("");
                setStockFilter("");
                setStatusFilter("");
              }}
              className="text-[#6B5BB6] hover:underline ml-2"
              aria-label="Limpiar todos los filtros de búsqueda"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#6B5BB6]/30 bg-[#6B5BB6]/5 px-4 py-3">
          <span className="text-sm font-medium text-gray-800">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            disabled={bulkWorking}
            onClick={() => runBulkAction("deactivate")}
            className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50"
          >
            Desactivar
          </button>
          <button
            type="button"
            disabled={bulkWorking}
            onClick={() => runBulkAction("activate")}
            className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50"
          >
            Activar
          </button>
          <button
            type="button"
            disabled={bulkWorking}
            onClick={() => setBulkDeleteOpen(true)}
            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
          >
            Eliminar definitivamente
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-gray-600 hover:text-gray-900"
          >
            Limpiar selección
          </button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-4">No hay productos aún.</p>
          <Link href="/admin/productos/nuevo">
            <button className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] transition-colors">
              Crear primer producto
            </button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="p-1 text-gray-600 hover:text-[#6B5BB6]"
                      aria-label={
                        selectedIds.size === products.length
                          ? "Desmarcar todos"
                          : "Seleccionar todos"
                      }
                    >
                      {selectedIds.size === products.length && products.length > 0 ? (
                        <CheckSquare className="h-5 w-5" aria-hidden />
                      ) : (
                        <Square className="h-5 w-5" aria-hidden />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Imagen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`${!product.inStock ? "opacity-60" : ""} ${
                      selectedIds.has(product.id) ? "bg-[#6B5BB6]/5" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSelect(product.id)}
                        className="p-1 text-gray-600 hover:text-[#6B5BB6]"
                        aria-label={
                          selectedIds.has(product.id)
                            ? `Quitar selección de ${product.name}`
                            : `Seleccionar ${product.name}`
                        }
                      >
                        {selectedIds.has(product.id) ? (
                          <CheckSquare className="h-5 w-5 text-[#6B5BB6]" aria-hidden />
                        ) : (
                          <Square className="h-5 w-5" aria-hidden />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {primaryImage(product) ? (
                          <Image
                            src={primaryImage(product)!}
                            alt=""
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            unoptimized
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-sm text-gray-700 truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      €{(product.price / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {totalSellableStock(product)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          product.inStock
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.inStock ? "En stock" : "Desactivado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link
                          href={`/admin/productos/${product.id}/editar`}
                          aria-label={`Editar ${product.name}`}
                          className="p-2 text-[#6B5BB6] hover:bg-[#6B5BB6]/10 rounded-lg transition-colors inline-flex"
                        >
                          <Edit className="h-5 w-5" aria-hidden />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleStock(product)}
                          className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                            product.inStock
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          aria-label={
                            product.inStock
                              ? `Desactivar ${product.name}`
                              : `Activar ${product.name}`
                          }
                        >
                          {product.inStock ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductToDelete(product)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label={`Eliminar permanentemente ${product.name}`}
                        >
                          <Trash2 className="h-5 w-5" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de confirmación borrado definitivo */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ¿Eliminar permanentemente?
            </h3>
            <p className="text-gray-600 mb-4">
              Vas a eliminar <strong>"{productToDelete.name}"</strong> de forma definitiva.
              Esta acción no se puede deshacer. Se borrará de Firestore y sus imágenes/vídeos de Supabase Storage.
            </p>
            <p className="text-sm text-amber-600 mb-6">
              Si solo quieres ocultarlo en la tienda, usa "Desactivar" en lugar de eliminar.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePermanently}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Sí, eliminar permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ¿Eliminar {selectedIds.size} producto(s)?
            </h3>
            <p className="text-gray-600 mb-4">
              Se borrarán de Firestore y se eliminarán automáticamente sus imágenes y vídeos en Supabase Storage.
              Esta acción no se puede deshacer.
            </p>
            <p className="text-sm text-amber-600 mb-6">
              Para ocultarlos en la tienda sin borrar, usa «Desactivar».
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(false)}
                disabled={bulkWorking}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => runBulkAction("delete")}
                disabled={bulkWorking}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {bulkWorking ? "Eliminando…" : "Sí, eliminar todo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
