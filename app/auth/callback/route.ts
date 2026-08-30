import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logDataError } from "@/lib/data/errors";

/**
 * Retorno del magic link y de la confirmación de correo.
 *
 * Supabase envía aquí un `code` de un solo uso que se canjea por una sesión.
 * El canje ocurre en el servidor y la cookie se escribe desde una Route
 * Handler, que sí puede hacerlo.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  // Sólo rutas internas: aceptar un `next` absoluto convertiría este endpoint
  // en un redirector abierto y en una forma cómoda de robar el código.
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/incidentes";

  if (!code) {
    return NextResponse.redirect(new URL("/acceso?error=missing_code", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logDataError("auth/callback", error);
    return NextResponse.redirect(new URL("/acceso?error=exchange_failed", url.origin));
  }

  return NextResponse.redirect(new URL(destination, url.origin));
}
