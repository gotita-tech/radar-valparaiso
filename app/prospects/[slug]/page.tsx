import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProspectStudio from "@/components/prospect/ProspectStudio";
import { allSlugs, leadBySlug } from "@/lib/radar/slug";
import { NICHE_LABEL } from "@/lib/radar/taxonomy";
import { SITE_URL } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lead = leadBySlug(slug);
  if (!lead) return { title: "Prospecto no encontrado" };

  const title = `${lead.business_name} — Prospect Studio`;
  const description = `Diagnóstico digital, explicabilidad del Priority Score (${lead.priority_score}/100) y solución recomendada para ${lead.business_name}, ${NICHE_LABEL[lead.niche].toLowerCase()} en ${lead.commune}.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/prospects/${slug}` },
    // Fichas de trabajo interno: no aportan nada en buscadores.
    robots: { index: false, follow: false },
    openGraph: { type: "article", locale: "es_CL", title, description },
  };
}

export default async function ProspectPage({ params }: Props) {
  const { slug } = await params;
  const lead = leadBySlug(slug);
  if (!lead) notFound();

  return <ProspectStudio lead={lead} slug={slug} />;
}
