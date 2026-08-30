import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getIncidents } from "@/lib/data/incidents";
import { logDataError, USER_FACING_ERRORS } from "@/lib/data/errors";
import { validateIncidentDraft } from "@/lib/incidents/validation";
import type { IncidentStatus } from "@/lib/incidents/types";

const noStore = { "Cache-Control": "no-store, max-age=0" };

const STATUSES: IncidentStatus[] = [
  "reported",
  "under_review",
  "verified",
  "resolved",
  "rejected",
];

function parseStatus(value: string | null): IncidentStatus | null {
  if (!value) return null;
  return STATUSES.includes(value as IncidentStatus) ? (value as IncidentStatus) : null;
}

/**
 * Listado público de incidentes.
 *
 * Existe para el refresco del cliente y para consumidores externos. Las páginas
 * del servidor llaman a `getIncidents()` directamente y se ahorran el salto HTTP.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit"));

  const { incidents, degraded } = await getIncidents({
    limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined,
    categorySlug: url.searchParams.get("category"),
    status: parseStatus(url.searchParams.get("status")),
  });

  if (degraded) {
    return Response.json(
      { ok: false, error: USER_FACING_ERRORS.unavailable },
      { status: 503, headers: noStore },
    );
  }

  return Response.json({ ok: true, incidents }, { headers: noStore });
}

/**
 * Alta de un incidente.
 *
 * Requiere sesión. La inserción viaja con el JWT del visitante, así que quien
 * decide en última instancia es RLS: esta ruta no tiene privilegios especiales
 * y no puede saltarse ninguna política.
 */
export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: USER_FACING_ERRORS.invalid },
      { status: 400, headers: noStore },
    );
  }

  const reader = createPublicClient();
  if (!reader) {
    return Response.json(
      { ok: false, error: USER_FACING_ERRORS.unavailable },
      { status: 503, headers: noStore },
    );
  }

  const { data: categories, error: categoriesError } = await reader
    .from("incident_categories")
    .select("id, slug")
    .eq("is_active", true);

  if (categoriesError || !categories) {
    logDataError("POST /api/incidents:categories", categoriesError);
    return Response.json(
      { ok: false, error: USER_FACING_ERRORS.unavailable },
      { status: 503, headers: noStore },
    );
  }

  // Se valida contra el catálogo real: no basta con que el slug tenga forma
  // correcta, tiene que existir y estar activo.
  const validation = validateIncidentDraft(
    payload,
    categories.map((category) => category.slug),
  );

  if (!validation.ok) {
    return Response.json(
      { ok: false, error: USER_FACING_ERRORS.invalid, fields: validation.errors },
      { status: 422, headers: noStore },
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

  const category = categories.find(
    (item) => item.slug === validation.value.category_slug,
  );

  if (!category) {
    return Response.json(
      { ok: false, error: USER_FACING_ERRORS.invalid },
      { status: 422, headers: noStore },
    );
  }

  const draft = validation.value;

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      category_id: category.id,
      title: draft.title,
      description: draft.description,
      severity: draft.severity,
      latitude: draft.latitude,
      longitude: draft.longitude,
      address: draft.address,
      commune: draft.commune,
      source_url: null,
      // El trigger `incidents_enforce_authorship` lo reescribe con auth.uid();
      // se manda para que la política WITH CHECK lo vea coherente.
      reported_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    logDataError("POST /api/incidents", error);

    // 42501 = insufficient_privilege: la fila la rechazó RLS.
    const status = error.code === "42501" ? 403 : 400;
    return Response.json(
      {
        ok: false,
        error: status === 403 ? USER_FACING_ERRORS.forbidden : USER_FACING_ERRORS.unexpected,
      },
      { status, headers: noStore },
    );
  }

  return Response.json({ ok: true, id: data.id }, { status: 201, headers: noStore });
}
