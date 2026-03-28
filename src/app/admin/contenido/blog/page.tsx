"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, Edit, Trash2, FileText } from "lucide-react";
import { getAllBlogPosts } from "@/lib/firebase/blog";
import { getCloudinaryBaseUrl } from "@/lib/cloudinary";
import type { BlogPost } from "@/types";
import { getAuthHeaders } from "@/lib/auth-headers";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllBlogPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`¿Eliminar "${post.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch("/api/admin/delete-blog-post", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({ blogPostId: post.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Error al eliminar definitivamente");
      }
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch {
      alert("Error al eliminar");
    }
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
      <Link
        href="/admin/contenido"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-[#6B5BB6] mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Volver a Contenido
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">Blog</h1>
        <Link href="/admin/contenido/blog/nuevo" className="w-full sm:w-auto shrink-0">
          <button className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] flex w-full items-center justify-center gap-2 sm:w-auto">
            <Plus className="h-5 w-5" />
            Nuevo post
          </button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No hay entradas de blog aún.</p>
          <Link href="/admin/contenido/blog/nuevo">
            <button className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5]">
              Crear primera entrada
            </button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Imagen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
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
              {posts.map((post) => {
                const imgUrl =
                  post.imageUrl ||
                  (post.imagePublicId ? getCloudinaryBaseUrl(post.imagePublicId) : null);
                return (
                  <tr key={post.id}>
                    <td className="px-4 py-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {imgUrl ? (
                          <Image
                            src={imgUrl}
                            alt=""
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <FileText className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{post.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          post.published ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {post.published ? "Publicado" : "Borrador"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(post.updatedAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/contenido/blog/${post.id}/editar`}>
                          <button
                            className="p-2 text-[#6B5BB6] hover:bg-[#6B5BB6]/10 rounded-lg"
                            title="Editar"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(post)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
