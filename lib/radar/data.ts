import dataset from "@/data/leads.json";
import type {
  Filters,
  Lead,
  LeadDataset,
  LeadFeatureCollection,
  Niche,
  PriorityTier,
  SortKey,
  WebsiteClassification,
} from "./types";

const DATASET = dataset as unknown as LeadDataset;

export const LEADS: Lead[] = DATASET.leads;

export const DATASET_META = {
  region: DATASET.region,
  version: DATASET.version,
  sourceDocument: DATASET.source_document,
  sourceTables: DATASET.source_tables,
  notes: DATASET.notes,
  retrievedAt: DATASET.generated_from_document_at,
};

/** FeatureCollection equivalente a /data/leads.geojson, sin fetch ni red. */
export const FEATURE_COLLECTION: LeadFeatureCollection = {
  type: "FeatureCollection",
  name: DATASET.dataset,
  features: LEADS.filter(
    (lead) => lead.latitude !== null && lead.longitude !== null,
  ).map((lead) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lead.longitude as number, lead.latitude as number],
    },
    properties: {
      business_id: lead.business_id,
      business_name: lead.business_name,
      niche: lead.niche,
      commune: lead.commune,
      address: lead.address,
      priority_score: lead.priority_score,
      confidence_score: lead.confidence_score,
      priority_tier: lead.priority_tier,
      website_classification: lead.website_classification,
    },
  })),
};

export type Facets = {
  communes: string[];
  niches: Niche[];
  webClasses: WebsiteClassification[];
};

/**
 * Sólo las opciones realmente presentes en el conjunto que se pasa.
 *
 * Se calcula sobre los leads recibidos y no sobre el dataset local, porque
 * desde que el radar lee de Supabase el conjunto puede ser distinto: un filtro
 * que ofrece una comuna sin ningún negocio detrás es un filtro roto.
 */
export function computeFacets(leads: Lead[]): Facets {
  return {
    communes: [...new Set(leads.map((l) => l.commune))].sort((a, b) =>
      a.localeCompare(b, "es"),
    ),
    niches: [...new Set(leads.map((l) => l.niche))] as Niche[],
    webClasses: [...new Set(leads.map((l) => l.website_classification))].sort(
      (a, b) => a - b,
    ) as WebsiteClassification[],
  };
}

/** Facetas del dataset local. Las usa la landing, que no consulta Supabase. */
export const FACETS: Facets = computeFacets(LEADS);

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function applyFilters(leads: Lead[], filters: Filters): Lead[] {
  const query = normalize(filters.search.trim());

  return leads.filter((lead) => {
    if (filters.communes.length && !filters.communes.includes(lead.commune)) return false;
    if (filters.niches.length && !filters.niches.includes(lead.niche)) return false;
    if (
      filters.webClasses.length &&
      !filters.webClasses.includes(lead.website_classification)
    ) {
      return false;
    }
    if (lead.priority_score < filters.minScore) return false;
    if (filters.onlyContactable && !hasContactChannel(lead)) return false;
    if (query) {
      const haystack = normalize(
        [lead.business_name, lead.commune, lead.address ?? "", lead.subcategory ?? ""].join(" "),
      );
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function sortLeads(leads: Lead[], key: SortKey, direction: "asc" | "desc"): Lead[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...leads].sort((a, b) => {
    if (key === "business_name") {
      return a.business_name.localeCompare(b.business_name, "es") * factor;
    }
    const diff = (a[key] as number) - (b[key] as number);
    if (diff !== 0) return diff * factor;
    return a.business_name.localeCompare(b.business_name, "es");
  });
}

export function hasContactChannel(lead: Lead) {
  return Boolean(
    lead.whatsapp_business ||
      lead.public_business_phone ||
      lead.public_business_email ||
      lead.instagram_url,
  );
}

/** § "Puntos de Inserción para Revisión Humana" del reporte de calidad. */
export function needsHumanReview(lead: Lead): string | null {
  if (lead.priority_score >= 75 && lead.confidence_score < 65) {
    return "Priority ≥ 75 con Confidence < 65: validar los datos antes de contactar.";
  }
  if (lead.website_classification === 4 && (lead.review_count ?? 0) > 100) {
    return "Sin web detectada pero con más de 100 reseñas: descartar dominio no indexado o nombre comercial alternativo.";
  }
  return null;
}

export type Metrics = {
  total: number;
  veryHigh: number;
  high: number;
  withoutWebsite: number;
  avgPriority: number;
  avgConfidence: number;
  byNiche: { key: Niche; count: number; avgPriority: number }[];
  byCommune: { key: string; count: number; avgPriority: number }[];
  byTier: { key: PriorityTier; count: number }[];
};

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function computeMetrics(leads: Lead[]): Metrics {
  const groupBy = <K extends string>(keyOf: (lead: Lead) => K) => {
    const map = new Map<K, Lead[]>();
    for (const lead of leads) {
      const key = keyOf(lead);
      const bucket = map.get(key);
      if (bucket) bucket.push(lead);
      else map.set(key, [lead]);
    }
    return map;
  };

  const nicheMap = groupBy((l) => l.niche);
  const communeMap = groupBy((l) => l.commune);
  const tierMap = groupBy((l) => l.priority_tier);

  return {
    total: leads.length,
    veryHigh: leads.filter((l) => l.priority_tier === "VERY_HIGH").length,
    high: leads.filter((l) => l.priority_tier === "HIGH").length,
    withoutWebsite: leads.filter((l) => l.website_classification >= 3).length,
    avgPriority: mean(leads.map((l) => l.priority_score)),
    avgConfidence: mean(leads.map((l) => l.confidence_score)),
    byNiche: [...nicheMap.entries()]
      .map(([key, group]) => ({
        key,
        count: group.length,
        avgPriority: mean(group.map((l) => l.priority_score)),
      }))
      .sort((a, b) => b.count - a.count),
    byCommune: [...communeMap.entries()]
      .map(([key, group]) => ({
        key,
        count: group.length,
        avgPriority: mean(group.map((l) => l.priority_score)),
      }))
      .sort((a, b) => b.count - a.count),
    byTier: [...tierMap.entries()]
      .map(([key, group]) => ({ key, count: group.length }))
      .sort((a, b) => b.count - a.count),
  };
}

export function findLead(id: string | null) {
  if (!id) return null;
  return LEADS.find((lead) => lead.business_id === id) ?? null;
}
