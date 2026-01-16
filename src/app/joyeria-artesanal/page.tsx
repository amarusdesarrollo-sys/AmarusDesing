"use client";

import { useEffect } from "react";

export default function JoyeriaArtesanalPage() {
  useEffect(() => {
    // Redirigir a la página dinámica
    window.location.href = "/categorias/joyeria-artesanal";
  }, []);

  return null;
}
