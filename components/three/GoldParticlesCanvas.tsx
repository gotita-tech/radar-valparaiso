"use client";

import dynamic from "next/dynamic";

const GoldParticlesScene = dynamic(() => import("./GoldParticlesScene"), {
  ssr: false,
});

/**
 * Renderiza la escena 3D solo en el cliente. En el servidor (y mientras
 * carga) no se muestra nada: el fondo de tinta y el patrón seigaiha en CSS
 * ya sostienen la composición, así que no hay salto visual perceptible.
 */
export default function GoldParticlesCanvas() {
  return (
    <div className="w-full h-full opacity-70">
      <GoldParticlesScene />
    </div>
  );
}
