"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShippingConfigLoader from "@/components/ShippingConfigLoader";
import type { Category, SiteConfig } from "@/types";

export default function ConditionalSiteChrome({
  children,
  initialCategories = [],
  initialSiteConfig = null,
}: {
  children: React.ReactNode;
  initialCategories?: Category[];
  initialSiteConfig?: SiteConfig | null;
}) {
  const pathname = usePathname();
  const hideChrome = pathname?.startsWith("/admin") ?? false;
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
      <ShippingConfigLoader initialSiteConfig={initialSiteConfig} />
      <Navbar initialCategories={initialCategories} />
      <main
        className={
          compactMainBottom
            ? "flex-grow w-full min-w-0 pb-0"
            : "flex-grow w-full min-w-0 pb-12 md:pb-16 lg:pb-20"
        }
      >
        {children}
      </main>
      <Footer initialSiteConfig={initialSiteConfig} />
    </>
  );
}
