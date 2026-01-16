"use client";

import { useEffect } from "react";

export default function TesorosDelMundoPage() {
  useEffect(() => {
    window.location.href = "/categorias/tesoros-del-mundo";
  }, []);

  return null;
}
