import type { Metadata } from "next";
import IncidentRadar from "@/components/incidents/IncidentRadar";
import { getIncidentCategories } from "@/lib/data/categories";
import { getIncidents } from "@/lib/data/incidents";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SITE_URL } from "@/lib/site-config";

const title = "Radar ciudadano — Región de Valparaíso";
const description =
  "Mapa en tiempo real de incidentes reportados por la comunidad en la Región de Valparaíso: accidentes, cortes de servicio, emergencias y vías cortadas, con confirmación ciudadana.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/incidentes` },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: `${SITE_URL}/incidentes`,
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * Se renderiza en cada visita: el contenido cambia con cada reporte y además
 * depende de si quien mira tiene sesión. Cachearlo mostraría incidentes viejos,
 * que es justo lo que un radar no puede hacer.
 */
export const dynamic = "force-dynamic";

async function getViewer() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    // Sin sesión válida la página sigue siendo pública: sólo desaparecen los
    // botones que escriben.
    return null;
  }
}

export default async function IncidentesPage() {
  const [{ incidents, degraded }, { categories }, viewer] = await Promise.all([
    getIncidents({ limit: 200 }),
    getIncidentCategories(),
    getViewer(),
  ]);

  return (
    <IncidentRadar
      initialIncidents={incidents}
      categories={categories}
      isAuthenticated={Boolean(viewer)}
      degraded={degraded}
    />
  );
}
