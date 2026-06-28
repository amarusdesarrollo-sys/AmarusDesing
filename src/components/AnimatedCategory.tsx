"use client";

import Link from "next/link";
import { ProductImage } from "@/components/OptimizedImage";

interface AnimatedCategoryProps {
  href: string;
  src: string;
  alt: string;
  title: string;
  priority?: boolean;
  publicId?: string;
  imageUrl?: string;
}

const AnimatedCategory = ({
  href,
  src,
  alt,
  title,
  priority = false,
  publicId,
  imageUrl,
}: AnimatedCategoryProps) => {
  return (
    <Link
      href={href}
      className="group flex touch-manipulation flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-[#6B5BB6] focus-visible:ring-offset-2"
    >
      <div className="relative mb-4 aspect-square h-40 w-40 overflow-hidden rounded-full bg-gray-200 shadow-lg transition-shadow md:h-52 md:w-52 lg:h-64 lg:w-64 [@media(hover:hover)_and_(pointer:fine)]:group-hover:shadow-xl">
        <ProductImage
          src={imageUrl || src || ""}
          alt={alt}
          publicId={imageUrl ? undefined : publicId}
          size="medium"
          className="h-full w-full rounded-full object-cover transition-transform duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-110"
          priority={priority}
        />
      </div>
      <h3 className="text-base font-semibold text-gray-800 transition-colors duration-300 md:text-lg [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-[#6B5BB6]">
        {title}
      </h3>
    </Link>
  );
};

export default AnimatedCategory;
