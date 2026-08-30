/**
 * Lectura de la configuración de Supabase.
 *
 * Las dos variables son `NEXT_PUBLIC_*` y eso es correcto: la URL del proyecto
 * y la clave publishable están pensadas para viajar al navegador. La seguridad
 * no la da ocultarlas, la da RLS. Ninguna clave con privilegios —service_role,
 * access token, contraseña de base de datos— entra en este archivo ni en
 * ninguna variable `NEXT_PUBLIC_*`.
 *
 * Next.js sustituye `process.env.NEXT_PUBLIC_X` en tiempo de compilación sólo
 * cuando se escribe con el nombre literal, así que no se accede por índice.
 */

export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

function readConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return null;

  return { url, publishableKey };
}

/**
 * Configuración o error.
 *
 * Para los caminos que no tienen nada que hacer sin Supabase: crear un
 * incidente, iniciar sesión, el health check.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const config = readConfig();

  if (!config) {
    throw new Error("Supabase environment variables are not configured");
  }

  return config;
}

/**
 * Configuración o `null`, sin lanzar.
 *
 * Para los caminos que sí tienen una alternativa: el Opportunity Radar cae al
 * dataset local si la base de datos no está disponible, en vez de romper la
 * página entera.
 */
export function getSupabaseConfigOrNull(): SupabaseConfig | null {
  return readConfig();
}

export function isSupabaseConfigured(): boolean {
  return readConfig() !== null;
}
