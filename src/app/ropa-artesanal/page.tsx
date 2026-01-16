"use client";

import { useEffect } from "react";

export default function RopaArtesanalPage() {
  useEffect(() => {
    window.location.href = "/categorias/ropa-artesanal";
  }, []);

  return null;
}
