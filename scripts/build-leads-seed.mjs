/**
 * Genera la migración de semilla de `public.leads` a partir del dataset
 * canónico /data/leads.json.
 *
 * El SQL no se escribe a mano: transcribir 15 registros de 41 campos es una
 * fuente de erratas silenciosas. Tras editar el JSON:
 *
 *   npm run data:seed
 *
 * La migración resultante es idempotente (`on conflict do update`), así que
 * volver a aplicarla actualiza el dataset en vez de duplicarlo.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(root, "supabase/migrations/20260830090900_seed_leads.sql");

const dataset = JSON.parse(readFileSync(resolve(root, "data/leads.json"), "utf8"));

/** Literal de texto seguro: PostgreSQL escapa la comilla simple duplicándola. */
function text(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function num(value) {
  if (value === null || value === undefined) return "null";
  if (!Number.isFinite(value)) {
    throw new Error(`Valor numérico inválido: ${value}`);
  }
  return String(value);
}

function bool(value) {
  if (value === null || value === undefined) return "null";
  return value ? "true" : "false";
}

function textArray(values) {
  if (!values || values.length === 0) return "'{}'::text[]";
  const items = values.map((item) => text(item)).join(", ");
  return `array[${items}]::text[]`;
}

function jsonb(value) {
  return `${text(JSON.stringify(value ?? []))}::jsonb`;
}

const COLUMNS = [
  "business_id",
  "business_name",
  "niche",
  "subcategory",
  "commune",
  "address",
  "latitude",
  "longitude",
  "website_url",
  "has_website",
  "website_classification",
  "website_quality",
  "instagram_url",
  "facebook_url",
  "social_only_presence",
  "online_booking",
  "online_ordering",
  "online_menu",
  "online_catalog",
  "whatsapp_business",
  "public_business_email",
  "public_business_phone",
  "rating",
  "review_count",
  "social_activity",
  "multiple_locations",
  "business_age_signal",
  "digital_need_score",
  "commercial_attractiveness_score",
  "contactability_score",
  "landing_fit_score",
  "local_opportunity_score",
  "priority_score",
  "confidence_score",
  "priority_tier",
  "score_explanations",
  "data_flags",
  "source_primary",
  "source_urls",
  "retrieved_at",
  "evidence_notes",
  "demo_url",
];

function row(lead) {
  return [
    text(lead.business_id),
    text(lead.business_name),
    text(lead.niche),
    text(lead.subcategory),
    text(lead.commune),
    text(lead.address),
    num(lead.latitude),
    num(lead.longitude),
    text(lead.website_url),
    bool(lead.has_website),
    num(lead.website_classification),
    text(lead.website_quality),
    text(lead.instagram_url),
    text(lead.facebook_url),
    bool(lead.social_only_presence),
    bool(lead.online_booking),
    bool(lead.online_ordering),
    bool(lead.online_menu),
    bool(lead.online_catalog),
    text(lead.whatsapp_business),
    text(lead.public_business_email),
    text(lead.public_business_phone),
    num(lead.rating),
    num(lead.review_count),
    text(lead.social_activity),
    bool(lead.multiple_locations),
    text(lead.business_age_signal),
    num(lead.digital_need_score),
    num(lead.commercial_attractiveness_score),
    num(lead.contactability_score),
    num(lead.landing_fit_score),
    num(lead.local_opportunity_score),
    num(lead.priority_score),
    num(lead.confidence_score),
    text(lead.priority_tier),
    jsonb(lead.score_explanations),
    textArray(lead.data_flags),
    text(lead.source_primary),
    textArray(lead.source_urls),
    text(lead.retrieved_at),
    text(lead.evidence_notes),
    text(lead.demo_url ?? null),
  ].join(", ");
}

// Todas las columnas menos la clave primaria se refrescan al reaplicar.
const updates = COLUMNS.filter((column) => column !== "business_id")
  .map((column) => `    ${column} = excluded.${column}`)
  .join(",\n");

const header = `-- Semilla de public.leads — GENERADO, no editar a mano.
--
-- Origen: data/leads.json (${dataset.dataset} v${dataset.version})
-- Regenerar: npm run data:seed
--
-- ${dataset.leads.length} prospectos reales de ${dataset.region}. Los scores se
-- copian literalmente del documento canónico y no se recalculan aquí.
`;

const body = `insert into public.leads (
  ${COLUMNS.join(",\n  ")}
)
values
${dataset.leads.map((lead) => `  (${row(lead)})`).join(",\n")}
on conflict (business_id) do update
set
${updates};
`;

writeFileSync(OUTPUT, `${header}\n${body}`, "utf8");

console.log(
  `Semilla generada: ${dataset.leads.length} prospectos -> supabase/migrations/20260830090900_seed_leads.sql`,
);
