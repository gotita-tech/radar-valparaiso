/**
 * Rellena latitud y longitud de los registros de `data/intake/` que no las
 * tengan, usando Nominatim (OpenStreetMap).
 *
 *   npm run data:geocode
 *
 * Nominatim es gratuito y sin clave, coherente con la regla del proyecto de no
 * añadir servicios de pago. Su política de uso exige un User-Agent que
 * identifique la aplicación y **como máximo una consulta por segundo**: ambas
 * cosas se respetan abajo. No lo conviertas en un bucle masivo.
 *
 * Lo que no encuentra se queda en `null`. Un lead sin coordenadas sigue siendo
 * válido: no sale en el mapa y su brecha competitiva no se calcula, pero no se
 * inventa una ubicación.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INTAKE_DIR = resolve(root, "data/intake");

const USER_AGENT =
  "radar-valparaiso/1.0 (https://github.com/gotita-tech/radar-valparaiso)";
const RATE_LIMIT_MS = 1100;

/** Recuadro de la Región de Valparaíso, para descartar aciertos absurdos. */
const BOUNDS = { minLat: -34.0, maxLat: -31.5, minLon: -72.5, maxLon: -69.9 };

/**
 * Nominatim indexa portales, no unidades interiores. Un "local 87" o un
 * "Departamento 47" hacen fallar la consulta entera, así que se prueba primero
 * la dirección tal cual y después sin el sufijo de unidad.
 *
 * La dirección del dataset no se toca: esto sólo afecta a lo que se consulta.
 */
function addressVariants(address) {
  const stripped = address
    .replace(/,?\s*(local|locales|depto\.?|departamento|oficina|of\.?|piso)\s*[\w-]+/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*$/, "")
    .trim();

  return stripped && stripped !== address ? [address, stripped] : [address];
}

async function geocodeOnce(address, commune) {
  const query = `${address}, ${commune}, Región de Valparaíso, Chile`;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "cl");

  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

  if (!response.ok) {
    console.warn(`  HTTP ${response.status} para "${query}"`);
    return null;
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) return null;

  const latitude = Number(results[0].lat);
  const longitude = Number(results[0].lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  if (
    latitude < BOUNDS.minLat ||
    latitude > BOUNDS.maxLat ||
    longitude < BOUNDS.minLon ||
    longitude > BOUNDS.maxLon
  ) {
    console.warn(`  Fuera de la región, descartado: "${query}" -> ${latitude}, ${longitude}`);
    return null;
  }

  return { latitude, longitude };
}

async function geocode(address, commune) {
  for (const variant of addressVariants(address)) {
    const point = await geocodeOnce(variant, commune);
    await sleep(RATE_LIMIT_MS);
    if (point) return point;
  }
  return null;
}

let resolved = 0;
let missing = 0;

for (const file of readdirSync(INTAKE_DIR).filter((name) => name.endsWith(".json"))) {
  const path = join(INTAKE_DIR, file);
  const leads = JSON.parse(readFileSync(path, "utf8"));
  let touched = false;

  for (const lead of leads) {
    if (lead.latitude !== null && lead.longitude !== null) continue;
    if (!lead.address) {
      missing += 1;
      continue;
    }

    const point = await geocode(lead.address, lead.commune);

    if (!point) {
      console.log(`  sin resultado · ${lead.business_name} (${lead.address})`);
      missing += 1;
      continue;
    }

    lead.latitude = Number(point.latitude.toFixed(5));
    lead.longitude = Number(point.longitude.toFixed(5));

    // La procedencia de la coordenada se declara como cualquier otro dato.
    if (!lead.source_urls.includes("https://nominatim.openstreetmap.org/")) {
      lead.source_urls.push("https://nominatim.openstreetmap.org/");
    }

    touched = true;
    resolved += 1;
    console.log(`  ${lead.business_name} -> ${lead.latitude}, ${lead.longitude}`);
  }

  if (touched) {
    writeFileSync(path, `${JSON.stringify(leads, null, 2)}\n`, "utf8");
  }
}

console.log(`\nGeocodificados ${resolved}. Sin coordenadas: ${missing}.`);
