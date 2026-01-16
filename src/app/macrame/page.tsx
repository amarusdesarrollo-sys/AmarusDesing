"use client";

import { useEffect } from "react";

export default function MacramePage() {
  useEffect(() => {
    window.location.href = "/categorias/macrame";
  }, []);

  return null;
}
