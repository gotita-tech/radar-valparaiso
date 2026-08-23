"use client";

import { useState } from "react";
import { AlertTriangle, CircleDashed, CircleSlash, MinusCircle, TrendingUp } from "lucide-react";
import type { ClaimKind, DataGap, Signal, SignalTone } from "@/lib/radar/diagnosis";
import { ClaimBadge } from "./studio-ui";

const TONE_ICON: Record<SignalTone, typeof AlertTriangle> = {
  critical: CircleSlash,
  warning: AlertTriangle,
  neutral: MinusCircle,
  positive: TrendingUp,
};

const TONE_COLOR: Record<SignalTone, string> = {
  critical: "#D9503F",
  warning: "#D67E33",
  neutral: "#7A8590",
  positive: "#5FA463",
};

type FilterKey = "all" | ClaimKind;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "fact", label: "Hechos" },
  { key: "inference", label: "Inferencias" },
];

export default function SignalsPanel({
  signals,
  gaps,
}: {
  signals: Signal[];
  gaps: DataGap[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const visible = filter === "all" ? signals : signals.filter((s) => s.kind === filter);

  const counts = {
    all: signals.length,
    fact: signals.filter((s) => s.kind === "fact").length,
    inference: signals.filter((s) => s.kind === "inference").length,
    recommendation: signals.filter((s) => s.kind === "recommendation").length,
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filtrar señales por tipo de afirmación"
        className="mb-4 inline-flex items-center gap-0.5 rounded-md border border-white/[0.07] bg-white/[0.02] p-0.5"
      >
        {FILTERS.map((item) => {
          const active = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(item.key)}
              className={`inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-xs transition-colors duration-200 ${
                active
                  ? "bg-gold/[0.14] text-gold"
                  : "text-paper-dim hover:bg-white/[0.04] hover:text-paper"
              }`}
            >
              {item.label}
              <span className="tabular-nums opacity-55">{counts[item.key]}</span>
            </button>
          );
        })}
      </div>

      {visible.length ? (
        <ul className="space-y-0">
          {visible.map((signal) => {
            const Icon = TONE_ICON[signal.tone];
            const color = TONE_COLOR[signal.tone];
            return (
              <li
                key={signal.id}
                className="group border-b border-white/[0.04] py-3 last:border-0"
              >
                <div className="flex items-start gap-3">
                  <Icon
                    size={14}
                    strokeWidth={1.7}
                    className="mt-0.5 shrink-0"
                    style={{ color }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-paper">{signal.label}</p>
                      <ClaimBadge kind={signal.kind} />
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-paper-dim/60">
                      {signal.detail}
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] text-paper-dim/30">
                      {signal.evidence}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-6 text-center text-xs text-paper-dim/40">
          No hay señales de este tipo para el prospecto.
        </p>
      )}

      {gaps.length ? (
        <div className="mt-5 rounded-md border border-white/[0.06] bg-white/[0.015] p-3.5">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-widest2 text-paper-dim/45">
            <CircleDashed size={12} strokeWidth={1.7} />
            Vacíos de información ({gaps.length})
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-paper-dim/45">
            Campos que el dataset no tiene. No se infiere nada sobre ellos: se declaran como
            desconocidos y se arrastran al brief y al prompt como pendientes.
          </p>
          <ul className="mt-3 space-y-1.5">
            {gaps.map((gap) => (
              <li key={gap.field} className="flex items-start gap-2 text-[11px] leading-relaxed">
                <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-paper-dim/30" />
                <span className="text-paper-dim/60">
                  <span className="text-paper-dim">{gap.label}</span>
                  <span className="ml-1.5 font-mono text-[10px] text-paper-dim/30">{gap.field}</span>
                  <br />
                  {gap.impact}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
