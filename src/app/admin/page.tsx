"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  FolderTree,
  ShoppingCart,
  TrendingUp,
  Plus,
} from "lucide-react";
import { getAllCategories } from "@/lib/firebase/categories";
import { getAllProducts } from "@/lib/firebase/products";
import type { Category } from "@/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    loading: true,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [categories, products] = await Promise.all([
          getAllCategories(),
          getAllProducts(),
        ]);

        setStats({
          products: products.length,
          categories: categories.length,
          orders: 0, // TODO: Implementar cuando tengamos órdenes
          loading: false,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    loadStats();
  }, []);

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
      title: "Ventas",
      value: "€0",
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
              <strong>Usuarios:</strong> Administra los usuarios registrados
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
