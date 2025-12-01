"use client";
import { motion } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";

/**
 * Componente que aplica um efeito de fade-in e slide-up quando o elemento entra na viewport.
 */
export function ScrollFadeIn({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) {
  return (
    <motion.div
      className={cn("w-full", className)}
      // Estado inicial: invisível e ligeiramente abaixo
      initial={{ opacity: 0, y: 50 }}
      // Estado quando visível na viewport: totalmente visível e na posição original
      whileInView={{ opacity: 1, y: 0 }}
      // Configurações da viewport: anima apenas uma vez e quando 50% do elemento estiver visível
      viewport={{ once: true, amount: 0.5 }}
      // Transição suave
      transition={{ duration: 0.6, delay: delay }}
    >
      {children}
    </motion.div>
  );
}