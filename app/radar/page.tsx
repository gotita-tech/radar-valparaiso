import type { Metadata } from "next";
import RadarApp from "@/components/radar/RadarApp";
import { getLeads } from "@/lib/data/leads";
import { SITE_URL } from "@/lib/site-config";

const title = "Opportunity Radar — Región de Valparaíso";
const description =
  "Dashboard de inteligencia comercial y geoespacial para detectar, calificar y priorizar negocios con brecha digital en la Región de Valparaíso: Priority Score, Confidence Score, mapa de densidad y ficha explicable por prospecto.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/radar` },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: `${SITE_URL}/radar`,
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

/**
 * El dataset comercial cambia con poca frecuencia y es idéntico para todo el
 * mundo, así que la página se prerenderiza y se revalida cada cinco minutos en
 * lugar de consultar Supabase en cada visita. `getLeads()` no lanza: si la
 * consulta falla se sirve la copia local y el pie de página lo indica.
 */
export const revalidate = 300;

export default async function RadarPage() {
  const { leads, source } = await getLeads();

  return <RadarApp leads={leads} source={source} />;
}
