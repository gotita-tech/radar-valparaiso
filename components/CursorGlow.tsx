"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Luz cálida y localizada que sigue al cursor, como una vela detrás del
 * visitante mientras recorre la página. Puramente decorativa (pointer-events:
 * none), animada con requestAnimationFrame + interpolación para que el
 * movimiento sea fluido y no un salto brusco de posición.
 *
 * Se desactiva por completo en dispositivos táctiles (no hay cursor real) y
 * cuando el sistema pide menos movimiento.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const intensity = useRef(0);
  const frame = useRef<number>(0);
  const started = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) return;

    const el = glowRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (!started.current) {
        current.current.x = e.clientX;
        current.current.y = e.clientY;
        started.current = true;
        el.style.opacity = "1";
      }

      const hovered = (e.target as HTMLElement | null)?.closest(
        "a, button, [role='button']"
      );
      intensity.current = hovered ? 1 : 0;
    };

    const onLeave = () => {
      if (el) el.style.opacity = "0";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    const LERP = 0.12;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * LERP;
      current.current.y += (target.current.y - current.current.y) * LERP;

      const baseScale = 1 + intensity.current * 0.4;
      el.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%) scale(${baseScale})`;

      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame.current);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[1] hidden h-[420px] w-[420px] rounded-full opacity-0 transition-opacity duration-500 md:block"
      style={{
        background:
          "radial-gradient(circle, rgba(212,175,55,0.10) 0%, rgba(201,162,39,0.05) 38%, transparent 70%)",
        willChange: "transform, opacity",
      }}
    />
  );
}
