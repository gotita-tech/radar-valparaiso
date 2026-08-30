import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabaseConfig } from "./config";

/**
 * Cliente de servidor con la sesión del visitante.
 *
 * Leer cookies convierte la ruta en dinámica. Para datos públicos que no
 * dependen de quién mira, usa `createPublicClient()` de `./public` y conserva
 * el renderizado estático.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Los Server Components no pueden escribir cookies. El middleware de
          // `middleware.ts` refresca la sesión antes de que se rendericen, así
          // que aquí no hay nada que recuperar.
        }
      },
    },
  });
}
