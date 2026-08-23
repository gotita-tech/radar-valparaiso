import type { Metadata } from "next";
import RadarApp from "@/components/radar/RadarApp";
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

export default function RadarPage() {
  return <RadarApp />;
}
