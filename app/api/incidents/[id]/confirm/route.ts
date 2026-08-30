import { createClient } from "@/lib/supabase/server";
import { logDataError, USER_FACING_ERRORS } from "@/lib/data/errors";
import type { ConfirmationType } from "@/lib/incidents/types";

const noStore = { "Cache-Control": "no-store, max-age=0" };

const TYPES: ConfirmationType[] = ["confirm", "dispute", "resolved"];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Context = { params: Promise<{ id: string }> };

/**
 * Confirmar, discutir o dar por resuelto un incidente.
 *
 * Un voto por persona: el `upsert` sobre la clave única (incident_id, user_id)
 * convierte "votar otra vez" en "cambiar de opinión" en vez de en un duplicado
 * o un error.
 */
export async function POST(request: Request, context: Context) {
  const { id } = await context.params;

  if (!UUID_PATTERN.test(id)) {
    return Response.json(
      { ok: false, error: USER_FACING_ERRORS.invalid },
      { status: 400, headers: noStore },
    );
  }

  let confirmationType: ConfirmationType = "confirm";

  try {
    const body: unknown = await request.json();
    const candidate =
      body && typeof body === "object"
        ? (body as Record<string, unknown>).confirmation_type
        : undefined;

    if (typeof candidate === "string") {
      if (!TYPES.includes(candidate as ConfirmationType)) {
        return Response.json(
          { ok: false, error: USER_FACING_ERRORS.invalid },
          { status: 422, headers: noStore },
        );
      }
      confirmationType = candidate as ConfirmationType;
    }
  } catch {
    // Sin cuerpo: se asume "confirm", que es el gesto habitual.
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { ok: false, error: USER_FACING_ERRORS.unauthenticated },
      { status: 401, headers: noStore },
    );
  }

  const { error } = await supabase.from("incident_confirmations").upsert(
    {
      incident_id: id,
      user_id: user.id,
      confirmation_type: confirmationType,
    },
    { onConflict: "incident_id,user_id" },
  );

  if (error) {
    logDataError("POST /api/incidents/[id]/confirm", error);
    const status = error.code === "42501" ? 403 : 400;
    return Response.json(
      {
        ok: false,
        error: status === 403 ? USER_FACING_ERRORS.forbidden : USER_FACING_ERRORS.unexpected,
      },
      { status, headers: noStore },
    );
  }

  // El recuento lo mantiene un trigger, así que se relee en vez de calcularse
  // aquí: es el único número que no puede quedar desincronizado.
  const { data: incident } = await supabase
    .from("incidents")
    .select("verification_count, is_verified")
    .eq("id", id)
    .maybeSingle();

  return Response.json(
    {
      ok: true,
      confirmation_type: confirmationType,
      verification_count: incident?.verification_count ?? null,
      is_verified: incident?.is_verified ?? null,
    },
    { headers: noStore },
  );
}

/** Retirar el propio voto. */
export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;

  if (!UUID_PATTERN.test(id)) {
    return Response.json(
      { ok: false, error: USER_FACING_ERRORS.invalid },
      { status: 400, headers: noStore },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { ok: false, error: USER_FACING_ERRORS.unauthenticated },
      { status: 401, headers: noStore },
    );
  }

  const { error } = await supabase
    .from("incident_confirmations")
    .delete()
    .eq("incident_id", id)
    .eq("user_id", user.id);

  if (error) {
    logDataError("DELETE /api/incidents/[id]/confirm", error);
    return Response.json(
      { ok: false, error: USER_FACING_ERRORS.unexpected },
      { status: 400, headers: noStore },
    );
  }

  return Response.json({ ok: true }, { headers: noStore });
}
