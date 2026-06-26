"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useEffect, useState } from "react";

interface CartIconProps {
  className?: string;
}

export default function CartIcon({ className = "" }: CartIconProps) {
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  const label =
    mounted && totalItems > 0
      ? `Carrito, ${totalItems} ${totalItems === 1 ? "producto" : "productos"}`
      : "Carrito";

  return (
    <Link
      href="/carrito"
      aria-label={label}
      className={`relative flex items-center justify-center min-h-11 min-w-11 p-2 text-white hover:text-[#F5EFFF] transition-colors duration-200 rounded-lg hover:bg-white/10 shrink-0 ${className}`}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden />
      {mounted && totalItems > 0 && (
        <span
          className="absolute top-0.5 right-0.5 bg-white text-[#5B4BA5] text-xs font-semibold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-md"
          aria-hidden
        >
          {totalItems}
        </span>
      )}
    </Link>
  );
}
