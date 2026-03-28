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
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}
