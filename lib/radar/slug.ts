import { LEADS } from "./data";
import type { Lead } from "./types";

/** "Barbería León Barber" → "barberia-leon-barber" */
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Los slugs se derivan del nombre comercial. Si dos negocios colisionaran se
 * desempata con el business_id, que sí es único por definición del esquema.
 */
const bySlug = new Map<string, Lead>();
const slugById: Record<string, string> = {};

for (const lead of LEADS) {
  const base = slugify(lead.business_name);
  const slug = bySlug.has(base) ? `${base}-${lead.business_id}` : base;
  bySlug.set(slug, lead);
  slugById[lead.business_id] = slug;
}

export function slugForLead(lead: Lead) {
  return slugById[lead.business_id];
}

export function leadBySlug(slug: string): Lead | null {
  return bySlug.get(slug) ?? null;
}

export function allSlugs() {
  return [...bySlug.keys()];
}
