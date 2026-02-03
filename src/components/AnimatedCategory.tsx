"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ProductImage } from "@/components/OptimizedImage";

interface AnimatedCategoryProps {
  href: string;
  src: string;
  alt: string;
  title: string;
  priority?: boolean;
  publicId?: string;
  imageUrl?: string; // URL completa (prioritaria)
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
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Link href={href} className="group flex flex-col items-center">
        <div className="aspect-square relative rounded-full overflow-hidden w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64 mb-4 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 bg-gray-200">
          <ProductImage
            src={imageUrl || src || ""}
            alt={alt}
            publicId={imageUrl ? undefined : publicId}
            size="medium"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 rounded-full"
            priority={priority}
          />
        </div>
        <h3 className="font-semibold text-gray-800 group-hover:text-[#6B5BB6] transition-colors duration-300 text-base md:text-lg">
          {title}
        </h3>
      </Link>
    </motion.div>
  );
};

export default AnimatedCategory;



