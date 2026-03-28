"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Coupon, Category, Product } from "@/types";
import { createCoupon, deleteCoupon, getAllCoupons } from "@/lib/firebase/coupons";
import { getAllCategories } from "@/lib/firebase/categories";
import { getAllProducts } from "@/lib/firebase/products";

export default function AdminCuponesPage() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const [code, setCode] = useState("");
  const [active, setActive] = useState(true);
  const [scope, setScope] = useState<"category" | "product">("category");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState<number>(10);
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedProductForAdd, setSelectedProductForAdd] = useState<string>("");

  const load = async () => {
    try {
      setLoading(true);
      const [cps, cats, prods] = await Promise.all([
        getAllCoupons(),
        getAllCategories(),
        getAllProducts(),
      ]);
      setCoupons(cps);
      setAllCategories(cats);
      setAllProducts(prods);
      setError(null);
    } catch {
      setError("Error al cargar cupones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const valueLabel = useMemo(() => {
    return discountType === "percent" ? "%" : "€";
  }, [discountType]);

  const handleCreate = async () => {
    if (!code.trim()) {
      alert("Código requerido");
      return;
    }
    if (discountType === "percent" && (value <= 0 || value >= 100)) {
      alert("Porcentaje debe ser 1-99");
      return;
    }
    if (discountType === "fixed" && value < 0) {
      alert("Importe no puede ser negativo");
      return;
    }
    if (scope === "category" && selectedCategorySlugs.length === 0) {
      alert("Selecciona al menos una categoría");
      return;
    }
    if (scope === "product" && selectedProductIds.length === 0) {
      alert("Selecciona al menos un producto");
      return;
    }
    try {
      await createCoupon({
        code,
        active,
        scope,
        discountType,
        value: discountType === "fixed" ? Math.round(value * 100) : Math.round(value),
        categorySlugs: scope === "category" ? selectedCategorySlugs : undefined,
        productIds: scope === "product" ? selectedProductIds : undefined,
      });
      setCode("");
      setSelectedCategorySlugs([]);
      setSelectedProductIds([]);
      setSelectedProductForAdd("");
      await load();
    } catch {
      alert("Error al crear cupón (¿código duplicado?)");
    }
  };

  const formatValue = (c: Coupon) => {
    if (c.discountType === "percent") return `${c.value}%`;
    return `€${(c.value / 100).toFixed(2)}`;
  };

  const toggleCategory = (slug: string) => {
    setSelectedCategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const addSelectedProduct = () => {
    if (!selectedProductForAdd) return;
    setSelectedProductIds((prev) =>
      prev.includes(selectedProductForAdd) ? prev : [...prev, selectedProductForAdd]
    );
  };

  const removeSelectedProduct = (id: string) => {
    setSelectedProductIds((prev) => prev.filter((p) => p !== id));
  };

  if (loading) {
    return (
      <div className="admin-shell flex justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-1">Cupones</h1>
          <p className="text-gray-600">Códigos promocionales por categoría o producto</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Crear cupón
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="AMARUS10"
            />
            <p className="mt-1 text-xs text-gray-500">Se guardará en mayúsculas.</p>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              id="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="active" className="text-sm text-gray-700">
              Cupón activo
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aplica a</label>
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as any);
                setSelectedCategorySlugs([]);
                setSelectedProductIds([]);
                setSelectedProductForAdd("");
              }}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="category">Categoría</option>
              <option value="product">Producto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de descuento
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="percent">Porcentaje (%)</option>
              <option value="fixed">Importe fijo (€)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor ({valueLabel})
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              min={0}
              step={discountType === "fixed" ? "0.01" : "1"}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {scope === "category" ? (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categorías
              </label>
              {allCategories.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay categorías creadas. Crea categorías primero.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.slug)}
                      className={`px-3 py-1 rounded-full text-xs border ${
                        selectedCategorySlugs.includes(cat.slug)
                          ? "bg-[#6B5BB6] text-white border-[#6B5BB6]"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Haz clic para seleccionar una o varias categorías.
              </p>
            </div>
          ) : (
            <div className="md:col-span-2 space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Productos
              </label>
              {allProducts.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay productos creados. Crea productos primero.
                </p>
              ) : (
                <>
                  <div className="flex gap-2">
                    <select
                      value={selectedProductForAdd}
                      onChange={(e) => setSelectedProductForAdd(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    >
                      <option value="">Selecciona un producto</option>
                      {allProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addSelectedProduct}
                      className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                    >
                      Añadir
                    </button>
                  </div>
                  {selectedProductIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedProductIds.map((id) => {
                        const prod = allProducts.find((p) => p.id === id);
                        return (
                          <span
                            key={id}
                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-800"
                          >
                            {prod?.name || id}
                            <button
                              type="button"
                              onClick={() => removeSelectedProduct(id)}
                              className="text-red-500"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Puedes aplicar el cupón a uno o varios productos concretos.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={handleCreate}
            className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5]"
          >
            Crear cupón
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Aplica a
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Descuento
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {coupons.map((c) => (
              <tr key={c.id} className={!c.active ? "opacity-60" : ""}>
                <td className="px-6 py-4 font-semibold text-gray-900">{c.code}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      c.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {c.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {c.scope === "category" ? "Categoría" : "Producto"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{formatValue(c)}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Eliminar el cupón ${c.code}?`)) return;
                      await deleteCoupon(c.id);
                      await load();
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  No hay cupones aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

