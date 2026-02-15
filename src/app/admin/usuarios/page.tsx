"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  Mail,
  Phone,
  MapPin,
  Ban,
  CheckCircle,
  X,
  ChevronDown,
} from "lucide-react";
import { getOrders } from "@/lib/firebase/orders";
import {
  getAllUserProfiles,
  setUserBlocked,
} from "@/lib/firebase/users";
import type { Order } from "@/types";
import type { UserProfile } from "@/lib/firebase/users";

interface AdminUserRow {
  uid: string | null;
  email: string;
  name: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: Date;
  addresses: Set<string>;
  blocked: boolean;
  profile?: UserProfile;
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null);
  const [detailOrders, setDetailOrders] = useState<Order[]>([]);
  const [blockingUid, setBlockingUid] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [profiles, orders] = await Promise.all([
        getAllUserProfiles(),
        getOrders(),
      ]);

      const userMap = new Map<string, AdminUserRow>();

      for (const { uid, profile } of profiles) {
        userMap.set(uid, {
          uid,
          email: profile.email || "",
          name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Sin nombre",
          phone: profile.phone,
          orderCount: 0,
          totalSpent: 0,
          addresses: new Set(),
          blocked: profile.blocked ?? false,
          profile,
        });
      }

      orders.forEach((order) => {
        const email = (order.customerEmail || "").toLowerCase();
        if (!email) return;

        const isRegistered = order.userId && order.userId !== "guest";
        const targetKey = isRegistered ? order.userId! : `guest:${email}`;

        if (!userMap.has(targetKey)) {
          userMap.set(targetKey, {
            uid: isRegistered ? order.userId! : null,
            email: order.customerEmail || "",
            name: order.customerName || "Sin nombre",
            phone: order.customerPhone,
            orderCount: 0,
            totalSpent: 0,
            addresses: new Set(),
            blocked: false,
            profile: undefined,
          });
        }

        const row = userMap.get(targetKey)!;
        row.orderCount++;
        row.totalSpent += order.total;
        if (!row.lastOrderDate || new Date(order.createdAt) > row.lastOrderDate) {
          row.lastOrderDate = new Date(order.createdAt);
        }
        const addr = order.shippingAddress;
        row.addresses.add(`${addr.street}, ${addr.city}, ${addr.postalCode}`);
      });

      const list = Array.from(userMap.values()).sort(
        (a, b) => (b.lastOrderDate?.getTime() || 0) - (a.lastOrderDate?.getTime() || 0)
      );
      setUsers(list);
      setError(null);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (uid: string, blocked: boolean) => {
    if (!uid) return;
    try {
      setBlockingUid(uid);
      await setUserBlocked(uid, blocked);
      await loadUsers();
    } catch (err) {
      console.error("Error blocking user:", err);
      setError("Error al bloquear/desbloquear. ¿Tienes las reglas de Firestore configuradas para que el admin pueda escribir en users?");
    } finally {
      setBlockingUid(null);
    }
  };

  const openDetail = async (user: AdminUserRow) => {
    setDetailUser(user);
    if (user.email) {
      const orders = await getOrders();
      setDetailOrders(
        orders.filter(
          (o) =>
            o.customerEmail?.toLowerCase() === user.email.toLowerCase() ||
            o.userId === user.uid
        )
      );
    } else {
      setDetailOrders([]);
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
          Clientes registrados y datos de pedidos. Los usuarios bloqueados no
          pueden acceder a Mi cuenta.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

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
              : "No hay usuarios aún."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
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
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pedidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Último pedido
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.uid || user.email} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.uid && (
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          {user.uid.slice(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.phone && (
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {user.phone}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {user.addresses.size} dirección
                        {user.addresses.size !== 1 ? "es" : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.blocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <Ban className="h-3.5 w-3.5" />
                          Bloqueado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Activo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user.orderCount} pedido{user.orderCount !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatPrice(user.totalSpent)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(user.lastOrderDate)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(user)}
                          className="text-[#6B5BB6] hover:text-[#5B4BA5] p-2 hover:bg-[#6B5BB6]/10 rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Ver datos"
                        >
                          <Eye className="h-5 w-5" />
                          Ver datos
                        </button>
                        {user.uid && (
                          user.blocked ? (
                            <button
                              onClick={() => handleBlock(user.uid!, false)}
                              disabled={blockingUid === user.uid}
                              className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors"
                              title="Desbloquear"
                            >
                              {blockingUid === user.uid ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <CheckCircle className="h-5 w-5" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(user.uid!, true)}
                              disabled={blockingUid === user.uid}
                              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Bloquear"
                            >
                              {blockingUid === user.uid ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <Ban className="h-5 w-5" />
                              )}
                            </button>
                          )
                        )}
                        {user.email && (
                          <Link
                            href={`/admin/pedidos?search=${encodeURIComponent(user.email)}`}
                            className="text-[#6B5BB6] hover:text-[#5B4BA5] p-2 hover:bg-[#6B5BB6]/10 rounded-lg transition-colors"
                            title="Ver pedidos"
                          >
                            <ChevronDown className="h-5 w-5 rotate-[-90deg]" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!searchTerm && (
        <div className="mt-6 text-sm text-gray-600 text-center">
          Total: {users.length} usuario{users.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Modal Ver datos */}
      {detailUser && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4"
          onClick={() => setDetailUser(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Datos del usuario
              </h2>
              <button
                onClick={() => setDetailUser(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Perfil</h3>
                <div className="space-y-1 text-gray-600">
                  <p>
                    <strong>Nombre:</strong> {detailUser.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {detailUser.email}
                  </p>
                  {detailUser.phone && (
                    <p>
                      <strong>Teléfono:</strong> {detailUser.phone}
                    </p>
                  )}
                  {detailUser.uid && (
                    <p>
                      <strong>UID:</strong>{" "}
                      <span className="font-mono text-sm">{detailUser.uid}</span>
                    </p>
                  )}
                </div>
              </div>

              {detailUser.profile?.addresses && detailUser.profile.addresses.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Direcciones
                  </h3>
                  <ul className="space-y-2">
                    {detailUser.profile.addresses.map((addr, i) => (
                      <li
                        key={i}
                        className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg"
                      >
                        {addr.street}
                        {addr.street2 && `, ${addr.street2}`}
                        <br />
                        {addr.postalCode} {addr.city}
                        {addr.region && `, ${addr.region}`}
                        <br />
                        {addr.country}
                        {addr.isDefault && (
                          <span className="text-[#6B5BB6] ml-2">(por defecto)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detailOrders.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Pedidos ({detailOrders.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detailOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/admin/pedidos/${order.id}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-medium">
                          #{order.id.slice(0, 8)} - {formatPrice(order.total)}
                        </span>
                        <span className="text-gray-500 text-sm ml-2">
                          {formatDate(order.createdAt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {detailOrders.length === 0 && !detailUser.profile?.addresses?.length && (
                <p className="text-gray-500 text-sm">
                  No hay más datos disponibles.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
