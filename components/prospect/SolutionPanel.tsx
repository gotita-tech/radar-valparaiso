"use client";

import { AlertCircle, Target } from "lucide-react";
import { PRIORITY_LABEL, type Blueprint, type ModulePriority } from "@/lib/radar/solution";

const PRIORITY_STYLE: Record<ModulePriority, { color: string; soft: string }> = {
  core: { color: "#C9A227", soft: "rgba(201,162,39,0.13)" },
  recommended: { color: "#7FA8C9", soft: "rgba(127,168,201,0.13)" },
  optional: { color: "#8A8A8A", soft: "rgba(138,138,138,0.12)" },
};

export default function SolutionPanel({ blueprint }: { blueprint: Blueprint }) {
  const groups: ModulePriority[] = ["core", "recommended", "optional"];

  return (
    <div>
      <div className="rounded-md border border-gold/20 bg-gold/[0.05] p-4">
        <p className="text-[10px] uppercase tracking-widest2 text-gold/70">Tipo de landing</p>
        <p className="mt-1 font-serif text-lg text-paper">{blueprint.landingType}</p>

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-paper">
          <Target size={14} strokeWidth={1.7} className="mt-0.5 shrink-0 text-gold" />
          <span>
            <span className="text-[10px] uppercase tracking-widest text-paper-dim/45">
              Objetivo de conversión
            </span>
            <br />
            {blueprint.conversionGoal}
          </span>
        </p>
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-md border border-white/[0.06] bg-white/[0.015] px-3 py-2.5 text-[11px] leading-relaxed text-paper-dim/55">
        <AlertCircle size={12} strokeWidth={1.7} className="mt-px shrink-0 text-paper-dim/35" />
        {blueprint.scopeNote}
      </p>

      <div className="mt-5 space-y-5">
        {groups.map((priority) => {
          const modules = blueprint.modules.filter((feature) => feature.priority === priority);
          if (!modules.length) return null;
          const style = PRIORITY_STYLE[priority];

          return (
            <div key={priority}>
              <h3 className="mb-2.5 flex items-center gap-2 text-[10px] uppercase tracking-widest2 text-paper-dim/45">
                <span
                  className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-medium tracking-widest"
                  style={{ color: style.color, backgroundColor: style.soft }}
                >
                  {PRIORITY_LABEL[priority]}
                </span>
                {modules.length} módulo{modules.length === 1 ? "" : "s"}
              </h3>

              <ul className="grid gap-2 sm:grid-cols-2">
                {modules.map((feature) => (
                  <li
                    key={feature.id}
                    className="rounded-md border border-white/[0.06] bg-white/[0.015] p-3 transition-colors duration-200 hover:border-white/[0.12]"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: style.color }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-paper">{feature.label}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-paper-dim/55">
                          {feature.rationale}
                        </p>
                        {feature.source ? (
                          <p className="mt-1.5 font-mono text-[10px] text-[#7FA8C9]/60">
                            {feature.source}
                          </p>
                        ) : null}
                        {feature.needsData ? (
                          <p className="mt-1.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-[#D67E33]/80">
                            <AlertCircle size={10} strokeWidth={1.9} className="mt-px shrink-0" />
                            {feature.needsData}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
