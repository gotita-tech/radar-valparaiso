/**
 * Validación de un reporte, compartida por el formulario y la ruta de API.
 *
 * El mismo módulo corre en los dos lados a propósito: el navegador da respuesta
 * inmediata y el servidor vuelve a comprobarlo todo, porque cualquiera puede
 * saltarse el formulario y hacer POST a mano. Los `check` de la migración son
 * la tercera y última red.
 *
 * Sin dependencias: el proyecto no lleva librería de validación y no vale la
 * pena añadir uno por ocho campos.
 */
import { INCIDENT_SEVERITIES, type IncidentDraft, type IncidentSeverity } from "./types";

/**
 * Recuadro generoso alrededor de la Región de Valparaíso.
 *
 * No pretende ser el límite administrativo exacto: sólo descarta coordenadas
 * que no pueden corresponder a un incidente de esta región (un 0,0 por defecto,
 * una latitud y longitud intercambiadas).
 */
export const REGION_BOUNDS = {
  minLat: -34.0,
  maxLat: -31.5,
  minLon: -72.5,
  maxLon: -69.9,
} as const;

export const TITLE_MIN = 4;
export const TITLE_MAX = 140;
export const DESCRIPTION_MAX = 2000;

export type ValidationResult =
  | { ok: true; value: IncidentDraft }
  | { ok: false; errors: Record<string, string> };

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown, max: number): string | null {
  const text = cleanText(value);
  if (!text) return null;
  return text.slice(0, max);
}

function isSeverity(value: unknown): value is IncidentSeverity {
  return typeof value === "string" && (INCIDENT_SEVERITIES as string[]).includes(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Valida una entrada de origen desconocido (un body JSON, el estado de un
 * formulario) y devuelve un borrador ya normalizado o los errores por campo.
 */
export function validateIncidentDraft(
  input: unknown,
  knownCategorySlugs?: readonly string[],
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== "object") {
    return { ok: false, errors: { form: "No se recibió ningún dato." } };
  }

  const raw = input as Record<string, unknown>;

  const categorySlug = cleanText(raw.category_slug);
  if (!categorySlug) {
    errors.category_slug = "Elige una categoría.";
  } else if (knownCategorySlugs && !knownCategorySlugs.includes(categorySlug)) {
    errors.category_slug = "Esa categoría no existe.";
  }

  const title = cleanText(raw.title);
  if (title.length < TITLE_MIN) {
    errors.title = `El título necesita al menos ${TITLE_MIN} caracteres.`;
  } else if (title.length > TITLE_MAX) {
    errors.title = `El título no puede pasar de ${TITLE_MAX} caracteres.`;
  }

  const description = cleanText(raw.description);
  if (description.length > DESCRIPTION_MAX) {
    errors.description = `La descripción no puede pasar de ${DESCRIPTION_MAX} caracteres.`;
  }

  const severity = raw.severity ?? "medium";
  if (!isSeverity(severity)) {
    errors.severity = "Nivel de gravedad no reconocido.";
  }

  const latitude = toNumber(raw.latitude);
  const longitude = toNumber(raw.longitude);

  if (latitude === null || longitude === null) {
    errors.location = "Marca la ubicación en el mapa.";
  } else if (
    latitude < REGION_BOUNDS.minLat ||
    latitude > REGION_BOUNDS.maxLat ||
    longitude < REGION_BOUNDS.minLon ||
    longitude > REGION_BOUNDS.maxLon
  ) {
    errors.location = "La ubicación queda fuera de la Región de Valparaíso.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      category_slug: categorySlug,
      title,
      description: description || null,
      severity: severity as IncidentSeverity,
      latitude: latitude as number,
      longitude: longitude as number,
      address: optionalText(raw.address, 200),
      commune: optionalText(raw.commune, 80),
    },
  };
}
