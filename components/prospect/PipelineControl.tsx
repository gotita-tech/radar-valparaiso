"use client";

import { useEffect, useState } from "react";
import { Check, Laptop, RotateCcw } from "lucide-react";
import {
  FUNNEL_STAGES,
  PIPELINE_STAGES,
  STAGE_META,
  type PipelineEntry,
  type PipelineStage,
} from "@/lib/radar/pipeline";

export default function PipelineControl({
  entry,
  hydrated,
  onStageChange,
  onNoteChange,
  onReset,
}: {
  entry: PipelineEntry;
  hydrated: boolean;
  onStageChange: (stage: PipelineStage) => void;
  onNoteChange: (note: string) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState(entry.note);
  const [saved, setSaved] = useState(false);

  // El borrador sigue al almacén cuando cambia desde fuera (otra pestaña, reset).
  useEffect(() => setDraft(entry.note), [entry.note]);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  const meta = STAGE_META[entry.stage];
  const currentIndex = FUNNEL_STAGES.indexOf(entry.stage);

  const commitNote = () => {
    if (draft === entry.note) return;
    onNoteChange(draft);
    setSaved(true);
  };

  return (
    <div>
      {/* Estado actual */}
      <div className="flex items-center justify-between gap-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[10px] font-medium uppercase tracking-widest"
          style={{ color: meta.color, backgroundColor: meta.soft }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: meta.color }}
            aria-hidden="true"
          />
          {meta.label}
        </span>
        {hydrated && entry.updatedAt ? (
          <button
            type="button"
            onClick={onReset}
            title="Volver a NEW y borrar la nota de este prospecto"
            className="inline-flex items-center gap-1 text-[10px] text-paper-dim/40 transition-colors duration-200 hover:text-paper-dim"
          >
            <RotateCcw size={10} strokeWidth={1.8} />
            Reiniciar
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-paper-dim/50">{meta.description}</p>

      {/* Progreso del embudo */}
      <div className="mt-3 flex gap-0.5" aria-hidden="true">
        {FUNNEL_STAGES.map((stage, index) => (
          <span
            key={stage}
            title={STAGE_META[stage].label}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{
              backgroundColor:
                entry.stage === "LOST"
                  ? "rgba(140,74,69,0.35)"
                  : index <= currentIndex
                    ? meta.color
                    : "rgba(255,255,255,0.07)",
            }}
          />
        ))}
      </div>

      {/* Selector de estado */}
      <label
        htmlFor="pipeline-stage"
        className="mt-4 block text-[10px] uppercase tracking-widest2 text-paper-dim/45"
      >
        Cambiar estado
      </label>
      <select
        id="pipeline-stage"
        value={entry.stage}
        onChange={(event) => onStageChange(event.target.value as PipelineStage)}
        className="mt-1.5 w-full rounded-md border border-white/[0.09] bg-ink-950 px-3 py-2 text-xs text-paper transition-colors duration-200 focus:border-gold/50 focus:outline-none"
      >
        {PIPELINE_STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {STAGE_META[stage].label}
          </option>
        ))}
      </select>

      {/* Nota privada */}
      <label
        htmlFor="pipeline-note"
        className="mt-4 block text-[10px] uppercase tracking-widest2 text-paper-dim/45"
      >
        Nota privada
      </label>
      <textarea
        id="pipeline-note"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitNote}
        rows={4}
        maxLength={1000}
        placeholder="Contexto para tu próxima gestión con este prospecto…"
        className="mt-1.5 w-full resize-y rounded-md border border-white/[0.09] bg-ink-950 px-3 py-2 text-xs leading-relaxed text-paper placeholder:text-paper-dim/30 transition-colors duration-200 focus:border-gold/50 focus:outline-none"
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={commitNote}
          disabled={draft === entry.note}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-35 ${
            saved
              ? "border-[#5FA463]/50 bg-[#5FA463]/[0.12] text-[#7FBE83]"
              : "border-white/[0.09] bg-white/[0.02] text-paper-dim hover:border-gold/40 hover:text-gold"
          }`}
        >
          {saved ? <Check size={12} strokeWidth={2} /> : null}
          {saved ? "Guardada" : "Guardar nota"}
        </button>
        <span className="text-[10px] tabular-nums text-paper-dim/25">{draft.length} / 1000</span>
      </div>

      <p className="mt-3 flex items-start gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.015] px-2.5 py-2 text-[10px] leading-relaxed text-paper-dim/40">
        <Laptop size={11} strokeWidth={1.7} className="mt-px shrink-0" />
        El estado y la nota se guardan <strong className="font-medium">solamente en este
        navegador</strong>. No se envían a ningún servidor y no estarán disponibles en otro equipo.
      </p>

      {hydrated && entry.updatedAt ? (
        <p className="mt-2 text-[10px] text-paper-dim/25">
          Última actualización: {new Date(entry.updatedAt).toLocaleString("es-CL")}
        </p>
      ) : null}
    </div>
  );
}
