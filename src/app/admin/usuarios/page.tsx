"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Mail, Phone, MapPin, ShoppingCart } from "lucide-react";
import { getOrders } from "@/lib/firebase/orders";
import type { Order } from "@/types";

interface UserSummary {
  email: string;
  name: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: Date;
  addresses: Set<string>;
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const orders = await getOrders();
      const userMap = new Map<string, UserSummary>();

      orders.forEach((order) => {
        if (!order.customerEmail) return;
        const email = order.customerEmail.toLowerCase();

        if (!userMap.has(email)) {
          userMap.set(email, {
            email: order.customerEmail,
            name: order.customerName || "Sin nombre",
            phone: order.customerPhone,
            orderCount: 0,
            totalSpent: 0,
            addresses: new Set(),
          });
        }

        const user = userMap.get(email)!;
        user.orderCount++;
        user.totalSpent += order.total;
        if (
          !user.lastOrderDate ||
          new Date(order.createdAt) > user.lastOrderDate
        ) {
          user.lastOrderDate = new Date(order.createdAt);
        }
        const addr = order.shippingAddress;
        const addrStr = `${addr.street}, ${addr.city}, ${addr.postalCode}`;
        user.addresses.add(addrStr);
      });

      const userList = Array.from(userMap.values()).sort(
        (a, b) => (b.lastOrderDate?.getTime() || 0) - (a.lastOrderDate?.getTime() || 0)
      );
      setUsers(userList);
      setError(null);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatDate = (d?: Date) =>
    d
      ? new Date(d).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Usuarios</h1>
        <p className="text-gray-600">
          Clientes que han realizado pedidos en la tienda
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por email o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-xl text-gray-600 mb-4">
            {searchTerm
              ? "No se encontraron usuarios con ese criterio."
              : "No hay usuarios registrados aún."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pedidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total gastado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Último pedido
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.email} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {user.phone && (
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {user.phone}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {user.addresses.size} dirección{user.addresses.size > 1 ? "es" : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {user.orderCount} pedido{user.orderCount > 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {formatPrice(user.totalSpent)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(user.lastOrderDate)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/pedidos?search=${encodeURIComponent(user.email)}`}
                    >
                      <button
                        className="text-[#6B5BB6] hover:text-[#5B4BA5] p-2 hover:bg-[#6B5BB6]/10 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Ver pedidos"
                      >
                        <Eye className="h-5 w-5" />
                        Ver pedidos
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!searchTerm && (
        <div className="mt-6 text-sm text-gray-600 text-center">
          Total: {users.length} usuario{users.length > 1 ? "s" : ""} con pedidos
        </div>
      )}
    </div>
  );
}
