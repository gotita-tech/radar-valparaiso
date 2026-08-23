"use client";

import { RotateCcw, ShieldCheck } from "lucide-react";
import { FACETS } from "@/lib/radar/data";
import { NICHE_LABEL, TIER, WEB_CLASS } from "@/lib/radar/taxonomy";
import type { Filters, Lead, Niche, ScoreThreshold, WebsiteClassification } from "@/lib/radar/types";
import { Chip, SectionLabel } from "./ui";

const SCORE_STEPS: { value: ScoreThreshold; label: string }[] = [
  { value: 0, label: "Todos" },
  { value: 60, label: "≥ 60" },
  { value: 75, label: "≥ 75" },
  { value: 85, label: "≥ 85" },
];

export default function FilterPanel({
  filters,
  onChange,
  onReset,
  leads,
  activeCount,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  leads: Lead[];
  activeCount: number;
}) {
  const countBy = <T,>(predicate: (lead: Lead) => T, value: T) =>
    leads.filter((lead) => predicate(lead) === value).length;

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const stepIndex = SCORE_STEPS.findIndex((step) => step.value === filters.minScore);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest2 text-paper-dim/50">Filtros</p>
          <p className="mt-0.5 text-xs text-paper-dim">
            {activeCount} filtro{activeCount === 1 ? "" : "s"} activo
            {activeCount === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={activeCount === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] px-2 py-1.5 text-[11px] text-paper-dim transition-colors duration-200 hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/[0.07] disabled:hover:text-paper-dim"
        >
          <RotateCcw size={12} strokeWidth={1.6} />
          Limpiar
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <section>
          <SectionLabel>Comuna</SectionLabel>
          <div className="space-y-1">
            {FACETS.communes.map((commune) => (
              <Chip
                key={commune}
                active={filters.communes.includes(commune)}
                count={countBy((lead) => lead.commune, commune)}
                onClick={() =>
                  onChange({ ...filters, communes: toggle(filters.communes, commune) })
                }
              >
                {commune}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>Nicho</SectionLabel>
          <div className="space-y-1">
            {FACETS.niches.map((niche: Niche) => (
              <Chip
                key={niche}
                active={filters.niches.includes(niche)}
                count={countBy((lead) => lead.niche, niche)}
                onClick={() => onChange({ ...filters, niches: toggle(filters.niches, niche) })}
              >
                {NICHE_LABEL[niche]}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>Priority Score</SectionLabel>
          <input
            type="range"
            min={0}
            max={SCORE_STEPS.length - 1}
            step={1}
            value={stepIndex < 0 ? 0 : stepIndex}
            onChange={(event) =>
              onChange({ ...filters, minScore: SCORE_STEPS[Number(event.target.value)].value })
            }
            aria-label="Umbral mínimo de Priority Score"
            className="radar-range w-full"
          />
          <div className="mt-2 flex items-center justify-between">
            {SCORE_STEPS.map((step) => (
              <button
                key={step.value}
                type="button"
                onClick={() => onChange({ ...filters, minScore: step.value })}
                className={`rounded px-1.5 py-0.5 text-[11px] tabular-nums transition-colors duration-200 ${
                  filters.minScore === step.value
                    ? "text-gold"
                    : "text-paper-dim/45 hover:text-paper-dim"
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>Estado web</SectionLabel>
          <div className="space-y-1">
            {FACETS.webClasses.map((webClass: WebsiteClassification) => (
              <Chip
                key={webClass}
                active={filters.webClasses.includes(webClass)}
                count={countBy((lead) => lead.website_classification, webClass)}
                dotColor={webClass >= 3 ? "#D67E33" : webClass === 0 ? "#5B8DB8" : "#8A8A8A"}
                title={WEB_CLASS[webClass].description}
                onClick={() =>
                  onChange({ ...filters, webClasses: toggle(filters.webClasses, webClass) })
                }
              >
                {WEB_CLASS[webClass].label}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>Contactabilidad</SectionLabel>
          <Chip
            active={filters.onlyContactable}
            onClick={() => onChange({ ...filters, onlyContactable: !filters.onlyContactable })}
            title="Muestra sólo prospectos con al menos un canal público disponible en el dataset"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={12} strokeWidth={1.6} />
              Con canal de contacto
            </span>
          </Chip>
        </section>

        <section className="border-t border-white/[0.05] pt-4">
          <SectionLabel>Rangos de prioridad</SectionLabel>
          <ul className="space-y-1.5">
            {(["VERY_HIGH", "HIGH", "GOOD", "MEDIUM", "LOW"] as const).map((tier) => (
              <li key={tier} className="flex items-center gap-2 text-[11px]">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TIER[tier].color }}
                />
                <span className="text-paper-dim/70">{TIER[tier].label}</span>
                <span className="ml-auto tabular-nums text-paper-dim/40">{TIER[tier].range}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
