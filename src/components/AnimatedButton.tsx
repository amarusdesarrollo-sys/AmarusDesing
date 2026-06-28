"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
}

const AnimatedButton = ({
  children,
  className = "",
  href,
  onClick,
  type = "button",
  variant = "primary",
}: AnimatedButtonProps) => {
  const baseClasses =
    "inline-flex touch-manipulation items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 [@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.03] active:scale-[0.98]";

  const variantClasses = {
    primary:
      "border-2 border-white text-white bg-transparent [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white [@media(hover:hover)_and_(pointer:fine)]:hover:text-black",
    secondary:
      "border-2 border-[#6b5bb6] text-[#6b5bb6] bg-transparent [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#6b5bb6] [@media(hover:hover)_and_(pointer:fine)]:hover:text-white",
    ghost:
      "text-gray-600 bg-transparent [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#6b5bb6]",
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  const tapVariants: Variants = {
    initial: { scale: 1 },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  };

  if (href) {
    return (
      <motion.a
        href={href}
        className={buttonClasses}
        variants={tapVariants}
        initial="initial"
        whileTap="tap"
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      variants={tapVariants}
      initial="initial"
      whileTap="tap"
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
