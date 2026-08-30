import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabaseConfig } from "./config";

/**
 * Cliente de navegador, con sesión.
 *
 * Para lo que ocurre después de un gesto del usuario: crear un incidente,
 * confirmarlo, comentar, iniciar o cerrar sesión. Todo lo que sea sólo lectura
 * y pueda resolverse en el servidor debería resolverse allí.
 */
export function createClient() {
  const { url, publishableKey } = getSupabaseConfig();

  return createBrowserClient<Database>(url, publishableKey);
}
