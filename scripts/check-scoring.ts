/**
 * Contraste del motor de scoring contra el documento canónico.
 *
 *   npm run data:check
 *
 * Puntúa los 15 registros originales con el motor y compara con los valores que
 * el documento asignó a mano. No es un test de igualdad: el documento aplicó
 * criterio humano en señales que el dataset no guarda (responsive, HTTPS,
 * antigüedad, actividad social), y aquí esas señales entran como "no
 * comprobado", que nunca suma. Por eso el motor debe quedar **por debajo** del
 * documento, no clavarlo.
 *
 * Lo que sí sería un fallo: que el motor puntúe por encima, o que se desvíe
 * tanto que reordene el ranking comercial.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { scoreDataset, type LeadAudit, type LeadObservation } from "../lib/radar/scoring.ts";
import type { Lead, LeadDataset } from "../lib/radar/types.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(
  readFileSync(resolve(root, "data/leads.json"), "utf8"),
) as LeadDataset;

/** Todo sin comprobar. Es el caso honesto para datos que no auditamos. */
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

function toObservation(lead: Lead): LeadObservation {
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

  // El documento sí registró actividad social y sucursales: se aprovechan.
  const audit: LeadAudit = {
    ...NEUTRAL_AUDIT,
    social_recency:
      lead.social_activity === "high"
        ? "last_7_days"
        : lead.social_activity === "medium"
          ? "last_30_days"
          : lead.social_activity
            ? "inactive"
            : "unknown",
  };

  return { ...facts, audit };
}

const scored = scoreDataset(dataset.leads.map(toObservation));
const byId = new Map(scored.map((lead) => [lead.business_id, lead]));

let overshoot = 0;
let totalDelta = 0;

const rows = dataset.leads.map((original) => {
  const engine = byId.get(original.business_id);
  if (!engine) throw new Error(`Sin resultado del motor para ${original.business_id}`);

  const delta = engine.priority_score - original.priority_score;
  if (delta > 0) overshoot += 1;
  totalDelta += Math.abs(delta);

  return {
    id: original.business_id,
    nombre: original.business_name.slice(0, 24),
    doc: original.priority_score,
    motor: engine.priority_score,
    delta,
    tierDoc: original.priority_tier,
    tierMotor: engine.priority_tier,
  };
});

console.table(rows);

// ¿Conserva el orden comercial? Es lo que de verdad importa para prospectar.
const orderDoc = [...dataset.leads]
  .sort((a, b) => b.priority_score - a.priority_score)
  .map((lead) => lead.business_id);
const orderEngine = [...scored]
  .sort((a, b) => b.priority_score - a.priority_score)
  .map((lead) => lead.business_id);

const top5Doc = new Set(orderDoc.slice(0, 5));
const top5Engine = orderEngine.slice(0, 5);
const top5Overlap = top5Engine.filter((id) => top5Doc.has(id)).length;

console.log(`\nDesviación media: ${(totalDelta / rows.length).toFixed(1)} puntos`);
console.log(`Registros por encima del documento: ${overshoot} (deberían ser 0)`);
console.log(`Coincidencia del top 5: ${top5Overlap}/5`);

if (overshoot > 0) {
  console.error(
    "\nEl motor puntúa por encima del documento en algún registro. Revisa la rúbrica.",
  );
  process.exit(1);
}
