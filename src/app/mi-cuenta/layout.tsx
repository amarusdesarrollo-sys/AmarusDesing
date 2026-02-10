"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/auth-admin";
import { User, MapPin, Package, LogOut } from "lucide-react";

export default function MiCuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        setAllowed(false);
        setChecking(false);
        return;
      }
      if (isAdminEmail(user.email)) {
        setAllowed(true);
      } else {
        setAllowed(true);
      }
      setChecking(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/");
    router.refresh();
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  const nav = [
    { href: "/mi-cuenta/perfil", label: "Mi perfil", icon: User },
    { href: "/mi-cuenta/direcciones", label: "Direcciones", icon: MapPin },
    { href: "/mi-cuenta/pedidos", label: "Mis pedidos", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5EFFF] to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-56 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-md border border-gray-100 p-4 space-y-1 sticky top-24">
              <h2 className="font-semibold text-gray-800 mb-3 px-2">Mi cuenta</h2>
              {nav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-700 transition-colors ${
                    pathname === href
                      ? "bg-[#6B5BB6] text-white"
                      : "hover:bg-[#F5EFFF]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-2"
              >
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </button>
            </nav>
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
