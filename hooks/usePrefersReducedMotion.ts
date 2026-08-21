"use client";

import { useEffect, useState } from "react";

/**
 * Refleja la preferencia del sistema operativo por menos movimiento.
 * Se usa para apagar animaciones no esenciales (partículas 3D, glow del
 * cursor) en vez de solo acortar su duración vía CSS.
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
