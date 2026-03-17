"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  GripVertical,
} from "lucide-react";
import {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
} from "@/lib/firebase/team";
import {
  getEquipoCierreContent,
  updateEquipoCierreContent,
} from "@/lib/firebase/content";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import { getAuthHeaders } from "@/lib/auth-headers";
import OptimizedImage from "@/components/OptimizedImage";
import type { TeamMember, EquipoCierreContent } from "@/types";

export default function AdminEquipoPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [cierre, setCierre] = useState<EquipoCierreContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showNewMember, setShowNewMember] = useState(false);
  const [editingCierre, setEditingCierre] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      let [membersData, cierreData] = await Promise.all([
        getTeamMembers(),
        getEquipoCierreContent(),
      ]);

      // Si no hay miembros aún, sembramos el contenido por defecto de la web actual
      if (membersData.length === 0) {
        await seedDefaultTeamMembers();
        membersData = await getTeamMembers();
      }

      setMembers(membersData);
      setCierre(cierreData);
    } catch (err) {
      setError("Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCierre = async () => {
    if (!cierre) return;
    setSaving(true);
    setError(null);
    try {
      await updateEquipoCierreContent(cierre);
      setSuccess(true);
      setEditingCierre(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Error al guardar");
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

  return (
    <div className="p-8">
      <Link
        href="/admin/contenido"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-[#6B5BB6] mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Contenido
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Equipo</h1>
        <p className="text-gray-600">
          Gestiona los miembros del equipo y el texto de cierre de la página.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          Guardado correctamente
        </div>
      )}

      {/* Miembros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Miembros</h2>
          <button
            onClick={() => {
              setShowNewMember(true);
              setEditingMember(null);
            }}
            className="bg-[#6B5BB6] text-white px-4 py-2 rounded-lg hover:bg-[#5B4BA5] flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo miembro
          </button>
        </div>

        {members.length === 0 && !showNewMember ? (
          <p className="text-gray-500 py-4">
            No hay miembros. La página de Equipo usará el contenido estático por
            defecto hasta que agregues miembros. Haz clic en &quot;Nuevo
            miembro&quot; para empezar.
          </p>
        ) : (
          <div className="space-y-4">
            {members.map((m, idx) => (
              <MemberRow
                key={m.id}
                member={m}
                onEdit={() => {
                  setEditingMember(m);
                  setShowNewMember(false);
                }}
                onDelete={async () => {
                  if (confirm(`¿Eliminar a ${m.name}?`)) {
                    const res = await fetch("/api/admin/delete-team-member", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(await getAuthHeaders()),
                      },
                      body: JSON.stringify({ teamMemberId: m.id }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok || !data?.success) {
                      throw new Error(data?.message || "Error al eliminar definitivamente");
                    }
                    load();
                  }
                }}
                onSave={async (data) => {
                  await updateTeamMember(m.id, data);
                  setEditingMember(null);
                  load();
                }}
                onCancel={() => setEditingMember(null)}
                isEditing={editingMember?.id === m.id}
              />
            ))}
          </div>
        )}

        {showNewMember && (
          <MemberForm
            onSave={async (data) => {
              await createTeamMember({
                ...data,
                order: members.length,
              });
              setShowNewMember(false);
              load();
            }}
            onCancel={() => setShowNewMember(false)}
          />
        )}
      </div>

      {/* Cierre */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Sección de cierre
        </h2>
        {cierre && (
          <div className="space-y-4">
            {editingCierre ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={cierre.title}
                    onChange={(e) =>
                      setCierre({ ...cierre, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Párrafos (uno por línea)
                  </label>
                  <textarea
                    value={cierre.paragraphs.join("\n\n")}
                    onChange={(e) =>
                      setCierre({
                        ...cierre,
                        paragraphs: e.target.value
                          .split("\n\n")
                          .map((p) => p.trim())
                          .filter(Boolean),
                      })
                    }
                    rows={8}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCierre}
                    disabled={saving}
                    className="bg-[#6B5BB6] text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingCierre(false)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-gray-800">{cierre.title}</h3>
                <div className="text-gray-600 space-y-2">
                  {cierre.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <button
                  onClick={() => setEditingCierre(true)}
                  className="text-[#6B5BB6] hover:underline flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Contenido por defecto basado en la página actual de Wix / EquipoStatic
async function seedDefaultTeamMembers() {
  const defaults: Array<{
    name: string;
    imageUrl?: string;
    bio: string;
    order: number;
  }> = [
    {
      name: "Meli",
      imageUrl: "/images/equipo/melina.JPG",
      order: 0,
      bio:
        "Conocimos a Meli desde la distancia, se ha convertido en un persona muy importante de este proyecto. Además de realizar parte de nuestra colección en macramé, nos ayuda en la organización.\n\n" +
        "Me encantan las artesanías desde chica, por ello aprendí de forma autodidacta en un viaje a Brasil en 2018. Combino actualmente mi pasión por los hilos con los estudios.",
    },
    {
      name: "Tincho",
      imageUrl: "/images/equipo/tincho.jpg",
      order: 1,
      bio:
        "Vivo haciendo artesanía desde mi adolescencia, no me imagino otra forma de vida. Trabajo diferentes técnicas con metal y macramé, teniendo presente la tradición artesanal Latinoamericana.",
    },
    {
      name: "Franco",
      imageUrl: "/images/equipo/PHOTO-2023-02-06-22-46-41.jpg",
      order: 2,
      bio:
        "Afortunados de contar con Franco, como apoyo para la creación de nuestras colecciones con técnica en soldadura. Trabaja con precisión y acabados de calidad.\n\n" +
        "Hago joyería en el taller que tengo en mi casa junto a mi familia.\n\n" +
        "Mi gran sueño es seguir especializando me cada vez más en este rubro, asistiendo a reconocidas escuelas de orfebrería en Argentina.",
    },
    {
      name: "Chiara",
      imageUrl: "/images/equipo/PHOTO-2023-02-06-21-42-47_edited.jpg",
      order: 3,
      bio:
        "Nuestra querida fotógrafa, es todo un honor contar con ella como profesional y amiga.\n\n" +
        "Gracias a ella, l@s modelos muestran su belleza natural llevando nuestras joyas.\n\n" +
        "@chiara_fotografia_grancanaria\n\n" +
        "Al principio he aprendido por mi cuenta, pero con el tiempo empecé a asistir a diferentes cursos.\n\n" +
        "Me encanta poder expresar emociones a través de mis fotografías.",
    },
    {
      name: "Mati",
      imageUrl:
        "/images/equipo/Captura de pantalla 2021-06-17 a las 19.21_edited.jpg",
      order: 4,
      bio:
        "Tenemos mucha suerte al contar con Mati, gran amigo y profesional del macramé.\n\n" +
        "Amante de las piedras y artesano de corazón, hace ya muchos años, destaca por un estilo único y detallista.\n\n" +
        "Mi rubro es el tejido. A la edad de 19 años me enseñaron los puntos básicos, es mi sustento desde entonces. Soy artesano porque es el ambiente donde me siento más a gusto.",
    },
    {
      name: "Uschi",
      imageUrl: "/images/equipo/4a0d465e-a481-4a03-bf34-1ee1f69ba33f.JPG",
      order: 5,
      bio:
        "Les presento con mucho orgullo a mi mama, recuerdo con cariño sus abrigos de mi infancia.\n\n" +
        "Siempre le ha gustado la moda, por que no crear un poco de moda hecha a mano.\n\n" +
        "Siempre me gustó la moda y el diseño, era mi gran sueño. Finalmente estudié otra cosa totalmente diferente, pero sigo disfrutando de mi parte más creativa a diario. Ya sea haciendo ropa, restaurando muebles...",
    },
    {
      name: "Amigo de la familia",
      order: 6,
      bio:
        "Amigo de la familia, con más de dos décadas de experiencia en la artesanía y venta callejera. Viajero, padre y hermano de la vida. Muy agradecidos por contar con este compañero, en nuestro proyecto familiar.",
    },
  ];

  for (const def of defaults) {
    await createTeamMember({
      name: def.name,
      bio: def.bio,
      imageUrl: def.imageUrl,
      order: def.order,
      active: true,
    });
  }
}

function MemberRow({
  member,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  isEditing,
}: {
  member: TeamMember;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (data: Partial<Pick<TeamMember, "name" | "bio" | "imagePublicId" | "imageUrl" | "order" | "active">>) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}) {
  if (isEditing) {
    return (
      <MemberForm
        initial={member}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }
  // Preferimos la URL directa (secure_url) devuelta por Cloudinary.
  // Solo si no existe, generamos una URL transformada a partir del publicId.
  const imgSrc =
    member.imageUrl ||
    (member.imagePublicId
      ? getCloudinaryUrl(member.imagePublicId, { width: 80, height: 80 })
      : "");
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 shrink-0">
        {imgSrc ? (
          <OptimizedImage
            src={imgSrc}
            alt={member.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            Sin foto
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800">{member.name}</p>
        <p className="text-sm text-gray-500 line-clamp-2">{member.bio}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onEdit}
          className="p-2 text-[#6B5BB6] hover:bg-[#F5EFFF] rounded"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MemberForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: TeamMember;
  onSave: (data: {
    name: string;
    bio: string;
    imagePublicId?: string;
    imageUrl?: string;
    order: number;
    active: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [imagePublicId, setImagePublicId] = useState(initial?.imagePublicId ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [originalImagePublicId] = useState(initial?.imagePublicId ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "team");
      const res = await fetch("/api/upload-image", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setImagePublicId(data.publicId);
        setImageUrl(data.url ?? "");
      } else throw new Error(data.message);
    } catch (err) {
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
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
      await onSave({
        name: name.trim(),
        bio: bio.trim(),
        imagePublicId: imagePublicId || undefined,
        imageUrl: imageUrl || undefined,
        order: initial?.order ?? 0,
        active: initial?.active ?? true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-50 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Biografía
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Imagen
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = handleImageUpload as any;
              input.click();
            }}
            disabled={uploading}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
          >
            {uploading ? "Subiendo imagen..." : imageUrl ? "Cambiar imagen" : "Seleccionar imagen"}
          </button>
          {imageUrl && (
            <button
              type="button"
              onClick={() => {
                setImagePublicId("");
                setImageUrl("");
              }}
              className="px-3 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
            >
              Quitar imagen
            </button>
          )}
        </div>
        {imageUrl && (
          <div className="mt-3 w-24 h-24 rounded overflow-hidden border border-gray-200">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#6B5BB6] text-white px-4 py-2 rounded-lg"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">
          Cancelar
        </button>
      </div>
    </form>
  );
}
