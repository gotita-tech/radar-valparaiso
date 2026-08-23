"use client";

import { NICHE_LABEL, TIER, TIER_ORDER, WEB_CLASS, WEB_CLASS_ORDER } from "@/lib/radar/taxonomy";
import type { Metrics } from "@/lib/radar/data";
import type { Lead, Niche, WebsiteClassification } from "@/lib/radar/types";
import { SectionLabel } from "./ui";

function DistributionRow({
  label,
  count,
  total,
  caption,
  color,
  onClick,
  active,
}: {
  label: string;
  count: number;
  total: number;
  caption?: string;
  color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={active}
      className={`group grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-md px-2 py-1.5 text-left transition-colors duration-200 ${
        onClick ? "hover:bg-white/[0.03]" : "cursor-default"
      } ${active ? "bg-gold/[0.07]" : ""}`}
    >
      <span className="truncate text-xs text-paper-dim group-hover:text-paper">{label}</span>
      <span className="text-xs tabular-nums text-paper">{count}</span>
      <span className="col-span-2 flex items-center gap-2">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <span
            className="block h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </span>
        {caption ? (
          <span className="shrink-0 text-[10px] tabular-nums text-paper-dim/45">{caption}</span>
        ) : null}
      </span>
    </button>
  );
}

export default function DistributionPanel({
  metrics,
  leads,
  onSelectNiche,
  onSelectCommune,
  activeNiches,
  activeCommunes,
}: {
  metrics: Metrics;
  leads: Lead[];
  onSelectNiche: (niche: Niche) => void;
  onSelectCommune: (commune: string) => void;
  activeNiches: Niche[];
  activeCommunes: string[];
}) {
  const total = metrics.total;

  const webCounts = WEB_CLASS_ORDER.map((webClass) => ({
    webClass,
    count: leads.filter((l) => l.website_classification === webClass).length,
  })).filter((row) => row.count > 0);

  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.06] lg:grid-cols-3">
      <section className="bg-ink-950 p-4">
        <SectionLabel>Distribución por nicho</SectionLabel>
        <div className="space-y-0.5">
          {metrics.byNiche.map((row) => (
            <DistributionRow
              key={row.key}
              label={NICHE_LABEL[row.key]}
              count={row.count}
              total={total}
              caption={`prom. ${row.avgPriority.toFixed(0)}`}
              color="#C9A227"
              onClick={() => onSelectNiche(row.key)}
              active={activeNiches.includes(row.key)}
            />
          ))}
          {!metrics.byNiche.length ? (
            <p className="px-2 py-3 text-xs text-paper-dim/40">Sin resultados</p>
          ) : null}
        </div>
      </section>

      <section className="bg-ink-950 p-4">
        <SectionLabel>Distribución por comuna</SectionLabel>
        <div className="space-y-0.5">
          {metrics.byCommune.map((row) => (
            <DistributionRow
              key={row.key}
              label={row.key}
              count={row.count}
              total={total}
              caption={`prom. ${row.avgPriority.toFixed(0)}`}
              color="#5B8DB8"
              onClick={() => onSelectCommune(row.key)}
              active={activeCommunes.includes(row.key)}
            />
          ))}
          {!metrics.byCommune.length ? (
            <p className="px-2 py-3 text-xs text-paper-dim/40">Sin resultados</p>
          ) : null}
        </div>
      </section>

      <section className="bg-ink-950 p-4">
        <SectionLabel>Estado web y prioridad</SectionLabel>
        <div className="space-y-0.5">
          {webCounts.map((row) => (
            <DistributionRow
              key={row.webClass}
              label={WEB_CLASS[row.webClass as WebsiteClassification].label}
              count={row.count}
              total={total}
              color={row.webClass >= 3 ? "#D67E33" : "#6B7280"}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.05] pt-3">
          {TIER_ORDER.filter((tier) =>
            metrics.byTier.some((row) => row.key === tier),
          ).map((tier) => {
            const row = metrics.byTier.find((item) => item.key === tier);
            return (
              <span
                key={tier}
                className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-widest"
                style={{ color: TIER[tier].color, backgroundColor: TIER[tier].soft }}
                title={TIER[tier].action}
              >
                {TIER[tier].label}
                <span className="tabular-nums opacity-70">{row?.count ?? 0}</span>
              </span>
            );
          })}
        </div>
      </section>
    </div>
  );
}
