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
    "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary:
      "border-2 border-white text-white bg-transparent hover:bg-white hover:text-black",
    secondary:
      "border-2 border-[#6b5bb6] text-[#6b5bb6] bg-transparent hover:bg-[#6b5bb6] hover:text-white",
    ghost: "text-gray-600 hover:text-[#6b5bb6] bg-transparent",
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  const buttonVariants: Variants = {
    initial: { scale: 1, y: 0 },
    hover: {
      scale: 1.05,
      y: -2,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    },
  };

  if (href) {
    return (
      <motion.a
        href={href}
        className={buttonClasses}
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
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
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;

