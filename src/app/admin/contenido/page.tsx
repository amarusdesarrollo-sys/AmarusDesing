"use client";

import Link from "next/link";
import { Users, BookOpen, FileText, Home, Mail } from "lucide-react";

const sections = [
  { name: "Equipo", href: "/admin/contenido/equipo", icon: Users },
  { name: "Historia", href: "/admin/contenido/historia", icon: BookOpen },
  { name: "Políticas", href: "/admin/contenido/politicas", icon: FileText },
  { name: "Home", href: "/admin/contenido/home", icon: Home },
  { name: "Contacto", href: "/admin/contenido/contacto", icon: Mail },
];

export default function AdminContenidoPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Contenido del Sitio
        </h1>
        <p className="text-gray-600">
          Edita el contenido de equipo, historia, políticas, home y contacto.
          Los datos de contacto (email, teléfono, dirección) se gestionan en{" "}
          <Link
            href="/admin/configuracion"
            className="text-[#6B5BB6] hover:underline"
          >
            Configuración
          </Link>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg hover:border-[#6B5BB6] border-2 border-transparent transition-all flex items-center gap-4"
            >
              <div className="p-3 bg-[#F5EFFF] rounded-lg">
                <Icon className="h-8 w-8 text-[#6B5BB6]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{section.name}</h2>
                <p className="text-sm text-gray-500">Editar contenido</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
