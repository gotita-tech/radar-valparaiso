/**
 * Incorpora observaciones nuevas al dataset.
 *
 *   npm run data:ingest
 *
 * Lee todos los `data/intake/*.json`, los valida, los puntúa con el motor y los
 * fusiona en `data/leads.json`.
 *
 * Reglas que el script hace cumplir:
 *
 * 1. **Los registros existentes con scores del documento no se tocan.** Si un
 *    intake trae un `business_id` que ya existe y está marcado como `document`,
 *    se rechaza. El documento canónico manda sobre esos 15.
 * 2. **No se inventa nada.** Los campos sin comprobar van a `null` y el
 *    Confidence Score los penaliza. Es preferible un registro honesto con
 *    confianza 45 que uno inventado con confianza 90.
 * 3. **El scoring necesita el conjunto entero.** El percentil de reseñas y la
 *    brecha competitiva se calculan contra todo el dataset, existentes
 *    incluidos, no sólo contra el lote entrante.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scoreDataset, type LeadAudit, type LeadObservation } from "../lib/radar/scoring.ts";
import type { Lead, LeadDataset } from "../lib/radar/types.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATASET_PATH = resolve(root, "data/leads.json");
const INTAKE_DIR = resolve(root, "data/intake");

const dataset = JSON.parse(readFileSync(DATASET_PATH, "utf8")) as LeadDataset;

const existing = new Map(dataset.leads.map((lead) => [lead.business_id, lead]));

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------

const REQUIRED: string[] = [
  "business_id",
  "business_name",
  "niche",
  "commune",
  "website_classification",
  "source_primary",
  "source_urls",
  "retrieved_at",
];

const NICHES = new Set(["restaurant", "bar", "barbershop", "boutique"]);

const problems: string[] = [];

function validate(entry: Record<string, unknown>, origin: string): boolean {
  const id = String(entry.business_id ?? "(sin id)");
  let ok = true;

  const fail = (message: string) => {
    problems.push(`${origin} · ${id}: ${message}`);
    ok = false;
  };

  for (const field of REQUIRED) {
    const value = entry[field];
    if (value === undefined || value === null || value === "") {
      fail(`falta el campo obligatorio "${field}"`);
    }
  }

  if (typeof entry.business_id === "string" && !/^[a-z0-9_-]{2,32}$/.test(entry.business_id)) {
    fail("business_id debe ser [a-z0-9_-], 2 a 32 caracteres");
  }

  if (typeof entry.niche === "string" && !NICHES.has(entry.niche)) {
    fail(`nicho desconocido: "${entry.niche}"`);
  }

  const webClass = entry.website_classification;
  if (typeof webClass !== "number" || webClass < 0 || webClass > 4) {
    fail("website_classification debe ser un entero de 0 a 4");
  }

  // Coherencia: las categorías 3 y 4 significan que no hay sitio propio.
  if (typeof webClass === "number") {
    const shouldHaveSite = webClass <= 2;
    if (shouldHaveSite && !entry.website_url) {
      fail(`website_classification ${webClass} exige website_url`);
    }
    if (!shouldHaveSite && entry.website_url) {
      fail(`website_classification ${webClass} no admite website_url`);
    }
  }

  if (!Array.isArray(entry.source_urls) || entry.source_urls.length === 0) {
    fail("source_urls no puede estar vacío: todo dato necesita procedencia");
  }

  if (!entry.audit || typeof entry.audit !== "object") {
    fail("falta el bloque audit");
  }

  const previous = existing.get(id);
  if (previous && (previous.scoring_source ?? "document") === "document") {
    fail("ya existe con scores del documento canónico; el motor no lo recalcula");
  }

  const lat = entry.latitude;
  const lon = entry.longitude;
  if (typeof lat === "number" && (lat < -34 || lat > -31.5)) {
    fail(`latitud fuera de la Región de Valparaíso: ${lat}`);
  }
  if (typeof lon === "number" && (lon < -72.5 || lon > -69.9)) {
    fail(`longitud fuera de la Región de Valparaíso: ${lon}`);
  }

  return ok;
}

// ---------------------------------------------------------------------------
// Carga del intake
// ---------------------------------------------------------------------------

if (!existsSync(INTAKE_DIR)) {
  console.log("No hay data/intake/. Nada que incorporar.");
  process.exit(0);
}

const files = readdirSync(INTAKE_DIR).filter((name) => name.endsWith(".json"));

if (files.length === 0) {
  console.log("data/intake/ está vacío. Nada que incorporar.");
  process.exit(0);
}

const incoming: LeadObservation[] = [];
const seen = new Set<string>();

for (const file of files) {
  const raw: unknown = JSON.parse(readFileSync(join(INTAKE_DIR, file), "utf8"));
  const entries = Array.isArray(raw) ? raw : [raw];

  for (const entry of entries as Record<string, unknown>[]) {
    const id = String(entry.business_id ?? "");

    if (seen.has(id)) {
      problems.push(`${file} · ${id}: duplicado dentro del propio intake`);
      continue;
    }
    seen.add(id);

    if (validate(entry, file)) {
      incoming.push(entry as unknown as LeadObservation);
    }
  }
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problema(s). No se escribió nada:\n`);
  for (const problem of problems) console.error(`  · ${problem}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Scoring sobre el conjunto completo
// ---------------------------------------------------------------------------

/** Los existentes entran como contexto (cohorte y vecindad), no para repuntuarse. */
const NEUTRAL_AUDIT: LeadAudit = {
  mobile_friendly: null,
  https: null,
  essential_info_easy: null,
  social_recency: "unknown",
  physical_location_verified: null,
  established_over_2_years: null,
  independent_sources: 1,
  verified_at: new Date().toISOString(),
  cross_source_match: "unknown",
};

function asContext(lead: Lead): LeadObservation {
  const {
    digital_need_score: _a,
    commercial_attractiveness_score: _b,
    contactability_score: _c,
    landing_fit_score: _d,
    local_opportunity_score: _e,
    priority_score: _f,
    confidence_score: _g,
    priority_tier: _h,
    score_explanations: _i,
    ...facts
  } = lead;
  return { ...facts, audit: NEUTRAL_AUDIT };
}

const incomingIds = new Set(incoming.map((lead) => lead.business_id));

// Un id reenviado entra una sola vez, con los datos nuevos: contarlo dos veces
// falsearía su propia cohorte y su vecindad.
const context = dataset.leads
  .filter((lead) => !incomingIds.has(lead.business_id))
  .map(asContext);

const scored = scoreDataset([...context, ...incoming]);
const scoredById = new Map(scored.map((lead) => [lead.business_id, lead]));

const added: Lead[] = [];
for (const id of incomingIds) {
  const lead = scoredById.get(id);
  if (!lead) throw new Error(`El motor no devolvió ${id}`);
  added.push({ ...lead, scoring_source: "engine" });
}

added.sort((a, b) => a.business_id.localeCompare(b.business_id));

/*
 * Los existentes conservan intactos sus valores; los del documento porque la
 * validación ya impidió reenviarlos, y el resto porque nadie los ha reenviado.
 *
 * Un id que sí viene en el intake se reemplaza, no se añade: reingerir un
 * registro es corregirlo. Sin este filtro, corregir un dato lo duplicaría.
 */
const merged: Lead[] = [
  ...dataset.leads
    .filter((lead) => !incomingIds.has(lead.business_id))
    .map((lead) => ({
      ...lead,
      scoring_source: lead.scoring_source ?? ("document" as const),
    })),
  ...added,
];

merged.sort((a, b) => a.business_id.localeCompare(b.business_id));

const output: LeadDataset = {
  ...dataset,
  leads: merged,
  notes: `${dataset.leads.length} registros del documento canónico (scores sin recalcular) y ${added.length} incorporados con el motor de scoring desde hechos observables. Los campos sin verificar quedan en null y bajan el Confidence Score.`,
};

writeFileSync(DATASET_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`Incorporados ${added.length} prospectos. Dataset: ${merged.length} registros.\n`);
console.table(
  added.map((lead) => ({
    id: lead.business_id,
    nombre: lead.business_name.slice(0, 28),
    comuna: lead.commune,
    web: lead.website_classification,
    priority: lead.priority_score,
    tier: lead.priority_tier,
    conf: lead.confidence_score,
  })),
);
console.log("\nAhora: npm run data:build && npm run data:seed");
