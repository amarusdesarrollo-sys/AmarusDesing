"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  FolderTree,
  ShoppingCart,
  TrendingUp,
  Plus,
  AlertCircle,
  Download,
} from "lucide-react";
import { getAllCategories } from "@/lib/firebase/categories";
import { getAllProducts } from "@/lib/firebase/products";
import { getOrders } from "@/lib/firebase/orders";
import type { Category, Order, Product } from "@/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    pendingOrders: 0,
    totalSales: 0,
    lowStockProducts: 0,
    loading: true,
  });
  const [topProducts, setTopProducts] = useState<
    { product: Product; quantity: number }[]
  >([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [categories, products, orders] = await Promise.all([
          getAllCategories(),
          getAllProducts(),
          getOrders(),
        ]);

        const pendingOrders = orders.filter(
          (o) => o.status === "pending" || o.status === "confirmed"
        ).length;

        const completedOrders = orders.filter(
          (o) => o.status === "shipped" || o.status === "delivered"
        );

        const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);

        const lowStockProducts = products.filter((p) => p.stock < 10 && p.inStock).length;

        const productSales: Record<string, number> = {};
        orders.forEach((order) => {
          order.items.forEach((item) => {
            productSales[item.productId] =
              (productSales[item.productId] || 0) + item.quantity;
          });
        });

        const topProductsList = Object.entries(productSales)
          .map(([productId, quantity]) => {
            const product = products.find((p) => p.id === productId);
            return product ? { product, quantity } : null;
          })
          .filter((item): item is { product: Product; quantity: number } => item !== null)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);

        setTopProducts(topProductsList);
        setStats({
          products: products.length,
          categories: categories.length,
          orders: orders.length,
          pendingOrders,
          totalSales,
          lowStockProducts,
          loading: false,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    loadStats();
  }, []);

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  const exportOrdersToCSV = async () => {
    try {
      const orders = await getOrders();
      const STATUS_LABELS: Record<string, string> = {
        pending: "Pendiente",
        confirmed: "Confirmado",
        processing: "En proceso",
        shipped: "Enviado",
        delivered: "Entregado",
        cancelled: "Cancelado",
      };

      const headers = [
        "Número de Pedido",
        "Fecha y Hora",
        "Cliente",
        "Email",
        "Teléfono",
        "Dirección",
        "Ciudad",
        "Código Postal",
        "País",
        "Productos",
        "Cantidad Total",
        "Subtotal",
        "Envío",
        "Total",
        "Estado",
        "Número de Seguimiento",
      ];

      const rows = orders.map((order) => {
        const date = new Date(order.createdAt);
        const fechaHora = `${date.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })} ${date.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;

        const productos = order.items
          .map((i) => `${i.product.name} (x${i.quantity})`)
          .join(" | ");
        const cantidadTotal = order.items.reduce((sum, i) => sum + i.quantity, 0);
        const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        return [
          order.id,
          fechaHora,
          order.customerName || "",
          order.customerEmail || "",
          order.customerPhone || "",
          order.shippingAddress.street +
            (order.shippingAddress.street2 ? `, ${order.shippingAddress.street2}` : ""),
          order.shippingAddress.city,
          order.shippingAddress.postalCode,
          order.shippingAddress.country,
          productos,
          cantidadTotal.toString(),
          formatPrice(subtotal),
          order.shipping === 0 ? "Gratis" : formatPrice(order.shipping),
          formatPrice(order.total),
          STATUS_LABELS[order.status] || order.status,
          order.trackingNumber || "",
        ];
      });

      const csvContent =
        headers.join(",") +
        "\n" +
        rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `pedidos_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Error al exportar pedidos");
    }
  };

  const statCards = [
    {
      title: "Productos",
      value: stats.products,
      icon: Package,
      color: "bg-blue-500",
      href: "/admin/productos",
    },
    {
      title: "Categorías",
      value: stats.categories,
      icon: FolderTree,
      color: "bg-purple-500",
      href: "/admin/categorias",
    },
    {
      title: "Pedidos",
      value: stats.orders,
      icon: ShoppingCart,
      color: "bg-green-500",
      href: "/admin/pedidos",
    },
    {
      title: "Ventas Totales",
      value: formatPrice(stats.totalSales),
      icon: TrendingUp,
      color: "bg-orange-500",
      href: "/admin/pedidos",
    },
  ];

  const quickActions = [
    {
      title: "Nuevo Producto",
      description: "Agregar un producto a la tienda",
      href: "/admin/productos/nuevo",
      icon: Plus,
      color: "bg-[#6B5BB6] hover:bg-[#5B4BA5]",
    },
    {
      title: "Nueva Categoría",
      description: "Crear una nueva categoría",
      href: "/admin/categorias/nueva",
      icon: Plus,
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Dashboard de Administración
        </h1>
        <p className="text-gray-600">
          Gestiona tu tienda desde aquí
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                  {stats.loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-800">
                      {stat.value}
                    </p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Acciones Rápidas */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className={`${action.color} text-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all transform hover:scale-105`}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">
                      {action.title}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Alertas */}
      {(stats.pendingOrders > 0 || stats.lowStockProducts > 0) && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Alertas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.pendingOrders > 0 && (
              <Link
                href="/admin/pedidos?status=pending"
                className="bg-amber-50 border border-amber-200 rounded-lg p-4 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900">
                      {stats.pendingOrders} pedido{stats.pendingOrders > 1 ? "s" : ""} pendiente{stats.pendingOrders > 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-amber-700">
                      Requieren atención
                    </p>
                  </div>
                </div>
              </Link>
            )}
            {stats.lowStockProducts > 0 && (
              <Link
                href="/admin/productos"
                className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">
                      {stats.lowStockProducts} producto{stats.lowStockProducts > 1 ? "s" : ""} con stock bajo
                    </p>
                    <p className="text-sm text-red-700">
                      Menos de 10 unidades
                    </p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Productos más vendidos */}
      {topProducts.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Productos más vendidos
            </h2>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unidades vendidas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map(({ product, quantity }) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {quantity} unidad{quantity > 1 ? "es" : ""}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatPrice(product.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Acciones adicionales */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Herramientas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={exportOrdersToCSV}
            className="bg-white border border-gray-300 rounded-lg shadow-md p-6 hover:shadow-lg transition-all flex items-center gap-4"
          >
            <Download className="h-6 w-6 text-[#6B5BB6]" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Exportar pedidos</h3>
              <p className="text-sm text-gray-600">
                Descargar todos los pedidos en CSV
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Bienvenido al Panel de Administración
        </h2>
        <div className="space-y-3 text-gray-600">
          <p>
            Desde aquí puedes gestionar todos los aspectos de tu tienda:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Productos:</strong> Agrega, edita y elimina productos de
              tu catálogo
            </li>
            <li>
              <strong>Categorías:</strong> Organiza tus productos en categorías
              y subcategorías
            </li>
            <li>
              <strong>Pedidos:</strong> Revisa y gestiona los pedidos de tus
              clientes
            </li>
            <li>
              <strong>Configuración:</strong> Gestiona datos de contacto, redes sociales y envíos
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
