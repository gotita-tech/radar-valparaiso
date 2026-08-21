"use client";

import dynamic from "next/dynamic";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const GoldParticlesScene = dynamic(() => import("./GoldParticlesScene"), {
  ssr: false,
});

/**
 * Renderiza la escena 3D solo en el cliente. En el servidor (y mientras
 * carga) no se muestra nada: el fondo de tinta y el patrón seigaiha en CSS
 * ya sostienen la composición, así que no hay salto visual perceptible.
 *
 * Si el sistema pide menos movimiento, no se monta el Canvas: evita gasto
 * de GPU/batería para quien lo pidió explícitamente, en vez de solo
 * ralentizar la animación.
 */
export default function GoldParticlesCanvas() {
  const prefersReducedMotion = usePrefersReducedMotion();
  if (prefersReducedMotion) return null;

  return (
    <div className="w-full h-full opacity-70">
      <GoldParticlesScene />
    </div>
  );
}
