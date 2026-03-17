"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { getBlogPostById, updateBlogPost } from "@/lib/firebase/blog";
import { getAuthHeaders } from "@/lib/auth-headers";

export default function EditarBlogPostPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [published, setPublished] = useState(false);
  const [tags, setTags] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [originalImagePublicId, setOriginalImagePublicId] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getBlogPostById(id).then((post) => {
      if (!post) {
        setNotFound(true);
      } else {
        setTitle(post.title);
        setSlug(post.slug);
        setExcerpt(post.excerpt || "");
        setContent(post.content || "");
        setAuthor(post.author || "");
        setPublished(post.published);
        setTags(post.tags?.join(", ") || "");
        setImagePublicId(post.imagePublicId || "");
        setImageUrl(post.imageUrl || "");
        setOriginalImagePublicId(post.imagePublicId || "");
      }
      setLoading(false);
    });
  }, [id]);

  const generateSlug = () => {
    const s = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(s);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "blog");
    const headers = await getAuthHeaders();
    const res = await fetch("/api/upload-image", { method: "POST", headers, body: fd });
    const data = await res.json();
    if (data.success) {
      setImagePublicId(data.publicId);
      setImageUrl(data.url);
    } else {
      alert(data.message || "Error al subir imagen");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      alert("Título y slug son obligatorios");
      return;
    }
    setSaving(true);
    try {
      // Si se reemplazó o eliminó la imagen, borrar la anterior en Cloudinary
      if (originalImagePublicId && originalImagePublicId !== imagePublicId) {
        await fetch("/api/admin/delete-cloudinary-assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders()),
          },
          body: JSON.stringify({ publicIds: [originalImagePublicId] }),
        }).catch(() => null);
      }
      await updateBlogPost(id, {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        author: author.trim(),
        published,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        imagePublicId: imagePublicId || undefined,
        imageUrl: imageUrl || undefined,
      });
      window.location.href = "/admin/contenido/blog";
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-8">
        <p className="text-xl text-red-600 mb-4">Entrada no encontrada</p>
        <Link href="/admin/contenido/blog" className="text-[#6B5BB6] hover:underline">
          Volver al Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/admin/contenido/blog"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-[#6B5BB6] mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Volver al Blog
      </Link>

      <h1 className="text-4xl font-bold text-gray-800 mb-6">Editar entrada</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={generateSlug}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="ejemplo-de-entrada"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Extracto</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Breve resumen que aparece en la lista"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagen destacada</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {imageUrl && (
            <img src={imageUrl} alt="" className="mt-2 w-48 h-32 object-cover rounded-lg" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Etiquetas (separadas por coma)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="joyería, minerales, novedades"
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded text-[#6B5BB6]"
          />
          <span>Publicar (visible en la web)</span>
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link href="/admin/contenido/blog">
            <button type="button" className="px-6 py-3 border rounded-lg">
              Cancelar
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
