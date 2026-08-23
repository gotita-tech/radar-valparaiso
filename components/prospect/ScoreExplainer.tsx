"use client";

import { Info } from "lucide-react";
import { DIMENSION, DIMENSION_ORDER, TIER } from "@/lib/radar/taxonomy";
import type { Lead, ScoreDimension } from "@/lib/radar/types";

function dimensionValue(lead: Lead, dimension: ScoreDimension) {
  switch (dimension) {
    case "digital_need":
      return lead.digital_need_score;
    case "commercial_attractiveness":
      return lead.commercial_attractiveness_score;
    case "contactability":
      return lead.contactability_score;
    case "landing_fit":
      return lead.landing_fit_score;
    case "local_opportunity":
      return lead.local_opportunity_score;
  }
}

/** Color por saturación de la dimensión, no por marca: comunica dato. */
function fillColor(ratio: number) {
  if (ratio >= 0.85) return "#C9A227";
  if (ratio >= 0.6) return "#A98F3F";
  if (ratio >= 0.35) return "#6E7E92";
  return "#4F5A66";
}

export default function ScoreExplainer({ lead }: { lead: Lead }) {
  const tier = TIER[lead.priority_tier];

  return (
    <div>
      {/* Cabecera del score */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-widest2 text-paper-dim/45">
            Opportunity Score
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span
              className="font-serif text-5xl leading-none tabular-nums"
              style={{ color: tier.color }}
            >
              {lead.priority_score}
            </span>
            <span className="font-serif text-xl text-paper-dim/35">/ 100</span>
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest2 text-paper-dim/45">Confidence</p>
          <p className="mt-1 flex items-baseline justify-end gap-2">
            <span className="font-serif text-3xl leading-none tabular-nums text-[#7FA8C9]">
              {lead.confidence_score}
            </span>
            <span className="font-serif text-base text-paper-dim/35">%</span>
          </p>
        </div>
      </div>

      {/* Barra apilada: cómo se compone el total */}
      <div className="mt-5">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
          {DIMENSION_ORDER.map((dimension) => {
            const value = dimensionValue(lead, dimension);
            const meta = DIMENSION[dimension];
            return (
              <div
                key={dimension}
                title={`${meta.label}: ${value} puntos del total`}
                className="h-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${value}%`,
                  backgroundColor: fillColor(value / meta.max),
                  boxShadow: "inset -1px 0 0 rgba(10,10,10,0.55)",
                }}
              />
            );
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-paper-dim/35">
          Cada segmento es la contribución de una dimensión al total de 100 puntos.
        </p>
      </div>

      {/* Desglose por dimensión */}
      <ul className="mt-5 space-y-4">
        {DIMENSION_ORDER.map((dimension) => {
          const meta = DIMENSION[dimension];
          const value = dimensionValue(lead, dimension);
          const ratio = meta.max > 0 ? value / meta.max : 0;

          return (
            <li key={dimension}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-xs text-paper">{meta.label}</span>
                  <span
                    title={meta.description}
                    className="shrink-0 cursor-help text-paper-dim/25 transition-colors duration-200 hover:text-gold"
                  >
                    <Info size={11} strokeWidth={1.7} />
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-paper">
                  {value}
                  <span className="text-paper-dim/30"> / {meta.max}</span>
                  <span className="ml-2 text-[10px] text-paper-dim/40">
                    {Math.round(ratio * 100)}%
                  </span>
                </span>
              </div>

              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${ratio * 100}%`, backgroundColor: fillColor(ratio) }}
                />
              </div>

              <p className="mt-1 text-[11px] leading-relaxed text-paper-dim/40">
                {meta.description}
              </p>
            </li>
          );
        })}
      </ul>

      {/* Confidence */}
      <div className="mt-6 rounded-md border border-white/[0.06] bg-white/[0.015] p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-paper">Confidence Score</span>
          <span className="text-xs tabular-nums text-paper">
            {lead.confidence_score}
            <span className="text-paper-dim/30"> / 100</span>
          </span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
          <div
            className="h-full rounded-full bg-[#7FA8C9] transition-[width] duration-700 ease-out"
            style={{ width: `${lead.confidence_score}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-paper-dim/45">
          Mide la fiabilidad del dato, no la calidad del prospecto. Opera de forma independiente al
          Priority Score para que la falta de información no altere artificialmente la prioridad
          comercial.
          {lead.confidence_score < 65
            ? " Por debajo de 65: el documento canónico exige validación humana antes de contactar."
            : ""}
        </p>
      </div>
    </div>
  );
}
