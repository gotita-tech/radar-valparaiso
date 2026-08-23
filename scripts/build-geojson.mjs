/**
 * Deriva /data/leads.geojson (y su copia servible en /public/data/leads.geojson)
 * a partir del dataset canónico /data/leads.json.
 *
 * No recalcula ningún score: sólo proyecta los campos ya validados del
 * documento canónico a una FeatureCollection WGS84 (EPSG:4326).
 *
 * Uso: npm run data:build
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const dataset = JSON.parse(readFileSync(resolve(root, "data/leads.json"), "utf8"));

const features = dataset.leads
  .filter((lead) => typeof lead.latitude === "number" && typeof lead.longitude === "number")
  .map((lead) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lead.longitude, lead.latitude],
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
  }));

const collection = {
  type: "FeatureCollection",
  name: "opportunity-radar-valparaiso",
  crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3/CRS84" } },
  metadata: {
    source_document: dataset.source_document,
    generated_from_document_at: dataset.generated_from_document_at,
    feature_count: features.length,
  },
  features,
};

const json = `${JSON.stringify(collection, null, 2)}\n`;

for (const target of ["data/leads.geojson", "public/data/leads.geojson"]) {
  const path = resolve(root, target);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, json, "utf8");
  console.log(`✓ ${target} — ${features.length} features`);
}
