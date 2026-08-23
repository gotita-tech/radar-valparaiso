"use client";

/**
 * Pipeline comercial local.
 *
 * Estado y notas viven exclusivamente en `localStorage` de este navegador.
 * No hay backend, ni sincronización, ni envío a ningún servicio. Si el usuario
 * limpia el navegador o cambia de equipo, esta información desaparece: la
 * interfaz lo dice explícitamente en cada punto donde se escribe.
 */
import { useCallback, useEffect, useState } from "react";

export const STORAGE_KEY = "opportunity-radar:pipeline:v1";

export const PIPELINE_STAGES = [
  "NEW",
  "ANALYZED",
  "BRIEF_READY",
  "DEMO_READY",
  "CONTACTED",
  "RESPONDED",
  "MEETING",
  "WON",
  "LOST",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_META: Record<
  PipelineStage,
  { label: string; short: string; color: string; soft: string; description: string }
> = {
  NEW: {
    label: "Nuevo",
    short: "NEW",
    color: "#8A8A8A",
    soft: "rgba(138,138,138,0.12)",
    description: "Sin trabajar. Aparece en el Radar pero nadie lo ha revisado.",
  },
  ANALYZED: {
    label: "Analizado",
    short: "ANALYZED",
    color: "#5B8DB8",
    soft: "rgba(91,141,184,0.14)",
    description: "Se revisó el diagnóstico y la oportunidad en el Prospect Studio.",
  },
  BRIEF_READY: {
    label: "Brief listo",
    short: "BRIEF",
    color: "#6FA8A0",
    soft: "rgba(111,168,160,0.14)",
    description: "El brief está generado y disponible para compartir.",
  },
  DEMO_READY: {
    label: "Demo lista",
    short: "DEMO",
    color: "#C9A227",
    soft: "rgba(201,162,39,0.14)",
    description: "Existe una demo construida para mostrar al prospecto.",
  },
  CONTACTED: {
    label: "Contactado",
    short: "CONTACTADO",
    color: "#D67E33",
    soft: "rgba(214,126,51,0.14)",
    description: "Se abrió conversación por un canal público del negocio.",
  },
  RESPONDED: {
    label: "Respondió",
    short: "RESPONDIÓ",
    color: "#D9A441",
    soft: "rgba(217,164,65,0.14)",
    description: "El negocio contestó. Hay conversación viva.",
  },
  MEETING: {
    label: "Reunión",
    short: "REUNIÓN",
    color: "#B08CC4",
    soft: "rgba(176,140,196,0.14)",
    description: "Hay una reunión agendada o realizada.",
  },
  WON: {
    label: "Ganado",
    short: "GANADO",
    color: "#5FA463",
    soft: "rgba(95,164,99,0.14)",
    description: "Cerrado. El prospecto se convirtió en cliente.",
  },
  LOST: {
    label: "Perdido",
    short: "PERDIDO",
    color: "#8C4A45",
    soft: "rgba(140,74,69,0.14)",
    description: "Descartado o sin interés. Fuera de campañas activas.",
  },
};

/** Orden del embudo. LOST queda fuera del avance lineal. */
export const FUNNEL_STAGES: PipelineStage[] = [
  "NEW",
  "ANALYZED",
  "BRIEF_READY",
  "DEMO_READY",
  "CONTACTED",
  "RESPONDED",
  "MEETING",
  "WON",
];

export type PipelineEntry = {
  stage: PipelineStage;
  note: string;
  updatedAt: string;
};

export type PipelineState = Record<string, PipelineEntry>;

function isStage(value: unknown): value is PipelineStage {
  return typeof value === "string" && (PIPELINE_STAGES as readonly string[]).includes(value);
}

function readStorage(): PipelineState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const state: PipelineState = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== "object") continue;
      const entry = value as Partial<PipelineEntry>;
      if (!isStage(entry.stage)) continue;
      state[id] = {
        stage: entry.stage,
        note: typeof entry.note === "string" ? entry.note : "",
        updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : new Date().toISOString(),
      };
    }
    return state;
  } catch {
    // Un localStorage corrupto o bloqueado no debe romper la aplicación.
    return {};
  }
}

function writeStorage(state: PipelineState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    // Modo privado o cuota llena: la sesión sigue funcionando en memoria.
  }
}

const SYNC_EVENT = "opportunity-radar:pipeline-sync";

export function stageIndex(stage: PipelineStage) {
  const index = FUNNEL_STAGES.indexOf(stage);
  return index < 0 ? -1 : index;
}

/**
 * Estado del pipeline con sincronización entre componentes de la misma pestaña
 * y entre pestañas distintas del mismo navegador.
 *
 * `hydrated` evita el desajuste servidor/cliente: en el primer render el estado
 * está vacío, igual que en el HTML prerenderizado.
 */
export function usePipeline() {
  const [state, setState] = useState<PipelineState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStorage());
    setHydrated(true);

    const sync = () => setState(readStorage());
    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((businessId: string, patch: Partial<Omit<PipelineEntry, "updatedAt">>) => {
    setState((current) => {
      const previous = current[businessId] ?? { stage: "NEW" as PipelineStage, note: "", updatedAt: "" };
      const next: PipelineState = {
        ...current,
        [businessId]: {
          stage: patch.stage ?? previous.stage,
          note: patch.note ?? previous.note,
          updatedAt: new Date().toISOString(),
        },
      };
      writeStorage(next);
      return next;
    });
  }, []);

  const setStage = useCallback(
    (businessId: string, stage: PipelineStage) => update(businessId, { stage }),
    [update],
  );

  const setNote = useCallback(
    (businessId: string, note: string) => update(businessId, { note }),
    [update],
  );

  /** Avanza sólo si el estado destino está más adelante en el embudo. */
  const advanceTo = useCallback(
    (businessId: string, stage: PipelineStage) => {
      setState((current) => {
        const previous = current[businessId];
        const currentStage = previous?.stage ?? "NEW";
        if (currentStage === "LOST" || currentStage === "WON") return current;
        if (stageIndex(stage) <= stageIndex(currentStage)) return current;

        const next: PipelineState = {
          ...current,
          [businessId]: {
            stage,
            note: previous?.note ?? "",
            updatedAt: new Date().toISOString(),
          },
        };
        writeStorage(next);
        return next;
      });
    },
    [],
  );

  const reset = useCallback((businessId: string) => {
    setState((current) => {
      const next = { ...current };
      delete next[businessId];
      writeStorage(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setState({});
    writeStorage({});
  }, []);

  const entryOf = useCallback(
    (businessId: string): PipelineEntry =>
      state[businessId] ?? { stage: "NEW", note: "", updatedAt: "" },
    [state],
  );

  return { state, hydrated, entryOf, setStage, setNote, advanceTo, reset, clearAll };
}
