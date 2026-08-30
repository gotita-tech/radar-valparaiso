import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import type { IncidentCategory } from "@/lib/incidents/types";
import { logDataError } from "./errors";

export type CategoriesResult = {
  categories: IncidentCategory[];
  /** true = Supabase no respondió. La interfaz lo dice; no finge un catálogo vacío. */
  degraded: boolean;
};

/**
 * Catálogo de categorías activas.
 *
 * RLS ya filtra por `is_active`, pero el `.eq()` se deja explícito para que la
 * intención se lea en el código y no dependa sólo de una política remota.
 */
export async function getIncidentCategories(): Promise<CategoriesResult> {
  const supabase = createPublicClient();

  if (!supabase) {
    return { categories: [], degraded: true };
  }

  const { data, error } = await supabase
    .from("incident_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    logDataError("getIncidentCategories", error);
    return { categories: [], degraded: true };
  }

  return { categories: data ?? [], degraded: false };
}
