/**
 * Tipos de dominio del radar ciudadano.
 *
 * Se derivan de las filas de Supabase (`lib/supabase/database.types.ts`) en vez
 * de redeclararse: si una migración cambia una columna, el error aparece aquí y
 * no tres capas más arriba.
 */
import type { Tables } from "@/lib/supabase/database.types";

export type {
  ConfirmationType,
  IncidentSeverity,
  IncidentStatus,
  MediaType,
  UserRole,
} from "@/lib/supabase/database.types";

import type { IncidentSeverity, IncidentStatus } from "@/lib/supabase/database.types";

export type IncidentCategory = Tables<"incident_categories">;
export type IncidentRow = Tables<"incidents">;
export type Profile = Tables<"profiles">;
export type IncidentConfirmation = Tables<"incident_confirmations">;
export type IncidentComment = Tables<"incident_comments">;
export type IncidentMedia = Tables<"incident_media">;

/** Un incidente con su categoría ya resuelta, que es como lo pinta la interfaz. */
export type Incident = IncidentRow & {
  category: IncidentCategory | null;
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: "Reportado",
  under_review: "En revisión",
  verified: "Verificado",
  resolved: "Resuelto",
  rejected: "Rechazado",
};

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

/** Paleta alineada con la del radar comercial: mismo lenguaje visual. */
export const INCIDENT_SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  low: "#5B8DB8",
  medium: "#C9A227",
  high: "#D67E33",
  critical: "#D9503F",
};

export const INCIDENT_SEVERITIES: IncidentSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];

/** Lo que la aplicación acepta de un formulario antes de validarlo. */
export type IncidentDraft = {
  category_slug: string;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  address: string | null;
  commune: string | null;
};
