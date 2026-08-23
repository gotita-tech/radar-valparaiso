"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Columns3, Radar, Rows3, Trash2 } from "lucide-react";
import { LEADS } from "@/lib/radar/data";
import {
  FUNNEL_STAGES,
  PIPELINE_STAGES,
  STAGE_META,
  usePipeline,
  type PipelineStage,
} from "@/lib/radar/pipeline";
import { slugForLead } from "@/lib/radar/slug";
import { NICHE_LABEL, TIER } from "@/lib/radar/taxonomy";
import type { Lead } from "@/lib/radar/types";

type View = "board" | "table";

const BOARD_STAGES: PipelineStage[] = [...FUNNEL_STAGES, "LOST"];

function LeadCard({
  lead,
  stage,
  note,
  onStageChange,
}: {
  lead: Lead;
  stage: PipelineStage;
  note: string;
  onStageChange: (stage: PipelineStage) => void;
}) {
  const tier = TIER[lead.priority_tier];
  const slug = slugForLead(lead);

  return (
    <li className="rounded-md border border-white/[0.07] bg-ink-950 p-3 transition-colors duration-200 hover:border-white/[0.14]">
      <Link href={`/prospects/${slug}`} className="group block">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-xs text-paper transition-colors duration-200 group-hover:text-gold">
            {lead.business_name}
          </p>
          <span
            className="shrink-0 font-serif text-sm tabular-nums"
            style={{ color: tier.color }}
          >
            {lead.priority_score}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-paper-dim/45">
          {NICHE_LABEL[lead.niche]} · {lead.commune}
        </p>
      </Link>

      {note ? (
        <p className="mt-2 line-clamp-2 border-l border-white/[0.08] pl-2 text-[10px] leading-relaxed text-paper-dim/45">
          {note}
        </p>
      ) : null}

      <label className="sr-only" htmlFor={`stage-${lead.business_id}`}>
        Estado de {lead.business_name}
      </label>
      <select
        id={`stage-${lead.business_id}`}
        value={stage}
        onChange={(event) => onStageChange(event.target.value as PipelineStage)}
        className="mt-2.5 w-full rounded border border-white/[0.08] bg-white/[0.02] px-2 py-1.5 text-[10px] text-paper-dim transition-colors duration-200 focus:border-gold/50 focus:outline-none"
      >
        {PIPELINE_STAGES.map((option) => (
          <option key={option} value={option}>
            {STAGE_META[option].label}
          </option>
        ))}
      </select>
    </li>
  );
}

export default function PipelineView() {
  const { state, hydrated, entryOf, setStage, clearAll } = usePipeline();
  const [view, setView] = useState<View>("board");

  const grouped = useMemo(() => {
    const map = new Map<PipelineStage, Lead[]>();
    for (const stage of PIPELINE_STAGES) map.set(stage, []);
    for (const lead of LEADS) {
      const stage = entryOf(lead.business_id).stage;
      map.get(stage)?.push(lead);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.priority_score - a.priority_score);
    }
    return map;
  }, [entryOf]);

  const tracked = Object.keys(state).length;
  const activeStages = BOARD_STAGES.filter((stage) => (grouped.get(stage)?.length ?? 0) > 0);

  return (
    <div className="min-h-screen bg-ink-950/80">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-ink-950/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 md:px-6">
          <Link
            href="/radar"
            className="group inline-flex shrink-0 items-center gap-2 text-paper-dim transition-colors duration-300 hover:text-gold"
          >
            <ArrowLeft
              size={16}
              strokeWidth={1.6}
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />
            <span className="hidden text-xs sm:inline">Volver al Radar</span>
          </Link>

          <span className="hidden h-5 w-px bg-white/10 sm:block" aria-hidden="true" />

          <nav aria-label="Ruta de navegación" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 text-[11px] text-paper-dim/40">
              <li>
                <Link href="/radar" className="transition-colors duration-200 hover:text-gold">
                  Radar
                </Link>
              </li>
              <ChevronRight size={11} strokeWidth={1.8} aria-hidden="true" />
              <li className="text-paper-dim" aria-current="page">
                Pipeline
              </li>
            </ol>
          </nav>

          <div
            role="tablist"
            aria-label="Vista del pipeline"
            className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-white/[0.07] bg-white/[0.02] p-0.5"
          >
            {(
              [
                { key: "board" as const, label: "Columnas", Icon: Columns3 },
                { key: "table" as const, label: "Tabla", Icon: Rows3 },
              ]
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-xs transition-colors duration-200 ${
                  view === key
                    ? "bg-gold/[0.14] text-gold"
                    : "text-paper-dim hover:bg-white/[0.04] hover:text-paper"
                }`}
              >
                <Icon size={13} strokeWidth={1.6} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-widest2 text-gold/70">
              <Radar size={12} strokeWidth={1.7} />
              Pipeline comercial
            </p>
            <h1 className="mt-2 font-serif text-3xl text-paper md:text-4xl">Embudo local</h1>
            <p className="mt-1.5 text-xs text-paper-dim/55">
              {hydrated
                ? tracked
                  ? `${tracked} de ${LEADS.length} prospectos con estado guardado en este navegador.`
                  : `Ningún prospecto tiene estado guardado todavía. Abre uno desde el Radar para empezar.`
                : "Cargando estado local…"}
            </p>
          </div>

          {hydrated && tracked ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("¿Borrar el estado y las notas de todos los prospectos de este navegador?")) {
                  clearAll();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.09] bg-white/[0.02] px-2.5 py-1.5 text-xs text-paper-dim transition-colors duration-200 hover:border-[#D9503F]/50 hover:text-[#E08573]"
            >
              <Trash2 size={13} strokeWidth={1.6} />
              Borrar todo el pipeline
            </button>
          ) : null}
        </div>

        {/* Resumen del embudo */}
        <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-9">
          {BOARD_STAGES.map((stage) => {
            const count = grouped.get(stage)?.length ?? 0;
            const meta = STAGE_META[stage];
            return (
              <div key={stage} className="bg-ink-950 px-3 py-3" title={meta.description}>
                <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-paper-dim/45">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{meta.label}</span>
                </p>
                <p
                  className="mt-1 font-serif text-2xl leading-none tabular-nums"
                  style={{ color: count ? meta.color : undefined }}
                >
                  {hydrated ? count : "—"}
                </p>
              </div>
            );
          })}
        </div>

        {view === "board" ? (
          <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
            <div className="flex min-w-max gap-3">
              {(activeStages.length ? activeStages : BOARD_STAGES.slice(0, 4)).map((stage) => {
                const leads = grouped.get(stage) ?? [];
                const meta = STAGE_META[stage];
                return (
                  <section
                    key={stage}
                    className="flex w-[260px] shrink-0 flex-col rounded-lg border border-white/[0.07] bg-ink-900/25"
                  >
                    <header className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2.5">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: meta.color }}
                          aria-hidden="true"
                        />
                        <span className="truncate text-[11px] uppercase tracking-widest text-paper-dim">
                          {meta.label}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] tabular-nums text-paper-dim/40">
                        {leads.length}
                      </span>
                    </header>

                    <ul className="min-h-[80px] space-y-2 p-2">
                      {leads.length ? (
                        leads.map((lead) => (
                          <LeadCard
                            key={lead.business_id}
                            lead={lead}
                            stage={stage}
                            note={entryOf(lead.business_id).note}
                            onStageChange={(next) => setStage(lead.business_id, next)}
                          />
                        ))
                      ) : (
                        <li className="px-2 py-4 text-center text-[10px] text-paper-dim/25">
                          Sin prospectos
                        </li>
                      )}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-ink-900/25">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    {["Negocio", "Nicho", "Comuna", "Score", "Estado", "Nota"].map((header) => (
                      <th
                        key={header}
                        scope="col"
                        className="px-4 py-2.5 text-left text-[10px] font-normal uppercase tracking-widest2 text-paper-dim/45"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...LEADS]
                    .sort((a, b) => b.priority_score - a.priority_score)
                    .map((lead) => {
                      const entry = entryOf(lead.business_id);
                      const meta = STAGE_META[entry.stage];
                      const tier = TIER[lead.priority_tier];
                      return (
                        <tr
                          key={lead.business_id}
                          className="border-b border-white/[0.04] transition-colors duration-150 hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/prospects/${slugForLead(lead)}`}
                              className="text-paper transition-colors duration-200 hover:text-gold"
                            >
                              {lead.business_name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-xs text-paper-dim">
                            {NICHE_LABEL[lead.niche]}
                          </td>
                          <td className="px-4 py-3 text-xs text-paper-dim">{lead.commune}</td>
                          <td className="px-4 py-3">
                            <span
                              className="font-serif text-base tabular-nums"
                              style={{ color: tier.color }}
                            >
                              {lead.priority_score}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <label className="sr-only" htmlFor={`row-stage-${lead.business_id}`}>
                              Estado de {lead.business_name}
                            </label>
                            <select
                              id={`row-stage-${lead.business_id}`}
                              value={entry.stage}
                              onChange={(event) =>
                                setStage(lead.business_id, event.target.value as PipelineStage)
                              }
                              className="rounded border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[11px] transition-colors duration-200 focus:border-gold/50 focus:outline-none"
                              style={{ color: meta.color }}
                            >
                              {PIPELINE_STAGES.map((option) => (
                                <option key={option} value={option}>
                                  {STAGE_META[option].label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="max-w-[280px] px-4 py-3">
                            <p className="truncate text-[11px] text-paper-dim/50">
                              {entry.note || <span className="text-paper-dim/25">—</span>}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-6 rounded-lg border border-white/[0.07] bg-ink-900/20 px-4 py-3 text-[11px] leading-relaxed text-paper-dim/45">
          Los estados y las notas se guardan <strong className="text-paper-dim">solamente en este
          navegador</strong> (<code className="font-mono text-[10px]">localStorage</code>). No hay
          backend ni sincronización: si limpias el navegador o abres el proyecto en otro equipo, esta
          información no estará.
        </p>
      </main>
    </div>
  );
}
