"use client";

import { motion } from "framer-motion";
import { TIER } from "@/lib/radar/taxonomy";
import type { Metrics } from "@/lib/radar/data";

type Tile = {
  label: string;
  value: string;
  hint: string;
  accent?: string;
  onClick?: () => void;
  active?: boolean;
};

export default function KpiStrip({
  metrics,
  totalUnfiltered,
  onFocusVeryHigh,
  onFocusHigh,
  onFocusNoWebsite,
  activeShortcut,
}: {
  metrics: Metrics;
  totalUnfiltered: number;
  onFocusVeryHigh: () => void;
  onFocusHigh: () => void;
  onFocusNoWebsite: () => void;
  activeShortcut: "very_high" | "high" | "no_website" | null;
}) {
  const tiles: Tile[] = [
    {
      label: "Negocios",
      value: String(metrics.total),
      hint:
        metrics.total === totalUnfiltered
          ? "Dataset completo"
          : `de ${totalUnfiltered} en el dataset`,
    },
    {
      label: "Very High",
      value: String(metrics.veryHigh),
      hint: "Priority ≥ 85",
      accent: TIER.VERY_HIGH.color,
      onClick: onFocusVeryHigh,
      active: activeShortcut === "very_high",
    },
    {
      label: "High",
      value: String(metrics.high),
      hint: "Priority 75 – 84",
      accent: TIER.HIGH.color,
      onClick: onFocusHigh,
      active: activeShortcut === "high",
    },
    {
      label: "Sin sitio web",
      value: String(metrics.withoutWebsite),
      hint: "Sólo redes o sin web",
      accent: "#D67E33",
      onClick: onFocusNoWebsite,
      active: activeShortcut === "no_website",
    },
    {
      label: "Priority prom.",
      value: metrics.total ? metrics.avgPriority.toFixed(1) : "—",
      hint: "Escala 0 – 100",
    },
    {
      label: "Confidence prom.",
      value: metrics.total ? metrics.avgConfidence.toFixed(1) : "—",
      hint: "Fiabilidad del dato",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.06] sm:grid-cols-3 xl:grid-cols-6">
      {tiles.map((tile, index) => {
        const interactive = Boolean(tile.onClick);
        const Wrapper = interactive ? "button" : "div";

        return (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.03 }}
            className="bg-ink-950"
          >
            <Wrapper
              {...(interactive
                ? {
                    type: "button" as const,
                    onClick: tile.onClick,
                    "aria-pressed": tile.active,
                    title: `Filtrar por ${tile.label}`,
                  }
                : {})}
              className={`flex h-full w-full flex-col items-start gap-1 px-4 py-3.5 text-left transition-colors duration-200 ${
                interactive ? "hover:bg-white/[0.03]" : ""
              } ${tile.active ? "bg-gold/[0.07]" : ""}`}
            >
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest2 text-paper-dim/50">
                {tile.accent ? (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: tile.accent }}
                    aria-hidden="true"
                  />
                ) : null}
                {tile.label}
              </span>
              <span
                className="font-serif text-2xl leading-none tabular-nums text-paper"
                style={tile.accent && tile.active ? { color: tile.accent } : undefined}
              >
                {tile.value}
              </span>
              <span className="text-[11px] text-paper-dim/45">{tile.hint}</span>
            </Wrapper>
          </motion.div>
        );
      })}
    </div>
  );
}
