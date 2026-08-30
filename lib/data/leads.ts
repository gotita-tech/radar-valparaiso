import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import { LEADS as LOCAL_LEADS } from "@/lib/radar/data";
import type {
  Lead,
  Niche,
  PriorityTier,
  ScoreExplanation,
  WebsiteClassification,
} from "@/lib/radar/types";
import type { Tables } from "@/lib/supabase/database.types";
import { logDataError } from "./errors";

export type LeadsSource = "supabase" | "local";

export type LeadsResult = {
  leads: Lead[];
  source: LeadsSource;
};

/**
 * `data/leads.json` sigue en el repositorio a propósito.
 *
 * Es el documento de origen del dataset —la migración de semilla se genera
 * desde él con `npm run data:seed`— y además la red de seguridad del radar: si
 * Supabase no responde, el dashboard se dibuja igual con la última copia
 * versionada en vez de quedarse en blanco. La interfaz avisa de que está
 * mostrando la copia local.
 */
function isScoreExplanation(value: unknown): value is ScoreExplanation {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.dimension === "string" &&
    typeof entry.points === "number" &&
    typeof entry.label === "string"
  );
}

function toScoreExplanations(value: Tables<"leads">["score_explanations"]): ScoreExplanation[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isScoreExplanation);
}

/**
 * Fila de Postgres a `Lead`.
 *
 * Los nombres coinciden uno a uno; lo único que hay que estrechar son los tipos
 * que en la base son `text`/`smallint` abiertos y en la aplicación son uniones.
 * Las restricciones `check` de la migración garantizan que el valor pertenece a
 * la unión, así que la conversión es segura.
 */
function toLead(row: Tables<"leads">): Lead {
  return {
    business_id: row.business_id,
    business_name: row.business_name,
    niche: row.niche as Niche,
    subcategory: row.subcategory,
    commune: row.commune,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,

    website_url: row.website_url,
    has_website: row.has_website,
    website_classification: row.website_classification as WebsiteClassification,
    website_quality: row.website_quality,
    instagram_url: row.instagram_url,
    facebook_url: row.facebook_url,
    social_only_presence: row.social_only_presence,
    online_booking: row.online_booking,
    online_ordering: row.online_ordering,
    online_menu: row.online_menu,
    online_catalog: row.online_catalog,
    whatsapp_business: row.whatsapp_business,
    public_business_email: row.public_business_email,
    public_business_phone: row.public_business_phone,

    rating: row.rating,
    review_count: row.review_count,
    social_activity: row.social_activity,
    multiple_locations: row.multiple_locations,
    business_age_signal: row.business_age_signal,

    digital_need_score: row.digital_need_score,
    commercial_attractiveness_score: row.commercial_attractiveness_score,
    contactability_score: row.contactability_score,
    landing_fit_score: row.landing_fit_score,
    local_opportunity_score: row.local_opportunity_score,
    priority_score: row.priority_score,
    confidence_score: row.confidence_score,
    priority_tier: row.priority_tier as PriorityTier,

    score_explanations: toScoreExplanations(row.score_explanations),
    data_flags: row.data_flags.length
      ? (row.data_flags as Lead["data_flags"])
      : undefined,
    source_primary: row.source_primary,
    source_urls: row.source_urls,
    retrieved_at: row.retrieved_at,
    evidence_notes: row.evidence_notes,
    demo_url: row.demo_url,
    scoring_source:
      row.scoring_source === "engine" ? "engine" : "document",
  };
}

/**
 * Prospectos del Opportunity Radar.
 *
 * Nunca lanza: un radar que no dibuja nada porque la base de datos tardó es
 * peor que un radar que dibuja la copia versionada y lo dice.
 */
export async function getLeads(): Promise<LeadsResult> {
  const supabase = createPublicClient();

  if (!supabase) {
    return { leads: LOCAL_LEADS, source: "local" };
  }

  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("priority_score", { ascending: false });

    if (error) {
      logDataError("getLeads", error);
      return { leads: LOCAL_LEADS, source: "local" };
    }

    // Una tabla vacía significa que la semilla todavía no se ha aplicado, no
    // que no haya prospectos. Con cero filas el radar no tendría nada que
    // mostrar, así que se prefiere la copia local.
    if (!data || data.length === 0) {
      return { leads: LOCAL_LEADS, source: "local" };
    }

    return { leads: data.map(toLead), source: "supabase" };
  } catch (error) {
    logDataError("getLeads", error);
    return { leads: LOCAL_LEADS, source: "local" };
  }
}

export async function getLeadById(businessId: string): Promise<Lead | null> {
  const supabase = createPublicClient();

  if (!supabase) {
    return LOCAL_LEADS.find((lead) => lead.business_id === businessId) ?? null;
  }

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    logDataError("getLeadById", error);
    return LOCAL_LEADS.find((lead) => lead.business_id === businessId) ?? null;
  }

  return data ? toLead(data) : null;
}
