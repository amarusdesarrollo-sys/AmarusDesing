"use client";

import { useEffect } from "react";

export default function MineralesDelMundoPage() {
  useEffect(() => {
    window.location.href = "/categorias/minerales-del-mundo";
  }, []);

  return null;
}
