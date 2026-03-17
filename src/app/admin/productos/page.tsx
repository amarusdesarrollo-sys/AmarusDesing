"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, Package, Search, Filter } from "lucide-react";
import { getAllProducts, deactivateProduct, activateProduct } from "@/lib/firebase/products";
import { getAllCategories } from "@/lib/firebase/categories";
import { getCloudinaryBaseUrl } from "@/lib/cloudinary";
import type { Product, Category } from "@/types";
import { getAuthHeaders } from "@/lib/auth-headers";

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("");
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, categoryFilter, stockFilter, allProducts]);

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
      const list = await getAllProducts();
      setAllProducts(list);
      setProducts(list);
      setError(null);
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Error al cargar productos");
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

    if (stockFilter === "low") {
      filtered = filtered.filter((p) => p.stock < 10 && p.inStock);
    } else if (stockFilter === "out") {
      filtered = filtered.filter((p) => !p.inStock || p.stock === 0);
    } else if (stockFilter === "in") {
      filtered = filtered.filter((p) => p.inStock && p.stock > 0);
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
      await loadProducts();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      alert(`Error al ${action} el producto`);
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
      await loadProducts();
    } catch (err) {
      console.error("Error eliminando producto:", err);
      alert("Error al eliminar el producto");
    }
  };

  const primaryImage = (p: Product) => {
    const primary = p.images?.find((img) => img.isPrimary) || p.images?.[0];
    if (!primary?.publicId) return null;
    return getCloudinaryBaseUrl(primary.publicId);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Productos</h1>
          <p className="text-gray-600">Gestiona el catálogo de la tienda</p>
        </div>
        <Link href="/admin/productos/nuevo">
          <button className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] transition-colors flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nuevo producto
          </button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
          >
            <option value="">Todo el stock</option>
            <option value="in">En stock</option>
            <option value="low">Stock bajo (&lt;10)</option>
            <option value="out">Sin stock</option>
          </select>
        </div>
        {(searchTerm || categoryFilter || stockFilter) && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>
              Mostrando {products.length} de {allProducts.length} productos
            </span>
            <button
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("");
                setStockFilter("");
              }}
              className="text-[#6B5BB6] hover:underline ml-2"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

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
                    className={!product.inStock ? "opacity-60" : ""}
                  >
                    <td className="px-4 py-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {primaryImage(product) ? (
                          <Image
                            src={primaryImage(product)!}
                            alt={product.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
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
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      €{(product.price / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          product.inStock
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.inStock ? "En stock" : "Desactivado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link href={`/admin/productos/${product.id}/editar`}>
                          <button
                            className="p-2 text-[#6B5BB6] hover:bg-[#6B5BB6]/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleToggleStock(product)}
                          className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                            product.inStock
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title={product.inStock ? "Desactivar (no se verá en la tienda)" : "Activar"}
                        >
                          {product.inStock ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => setProductToDelete(product)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="h-5 w-5" />
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
              Esta acción no se puede deshacer. El producto se borrará de la base de datos.
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
    </div>
  );
}
