"use client";

import { useEffect, useState } from "react";
import { Download, Mail, Trash2 } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-headers";

type Subscriber = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  source: string;
  createdAt: string;
};

export default function AdminSuscriptoresPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/newsletter-subscribers", {
        headers: await getAuthHeaders(),
      });
      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        subscribers?: Subscriber[];
        message?: string;
      } | null;
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Error al cargar suscriptores");
      }
      setSubscribers(data.subscribers ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const exportCsv = () => {
    const header = "email,nombre,apellido,fecha\n";
    const rows = subscribers
      .map((s) => {
        const name = `"${(s.firstName || "").replace(/"/g, '""')}"`;
        const last = `"${(s.lastName || "").replace(/"/g, '""')}"`;
        const date = new Date(s.createdAt).toLocaleDateString("es-ES");
        return `${s.email},${name},${last},${date}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suscriptores-amarusdesign-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (sub: Subscriber) => {
    if (!confirm(`¿Eliminar a ${sub.email} de la lista?`)) return;
    try {
      setDeletingId(sub.id);
      const res = await fetch("/api/admin/newsletter-subscribers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ id: sub.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Error al eliminar");
      }
      setSubscribers((prev) => prev.filter((s) => s.id !== sub.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="admin-shell flex justify-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 sm:text-4xl">
            Suscriptores
          </h1>
          <p className="text-gray-700">
            Emails del formulario de la home. Exporta a CSV para enviar
            novedades desde Gmail, Outlook, etc.
          </p>
        </div>
        {subscribers.length > 0 && (
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center justify-center gap-2 bg-[#6B5BB6] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5]"
          >
            <Download className="h-5 w-5" aria-hidden />
            Exportar CSV
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      )}

      {subscribers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Mail className="h-14 w-14 text-gray-300 mx-auto mb-4" aria-hidden />
          <p className="text-gray-600">Aún no hay suscriptores.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subscribers.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{sub.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {[sub.firstName, sub.lastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(sub.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(sub)}
                        disabled={deletingId === sub.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        aria-label={`Eliminar suscriptor ${sub.email}`}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-6 py-3 text-sm text-gray-500 border-t border-gray-100">
            Total: {subscribers.length} suscriptor
            {subscribers.length !== 1 ? "es" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
