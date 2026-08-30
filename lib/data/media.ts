import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import type { IncidentMedia } from "@/lib/incidents/types";
import { logDataError } from "./errors";

export const INCIDENT_MEDIA_BUCKET = "incident-media";

/** Vida de la URL firmada. Suficiente para pintar la ficha, no para repartirla. */
const SIGNED_URL_TTL_SECONDS = 60 * 10;

/**
 * Convención de rutas del bucket, en un solo sitio.
 *
 * Las políticas de Storage exigen que el primer segmento sea el uuid de quien
 * sube; la restricción `incident_media_path_is_owned` exige lo mismo en la
 * tabla. Construir la ruta a mano en dos lugares distintos es la forma más
 * rápida de que ambas dejen de coincidir.
 */
export function buildIncidentMediaPath(
  userId: string,
  incidentId: string,
  fileName: string,
): string {
  const extension = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase()
    : "jpg";

  const safeExtension = /^[a-z0-9]{2,5}$/.test(extension) ? extension : "jpg";

  return `${userId}/${incidentId}/${crypto.randomUUID()}.${safeExtension}`;
}

export type SignedMedia = IncidentMedia & { url: string | null };

/**
 * Archivos de un incidente, con URL firmada.
 *
 * El bucket es privado, así que no existe una URL pública permanente: cada
 * lectura firma un enlace de vida corta. Es lo que hace que retirar un
 * contenido moderado surta efecto de verdad.
 *
 * Todavía no hay interfaz de subida; esta función es el lado de lectura de una
 * infraestructura ya cerrada y lista para cuando la haya.
 */
export async function getIncidentMedia(incidentId: string): Promise<SignedMedia[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("incident_media")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });

  if (error) {
    logDataError("getIncidentMedia", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  const { data: signed, error: signError } = await supabase.storage
    .from(INCIDENT_MEDIA_BUCKET)
    .createSignedUrls(
      data.map((item) => item.storage_path),
      SIGNED_URL_TTL_SECONDS,
    );

  if (signError) {
    logDataError("getIncidentMedia:sign", signError);
    return data.map((item) => ({ ...item, url: null }));
  }

  const urlByPath = new Map(
    (signed ?? []).map((entry) => [entry.path, entry.signedUrl]),
  );

  return data.map((item) => ({
    ...item,
    url: urlByPath.get(item.storage_path) ?? null,
  }));
}
