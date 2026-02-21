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

  if (!mounted) {
    return (
      <Link
        href="/carrito"
        className={`relative text-white hover:text-[#F5EFFF] transition-colors duration-200 p-1.5 rounded-lg hover:bg-white/10 shrink-0 ${className}`}
      >
        <ShoppingBag className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 bg-white text-[#5B4BA5] text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
          0
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/carrito"
      className={`relative text-white hover:text-[#F5EFFF] transition-colors duration-200 p-1.5 rounded-lg hover:bg-white/10 shrink-0 ${className}`}
    >
      <ShoppingBag className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-white text-[#5B4BA5] text-xs font-semibold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-md">
          {totalItems}
        </span>
      )}
    </Link>
  );
}
