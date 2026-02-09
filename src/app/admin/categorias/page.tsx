"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import {
  getAllCategories,
  deleteCategory,
  hardDeleteCategory,
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
    const action = prompt(
      `¿Qué acción deseas realizar con "${categoryName}"?\n\n` +
        `1 - Desactivar (soft delete - se puede reactivar después)\n` +
        `2 - Eliminar permanentemente (hard delete - NO se puede recuperar)\n\n` +
        `Escribe "1" o "2":`
    );

    if (!action || (action !== "1" && action !== "2")) {
      return;
    }

    try {
      if (action === "1") {
        // Soft delete
        if (
          confirm(
            `¿Desactivar "${categoryName}"? La categoría dejará de mostrarse pero se puede reactivar después.`
          )
        ) {
          await deleteCategory(categoryId);
          await loadCategories();
        }
      } else {
        // Hard delete
        if (
          confirm(
            `⚠️ ¿ELIMINAR PERMANENTEMENTE "${categoryName}"?\n\nEsta acción NO se puede deshacer. La categoría será borrada de la base de datos.`
          )
        ) {
          await hardDeleteCategory(categoryId);
          await loadCategories();
        }
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Error al eliminar categoría");
    }
  };

  const handleInitializeCategories = async () => {
    if (
      !confirm(
        "¿Deseas crear las 6 categorías iniciales automáticamente? (Joyería Artesanal, Minerales del Mundo, Macramé, Tesoros del Mundo, Ropa Artesanal, Colección Etiopía)"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/init-categories", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `✅ ${data.message}\nSe crearon ${data.created} categorías.`
        );
        await loadCategories(); // Recargar lista
      } else {
        alert(
          data.message ||
            "No se pudieron crear las categorías. Puede que ya existan."
        );
        if (data.existingCount > 0) {
          await loadCategories(); // Recargar lista si ya había categorías
        }
      }
    } catch (err) {
      console.error("Error initializing categories:", err);
      alert("Error al inicializar categorías");
    } finally {
      setLoading(false);
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
    <div className="p-8">
      <div className="w-full">
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleInitializeCategories}
                className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] transition-colors"
              >
                Inicializar Categorías Automáticamente
              </button>
              <span className="text-gray-400">o</span>
              <Link href="/admin/categorias/nueva">
                <button className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                  Crear Manualmente
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Slug
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Orden
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Destacada
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
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
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                      {category.description && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {category.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <code className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        {category.slug}
                      </code>
                    </td>
                    <td className="px-3 py-3 text-center text-sm text-gray-500">
                      {category.order}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                          category.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {category.active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {category.featured ? (
                        <span className="px-2 py-0.5 inline-flex text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                          Sí
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/categorias/${category.id}/editar`}>
                          <button
                            className="bg-[#6B5BB6] text-white p-1.5 rounded hover:bg-[#5B4BA5] transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`p-1.5 rounded transition-colors ${
                            category.active
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                          title={category.active ? "Desactivar" : "Activar"}
                        >
                          {category.active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(category.id, category.name)
                          }
                          className="bg-red-100 text-red-700 p-1.5 rounded hover:bg-red-200 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
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
