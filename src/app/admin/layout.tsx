"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Menu } from "lucide-react";
import { auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/auth-admin";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      setAllowed(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/admin/login");
        setAllowed(false);
        setChecking(false);
        return;
      }
      if (!isAdminEmail(user.email)) {
        signOut(auth);
        router.replace("/admin/login");
        setAllowed(false);
        setChecking(false);
        return;
      }
      setAllowed(true);
      setChecking(false);
    });

    return () => unsubscribe();
  }, [isLoginPage, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.removeProperty("overflow");
    }
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [sidebarOpen]);

  if (isLoginPage) {
    return <>{children}</>;
  }

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

  return (
    <div className="flex min-h-screen w-full min-w-0 bg-gray-50">
      <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-3 shadow-sm lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Abrir menú de administración"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-gray-900">Panel AmarusDesign</span>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
