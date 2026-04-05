"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ConditionalSiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome = pathname?.startsWith("/admin") ?? false;
  /** Rutas donde el propio layout de la página ya cierra bien y no hace falta colchón extra antes del footer. */
  const compactMainBottom =
    pathname === "/" ||
    pathname === "/politicas" ||
    pathname?.startsWith("/politicas/") ||
    pathname === "/equipo" ||
    pathname?.startsWith("/equipo/") ||
    pathname === "/tienda-online" ||
    pathname?.startsWith("/tienda-online/");

  if (hideChrome) {
    return (
      <div className="flex min-h-screen flex-1 flex-col min-h-0 w-full">
        {children}
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main
        className={
          compactMainBottom
            ? "flex-grow w-full min-w-0 pb-0"
            : "flex-grow w-full min-w-0 pb-12 md:pb-16 lg:pb-20"
        }
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
