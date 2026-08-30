import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfigOrNull } from "@/lib/supabase/config";

/**
 * Refresco de la sesión de Supabase.
 *
 * Los Server Components no pueden escribir cookies, así que el token caducado
 * se renueva aquí, antes de que se rendericen. Sin esto, una sesión válida se
 * ve como anónima en cuanto expira el access token.
 *
 * El middleware NO decide permisos. La plataforma es pública de lectura y quien
 * autoriza cada escritura es RLS, en la base de datos. Bloquear rutas aquí daría
 * una falsa sensación de seguridad: la clave publishable llega igualmente al
 * navegador y el único límite real está en las políticas.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const config = getSupabaseConfigOrNull();

  // Sin configuración no hay sesión que refrescar. El sitio público sigue
  // funcionando con el dataset local en vez de devolver un 500.
  if (!config) return response;

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // `getUser()` valida el token contra el servidor de auth. `getSession()` sólo
  // lee la cookie, que el cliente puede manipular: no sirve para decidir nada.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Todo menos estáticos, imágenes y el favicon. Las rutas de metadatos
     * (sitemap, robots, opengraph-image) tampoco necesitan sesión.
     */
    "/((?!_next/static|_next/image|favicon.svg|robots.txt|sitemap.xml|opengraph-image|twitter-image|data/).*)",
  ],
};
