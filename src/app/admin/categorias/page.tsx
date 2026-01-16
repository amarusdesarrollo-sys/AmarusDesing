"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import {
  getAllCategories,
  deleteCategory,
  updateCategory,
} from "@/lib/firebase/categories";
import type { Category } from "@/types";

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const allCategories = await getAllCategories();
      setCategories(allCategories);
      setError(null);
    } catch (err) {
      console.error("Error loading categories:", err);
      setError("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await updateCategory(category.id, {
        ...category,
        active: !category.active,
      });
      await loadCategories(); // Recargar lista
    } catch (err) {
      console.error("Error updating category:", err);
      alert("Error al actualizar categoría");
    }
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar la categoría "${categoryName}"? Esta acción marcará la categoría como inactiva.`
      )
    ) {
      return;
    }

    try {
      await deleteCategory(categoryId);
      await loadCategories(); // Recargar lista
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Error al eliminar categoría");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6] mb-4"></div>
            <p className="text-xl text-gray-600">Cargando categorías...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Gestión de Categorías
            </h1>
            <p className="text-gray-600">
              Crea y gestiona las categorías de productos
            </p>
          </div>
          <Link href="/admin/categorias/nueva">
            <button className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] transition-colors flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nueva Categoría
            </button>
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Lista de categorías */}
        {categories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-xl text-gray-600 mb-4">
              No hay categorías creadas aún.
            </p>
            <Link href="/admin/categorias/nueva">
              <button className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] transition-colors">
                Crear Primera Categoría
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className={!category.active ? "opacity-50" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                      {category.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {category.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        /categorias/{category.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          category.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {category.active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/categorias/${category.id}/editar`}>
                          <button className="text-[#6B5BB6] hover:text-[#5B4BA5] p-2 hover:bg-gray-100 rounded transition-colors">
                            <Edit className="h-5 w-5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleToggleActive(category)}
                          className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded transition-colors"
                          title={
                            category.active
                              ? "Desactivar categoría"
                              : "Activar categoría"
                          }
                        >
                          {category.active ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(category.id, category.name)
                          }
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar categoría"
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
        )}
      </div>
    </div>
  );
}
