"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MiCuentaPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/mi-cuenta/perfil");
  }, [router]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#6B5BB6]" />
    </div>
  );
}
