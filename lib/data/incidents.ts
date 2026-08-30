import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import type { Incident, IncidentCategory, IncidentStatus } from "@/lib/incidents/types";
import { logDataError } from "./errors";

export type IncidentsQuery = {
  limit?: number;
  categorySlug?: string | null;
  status?: IncidentStatus | null;
  /** Recuadro del mapa: [oeste, sur, este, norte]. */
  bbox?: [number, number, number, number] | null;
};

export type IncidentsResult = {
  incidents: Incident[];
  /** true = Supabase no respondió; no significa "no hay incidentes". */
  degraded: boolean;
};

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

/**
 * La categoría se resuelve con una segunda consulta en vez de con un join
 * anidado de PostgREST.
 *
 * El join obliga a describir las relaciones en los tipos escritos a mano y su
 * inferencia se degrada a `any` con facilidad. Son doce categorías: traerlas
 * enteras y cruzarlas en memoria cuesta menos que perder el tipado.
 */
function indexCategories(categories: IncidentCategory[]) {
  return new Map(categories.map((category) => [category.id, category]));
}

export async function getIncidents(
  query: IncidentsQuery = {},
): Promise<IncidentsResult> {
  const supabase = createPublicClient();

  if (!supabase) {
    return { incidents: [], degraded: true };
  }

  const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

  let categoryId: string | null = null;
  if (query.categorySlug) {
    const { data: category, error: categoryError } = await supabase
      .from("incident_categories")
      .select("id")
      .eq("slug", query.categorySlug)
      .maybeSingle();

    if (categoryError) {
      logDataError("getIncidents:category", categoryError);
      return { incidents: [], degraded: true };
    }

    // Una categoría inexistente no es un fallo: es un filtro sin resultados.
    if (!category) return { incidents: [], degraded: false };
    categoryId = category.id;
  }

  let builder = supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  // RLS ya oculta los rechazados; el filtro explícito documenta la intención.
  builder = query.status
    ? builder.eq("status", query.status)
    : builder.neq("status", "rejected");

  if (categoryId) builder = builder.eq("category_id", categoryId);

  if (query.bbox) {
    const [west, south, east, north] = query.bbox;
    builder = builder
      .gte("longitude", west)
      .lte("longitude", east)
      .gte("latitude", south)
      .lte("latitude", north);
  }

  const [incidentsResponse, categoriesResponse] = await Promise.all([
    builder,
    supabase.from("incident_categories").select("*"),
  ]);

  if (incidentsResponse.error) {
    logDataError("getIncidents", incidentsResponse.error);
    return { incidents: [], degraded: true };
  }

  if (categoriesResponse.error) {
    logDataError("getIncidents:categories", categoriesResponse.error);
  }

  const byId = indexCategories(categoriesResponse.data ?? []);

  return {
    incidents: (incidentsResponse.data ?? []).map((row) => ({
      ...row,
      category: byId.get(row.category_id) ?? null,
    })),
    degraded: false,
  };
}

export async function getIncidentById(id: string): Promise<Incident | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logDataError("getIncidentById", error);
    return null;
  }

  if (!data) return null;

  const { data: category } = await supabase
    .from("incident_categories")
    .select("*")
    .eq("id", data.category_id)
    .maybeSingle();

  return { ...data, category: category ?? null };
}

export type IncidentConfirmationSummary = {
  confirm: number;
  dispute: number;
  resolved: number;
};

/**
 * Recuento de confirmaciones por tipo.
 *
 * `head: true` con `count: exact` pide sólo la cabecera con el total: no viaja
 * ninguna fila. Tres consultas de coste fijo, sin traer votos que nadie muestra.
 */
export async function getIncidentConfirmations(
  incidentId: string,
): Promise<IncidentConfirmationSummary> {
  const supabase = createPublicClient();
  const empty: IncidentConfirmationSummary = { confirm: 0, dispute: 0, resolved: 0 };
  if (!supabase) return empty;

  const types = ["confirm", "dispute", "resolved"] as const;

  const results = await Promise.all(
    types.map((type) =>
      supabase
        .from("incident_confirmations")
        .select("id", { count: "exact", head: true })
        .eq("incident_id", incidentId)
        .eq("confirmation_type", type),
    ),
  );

  const summary = { ...empty };

  results.forEach((result, index) => {
    if (result.error) {
      logDataError("getIncidentConfirmations", result.error);
      return;
    }
    summary[types[index]] = result.count ?? 0;
  });

  return summary;
}
