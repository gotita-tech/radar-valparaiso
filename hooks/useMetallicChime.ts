"use client";

import { useCallback, useRef } from "react";

/**
 * Sintetiza un "tintineo" metálico y cálido —inspirado en el sonido de una
 * campanilla de latón pulido— usando osciladores de la Web Audio API.
 * No depende de ningún archivo de audio: se genera en tiempo real, así que
 * pesa cero en la carga de la página.
 */
export function useMetallicChime() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AudioCtx();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (variant: "hover" | "click" = "hover") => {
      const ctx = getContext();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0, now);
      master.connect(ctx.destination);

      // Parciales inarmónicos = timbre metálico (como una campana pequeña).
      const partials =
        variant === "click"
          ? [1, 2.02, 3.42, 4.9]
          : [1, 2.76, 5.4];
      const baseFreq = variant === "click" ? 880 : 1318.5; // Mi/La agudos: brillante, no estridente
      const peak = variant === "click" ? 0.14 : 0.05;
      const duration = variant === "click" ? 0.9 : 0.55;

      partials.forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq * ratio, now);

        const gain = ctx.createGain();
        const partialPeak = peak / (i + 1.4);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(partialPeak, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / (i * 0.4 + 1));

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + duration);
      });

      master.gain.linearRampToValueAtTime(1, now + 0.008);
      master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    },
    [getContext]
  );

  return play;
}
