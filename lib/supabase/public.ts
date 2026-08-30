import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseConfigOrNull } from "./config";

/**
 * Cliente de lectura pública, sin cookies y sin sesión.
 *
 * `lib/supabase/server.ts` lee cookies con `next/headers`, y eso convierte en
 * dinámica cualquier ruta que lo use. Las páginas que sólo muestran datos
 * públicos —el radar, el listado de incidentes— no necesitan sesión, así que
 * usan este cliente y conservan el renderizado estático con revalidación.
 *
 * Actúa siempre como `anon`: ve exactamente lo mismo que un visitante y por
 * tanto está sujeto a RLS igual que él.
 */
export function createPublicClient() {
  const config = getSupabaseConfigOrNull();
  if (!config) return null;

  return createSupabaseClient<Database>(config.url, config.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
