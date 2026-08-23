"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { NICHE_LABEL, TIER, WEB_CLASS } from "@/lib/radar/taxonomy";
import type { Lead, SortKey } from "@/lib/radar/types";
import { EmptyState, Meter, TierBadge } from "./ui";

const COLUMNS: { key: SortKey | null; label: string; align?: "right"; className?: string }[] = [
  { key: "business_name", label: "Negocio" },
  { key: null, label: "Nicho" },
  { key: null, label: "Comuna" },
  { key: null, label: "Estado web" },
  { key: "digital_need_score", label: "Digital Need", align: "right" },
  { key: "priority_score", label: "Priority", align: "right" },
  { key: "confidence_score", label: "Confidence", align: "right" },
  { key: null, label: "Tier" },
];

export default function LeadTable({
  leads,
  selectedId,
  onSelect,
  sortKey,
  sortDirection,
  onSort,
}: {
  leads: Lead[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  if (!leads.length) {
    return (
      <EmptyState
        title="Ningún prospecto coincide"
        hint="Ajusta los filtros o limpia la búsqueda para volver al dataset completo."
      />
    );
  }

  return (
    <>
      {/* Tabla densa — desktop y tablet */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/[0.07]">
              {COLUMNS.map((column) => {
                const sortable = column.key !== null;
                const isActive = sortable && column.key === sortKey;
                return (
                  <th
                    key={column.label}
                    scope="col"
                    className={`px-4 py-2.5 text-[10px] font-normal uppercase tracking-widest2 text-paper-dim/45 ${
                      column.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.key as SortKey)}
                        className={`inline-flex items-center gap-1 transition-colors duration-200 hover:text-paper ${
                          isActive ? "text-gold" : ""
                        }`}
                      >
                        {column.label}
                        {isActive ? (
                          sortDirection === "desc" ? (
                            <ArrowDown size={11} strokeWidth={1.8} />
                          ) : (
                            <ArrowUp size={11} strokeWidth={1.8} />
                          )
                        ) : (
                          <ArrowUpDown size={11} strokeWidth={1.5} className="opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const tier = TIER[lead.priority_tier];
              const isSelected = lead.business_id === selectedId;
              return (
                <tr
                  key={lead.business_id}
                  onClick={() => onSelect(lead.business_id)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(lead.business_id);
                    }
                  }}
                  className={`cursor-pointer border-b border-white/[0.04] transition-colors duration-150 ${
                    isSelected ? "bg-gold/[0.06]" : "hover:bg-white/[0.025]"
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2.5">
                      <span
                        className="h-6 w-[2px] shrink-0 rounded-full"
                        style={{ backgroundColor: tier.color }}
                        aria-hidden="true"
                      />
                      <span>
                        <span className="block text-paper">{lead.business_name}</span>
                        {lead.address ? (
                          <span className="block text-[11px] text-paper-dim/40">
                            {lead.address}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-paper-dim">
                    {NICHE_LABEL[lead.niche]}
                  </td>
                  <td className="px-4 py-3 text-xs text-paper-dim">{lead.commune}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs"
                      style={{
                        color: lead.website_classification >= 3 ? "#D67E33" : "#9AA0A6",
                      }}
                      title={WEB_CLASS[lead.website_classification].description}
                    >
                      {WEB_CLASS[lead.website_classification].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs tabular-nums text-paper-dim">
                      {lead.digital_need_score}
                      <span className="text-paper-dim/35"> / 40</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-2">
                      <span className="w-14">
                        <Meter
                          value={lead.priority_score}
                          max={100}
                          color={tier.color}
                          height={3}
                        />
                      </span>
                      <span
                        className="w-6 font-serif text-base tabular-nums"
                        style={{ color: tier.color }}
                      >
                        {lead.priority_score}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs tabular-nums text-paper-dim">
                    {lead.confidence_score}
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={lead.priority_tier} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards — móvil */}
      <ul className="divide-y divide-white/[0.05] md:hidden">
        {leads.map((lead) => {
          const tier = TIER[lead.priority_tier];
          return (
            <li key={lead.business_id}>
              <button
                type="button"
                onClick={() => onSelect(lead.business_id)}
                className="w-full px-4 py-3.5 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-paper">{lead.business_name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-paper-dim/55">
                      {NICHE_LABEL[lead.niche]} · {lead.commune}
                    </p>
                  </div>
                  <span
                    className="shrink-0 font-serif text-2xl leading-none tabular-nums"
                    style={{ color: tier.color }}
                  >
                    {lead.priority_score}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <Meter value={lead.priority_score} max={100} color={tier.color} height={3} />
                  <span className="shrink-0 text-[10px] tabular-nums text-paper-dim/40">
                    conf. {lead.confidence_score}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <TierBadge tier={lead.priority_tier} />
                  <span
                    className="text-[11px]"
                    style={{
                      color: lead.website_classification >= 3 ? "#D67E33" : "#9AA0A6",
                    }}
                  >
                    {WEB_CLASS[lead.website_classification].label}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
