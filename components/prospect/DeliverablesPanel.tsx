"use client";

import { useMemo, useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { briefFilename, buildBrief } from "@/lib/radar/brief";
import { buildClaudePrompt, promptFilename } from "@/lib/radar/prompt";
import type { Lead } from "@/lib/radar/types";
import { CopyButton, DownloadButton, MarkdownPreview } from "./studio-ui";

type Tab = "brief" | "prompt";

export default function DeliverablesPanel({
  lead,
  slug,
  onBriefReady,
  onPromptReady,
}: {
  lead: Lead;
  slug: string;
  onBriefReady: () => void;
  onPromptReady: () => void;
}) {
  const [tab, setTab] = useState<Tab>("brief");

  // Deterministas y baratos: se derivan del lead, no de un servicio externo.
  const brief = useMemo(() => buildBrief(lead), [lead]);
  const prompt = useMemo(() => buildClaudePrompt(lead, slug), [lead, slug]);

  const active = tab === "brief" ? brief : prompt;
  const filename = tab === "brief" ? briefFilename(lead, slug) : promptFilename(slug);
  const notify = tab === "brief" ? onBriefReady : onPromptReady;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Entregable"
          className="inline-flex items-center gap-0.5 rounded-md border border-white/[0.07] bg-white/[0.02] p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "brief"}
            onClick={() => setTab("brief")}
            className={`inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs transition-colors duration-200 ${
              tab === "brief"
                ? "bg-gold/[0.14] text-gold"
                : "text-paper-dim hover:bg-white/[0.04] hover:text-paper"
            }`}
          >
            <FileText size={13} strokeWidth={1.6} />
            Prospect Brief
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "prompt"}
            onClick={() => setTab("prompt")}
            className={`inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs transition-colors duration-200 ${
              tab === "prompt"
                ? "bg-gold/[0.14] text-gold"
                : "text-paper-dim hover:bg-white/[0.04] hover:text-paper"
            }`}
          >
            <Sparkles size={13} strokeWidth={1.6} />
            Prompt para Claude Code
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <CopyButton
            value={active}
            label={tab === "brief" ? "Copiar brief" : "Copiar prompt"}
            onCopied={notify}
          />
          <DownloadButton
            filename={filename}
            content={active}
            label="Descargar .md"
            onDownloaded={notify}
          />
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-paper-dim/45">
        {tab === "brief"
          ? "Documento de trabajo generado a partir del dataset y de los motores de diagnóstico y solución. Cada afirmación va etiquetada como hecho, inferencia o recomendación, y cita el campo que la respalda."
          : "Instrucciones listas para pegar en Claude Code. Incluyen los datos verificados, los vacíos declarados y las restricciones de no invención, de modo que la demo resultante respete la misma disciplina de datos que el Radar."}
      </p>

      <div className="mt-3">
        <MarkdownPreview content={active} maxHeight={380} />
      </div>

      <p className="mt-2 text-[10px] text-paper-dim/30">
        {active.split("\n").length} líneas · {active.length.toLocaleString("es-CL")} caracteres ·
        generado localmente, sin llamadas a ninguna API
      </p>
    </div>
  );
}
