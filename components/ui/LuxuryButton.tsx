"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useMetallicChime } from "@/hooks/useMetallicChime";

type LuxuryButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline";
  className?: string;
  target?: string;
  rel?: string;
};

export default function LuxuryButton({
  href,
  children,
  variant = "solid",
  className = "",
  target,
  rel,
}: LuxuryButtonProps) {
  const playChime = useMetallicChime();

  const base =
    "group relative inline-flex items-center justify-center overflow-hidden text-sm tracking-wide px-8 py-3.5 rounded-full transition-colors duration-300 select-none";

  const styles =
    variant === "solid"
      ? "bg-gold text-ink-950 font-medium hover:bg-gold-soft"
      : "border border-white/20 text-paper hover:border-gold/60 hover:text-gold";

  return (
    <motion.a
      href={href}
      target={target}
      rel={rel}
      onHoverStart={() => playChime("hover")}
      onTap={() => playChime("click")}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`${base} ${styles} ${className}`}
    >
      {/* Barrido de brillo diagonal, como luz reflejándose en metal pulido */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-[130%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:translate-x-[130%] group-hover:opacity-100 transition-all duration-700 ease-out"
      />
      <span className="relative z-10">{children}</span>
    </motion.a>
  );
}
