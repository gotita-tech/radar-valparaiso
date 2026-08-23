import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConceptDemo from "@/components/demos/ConceptDemo";
import { allSlugs, leadBySlug } from "@/lib/radar/slug";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lead = leadBySlug(slug);
  if (!lead) return { title: "Demo no encontrada" };

  return {
    title: `Concept demo — ${lead.business_name}`,
    description: `Propuesta conceptual de landing page para ${lead.business_name}. No es el sitio oficial del establecimiento.`,
    // Una demo conceptual de un negocio de terceros no debe aparecer en buscadores.
    robots: { index: false, follow: false },
  };
}

export default async function DemoPage({ params }: Props) {
  const { slug } = await params;
  const lead = leadBySlug(slug);
  if (!lead) notFound();

  return <ConceptDemo lead={lead} slug={slug} />;
}
