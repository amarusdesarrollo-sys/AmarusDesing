"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useCartStore } from "@/store/cartStore";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Cog,
  FileText,
  TicketPercent,
  X,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Productos", href: "/admin/productos", icon: Package },
  { name: "Categorías", href: "/admin/categorias", icon: FolderTree },
  { name: "Pedidos", href: "/admin/pedidos", icon: ShoppingCart },
  { name: "Cupones", href: "/admin/cupones", icon: TicketPercent },
  { name: "Contenido", href: "/admin/contenido", icon: FileText },
  { name: "Configuración", href: "/admin/configuracion", icon: Cog },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users },
];

type AdminSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

export default function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);

  const handleLogout = async () => {
    onClose();
    clearCart();
    await signOut(auth);
    router.replace("/admin/login");
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menú"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,100vw)] shrink-0 flex-col border-r border-gray-800 bg-gray-900 p-4 text-white shadow-xl transition-transform duration-200 ease-out sm:p-6 lg:static lg:z-0 lg:w-64 lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-6 flex items-start justify-between gap-2 lg:mb-8">
          <div>
            <h2 className="text-xl font-bold text-[#6B5BB6] sm:text-2xl">AmarusDesign</h2>
            <p className="mt-1 text-sm text-gray-400">Panel de Administración</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
            aria-label="Cerrar navegación"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors sm:px-4 ${
                  isActive
                    ? "bg-[#6B5BB6] text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 space-y-1 border-t border-gray-700 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white sm:px-4"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white sm:px-4"
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className="font-medium">Volver a la Tienda</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
