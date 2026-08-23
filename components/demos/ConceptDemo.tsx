"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { buildBlueprint } from "@/lib/radar/solution";
import { NICHE_LABEL } from "@/lib/radar/taxonomy";
import type { Lead, Niche } from "@/lib/radar/types";

/**
 * Demo conceptual autogenerada.
 *
 * Muestra cómo podría estructurarse una landing para el prospecto usando
 * EXCLUSIVAMENTE los datos que el dataset respalda. Todo lo que no tenemos se
 * dibuja como placeholder marcado, nunca como contenido plausible.
 *
 * No sustituye a la demo final: es el punto de partida visual de la conversación.
 */

/** Bloque cuyo contenido real todavía no tenemos. Se marca siempre. */
function Placeholder({ label, lines = 3 }: { label: string; lines?: number }) {
  return (
    <div className="rounded-md border border-dashed border-white/[0.14] bg-white/[0.015] p-4">
      <p className="mb-3 inline-flex items-center gap-1.5 rounded-sm bg-[#D67E33]/[0.12] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-[#D67E33]">
        Pendiente · {label}
      </p>
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-2 rounded-full bg-white/[0.05]"
            style={{ width: `${100 - index * 14}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-white/[0.06] px-5 py-8 md:px-10 md:py-12">
      <p className="text-[10px] uppercase tracking-widest2 text-gold/60">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-2xl text-paper md:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const HERO_COPY: Record<Niche, { eyebrow: string; cta: string }> = {
  barbershop: { eyebrow: "Barbería", cta: "Reservar hora" },
  restaurant: { eyebrow: "Restaurante", cta: "Reservar mesa" },
  bar: { eyebrow: "Bar", cta: "Reservar mesa" },
  boutique: { eyebrow: "Boutique", cta: "Visitar la tienda" },
};

const SECTION_PLAN: Record<Niche, { eyebrow: string; title: string; placeholder: string }[]> = {
  barbershop: [
    { eyebrow: "Servicios", title: "Qué hacemos", placeholder: "lista de servicios" },
    { eyebrow: "Precios", title: "Tarifas", placeholder: "precios por servicio" },
    { eyebrow: "Equipo", title: "Quiénes atienden", placeholder: "equipo y especialidades" },
    { eyebrow: "Galería", title: "Trabajos", placeholder: "fotografías del local y de cortes" },
  ],
  restaurant: [
    { eyebrow: "Carta", title: "Menú", placeholder: "platos, categorías y precios" },
    { eyebrow: "Local", title: "El lugar", placeholder: "fotografías del local y de los platos" },
    { eyebrow: "Reservas", title: "Reserva tu mesa", placeholder: "política de reservas y horarios" },
  ],
  bar: [
    { eyebrow: "Carta", title: "Tragos y cocina", placeholder: "carta de tragos" },
    { eyebrow: "Cartelera", title: "Qué viene", placeholder: "programación de eventos" },
    { eyebrow: "Ambiente", title: "El local", placeholder: "fotografías de ambiente" },
  ],
  boutique: [
    { eyebrow: "Colecciones", title: "Temporada actual", placeholder: "colecciones y piezas" },
    { eyebrow: "Lookbook", title: "Cómo se ve", placeholder: "fotografía de producto" },
    { eyebrow: "Visítanos", title: "En tienda", placeholder: "horarios de atención" },
  ],
};

export default function ConceptDemo({ lead, slug }: { lead: Lead; slug: string }) {
  const blueprint = buildBlueprint(lead);
  const hero = HERO_COPY[lead.niche];
  const sections = SECTION_PLAN[lead.niche];

  const whatsappHref = lead.whatsapp_business
    ? `https://wa.me/${lead.whatsapp_business.replace(/[^\d]/g, "")}`
    : null;
  const phoneVerified = !lead.data_flags?.includes("placeholder_phone");

  return (
    <div className="min-h-screen bg-ink-950/80">
      {/* Barra de contexto: esto es una demo, no el sitio del negocio */}
      <div className="sticky top-0 z-40 border-b border-[#D67E33]/25 bg-ink-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-6">
          <Link
            href={`/prospects/${slug}`}
            className="group inline-flex shrink-0 items-center gap-2 text-xs text-paper-dim transition-colors duration-300 hover:text-gold"
          >
            <ArrowLeft
              size={14}
              strokeWidth={1.6}
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />
            Volver al prospecto
          </Link>

          <span className="hidden h-4 w-px bg-white/10 sm:block" aria-hidden="true" />

          <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#D67E33]/[0.14] px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-[#D67E33]">
            Concept demo
          </span>

          <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-paper-dim/45">
            Propuesta conceptual generada desde el dataset. No es el sitio oficial de{" "}
            {lead.business_name} ni está afiliada al establecimiento.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6 md:py-8">
        <article className="overflow-hidden rounded-lg border border-white/[0.07] bg-ink-900/25">
          {/* Hero */}
          <header className="relative px-5 py-12 md:px-10 md:py-16">
            <div className="pattern-seigaiha absolute inset-0 opacity-20" aria-hidden="true" />
            <div className="relative">
              <p className="text-[10px] uppercase tracking-widest2 text-gold/70">
                {hero.eyebrow} · {lead.commune}
              </p>
              <h1 className="mt-3 font-serif text-4xl leading-tight text-paper md:text-5xl">
                {lead.business_name}
              </h1>

              <div className="mt-4 max-w-lg">
                <Placeholder label="propuesta de valor" lines={2} />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {whatsappHref && phoneVerified ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-ink-950 transition-colors duration-300 hover:bg-gold-soft"
                  >
                    <MessageCircle size={15} strokeWidth={1.8} />
                    {hero.cta}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-gold/40 px-5 py-2.5 text-sm text-gold/60">
                    {hero.cta}
                    <span className="text-[10px] uppercase tracking-widest">canal por confirmar</span>
                  </span>
                )}

                {lead.instagram_url ? (
                  <a
                    href={lead.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm text-paper transition-colors duration-300 hover:border-gold/60 hover:text-gold"
                  >
                    <Instagram size={15} strokeWidth={1.6} />
                    Instagram
                  </a>
                ) : null}
              </div>

              {/* Sólo se muestran datos que el dataset respalda */}
              {lead.rating !== null || lead.review_count !== null ? (
                <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-paper-dim/55">
                  {lead.rating !== null ? (
                    <span>
                      <span className="font-serif text-lg text-paper">{lead.rating.toFixed(1)}</span>
                      <span className="text-paper-dim/35"> / 5</span>
                    </span>
                  ) : null}
                  {lead.review_count !== null ? (
                    <span>{lead.review_count} reseñas públicas</span>
                  ) : null}
                  <span className="text-[10px] text-paper-dim/30">
                    dato del dataset, pendiente de confirmar con el negocio
                  </span>
                </p>
              ) : null}
            </div>
          </header>

          {/* Secciones del nicho */}
          {sections.map((section) => (
            <Section key={section.eyebrow} eyebrow={section.eyebrow} title={section.title}>
              <Placeholder label={section.placeholder} lines={4} />
            </Section>
          ))}

          {/* Ubicación y contacto: aquí sí hay datos reales */}
          <Section eyebrow="Ubicación" title="Dónde estamos">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-white/[0.06] bg-white/[0.015] p-4">
                <p className="flex items-start gap-2 text-sm text-paper">
                  <MapPin size={15} strokeWidth={1.6} className="mt-0.5 shrink-0 text-gold" />
                  <span>
                    {lead.address ?? "Dirección por confirmar"}
                    <br />
                    <span className="text-paper-dim/55">{lead.commune}, Región de Valparaíso</span>
                  </span>
                </p>
                {lead.latitude !== null && lead.longitude !== null ? (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${lead.latitude}&mlon=${lead.longitude}#map=17/${lead.latitude}/${lead.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-paper-dim transition-colors duration-200 hover:text-gold"
                  >
                    Abrir en el mapa
                    <ExternalLink size={11} strokeWidth={1.6} />
                  </a>
                ) : null}
              </div>

              <div>
                <Placeholder label="horarios de atención" lines={3} />
              </div>
            </div>
          </Section>

          <Section eyebrow="Contacto" title="Escríbenos">
            <div className="flex flex-wrap gap-2">
              {whatsappHref && phoneVerified ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-white/[0.09] bg-white/[0.02] px-4 py-2.5 text-xs text-paper transition-colors duration-200 hover:border-gold/40 hover:text-gold"
                >
                  <MessageCircle size={14} strokeWidth={1.6} />
                  WhatsApp
                </a>
              ) : null}
              {lead.public_business_phone && phoneVerified ? (
                <a
                  href={`tel:${lead.public_business_phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-md border border-white/[0.09] bg-white/[0.02] px-4 py-2.5 text-xs text-paper transition-colors duration-200 hover:border-gold/40 hover:text-gold"
                >
                  <Phone size={14} strokeWidth={1.6} />
                  {lead.public_business_phone}
                </a>
              ) : null}
              {!phoneVerified || (!whatsappHref && !lead.public_business_phone) ? (
                <div className="w-full max-w-sm">
                  <Placeholder label="canal de contacto verificado" lines={2} />
                </div>
              ) : null}
            </div>
          </Section>

          {/* Qué contendría la landing final */}
          <footer className="border-t border-white/[0.06] bg-ink-950/40 px-5 py-8 md:px-10">
            <p className="text-[10px] uppercase tracking-widest2 text-paper-dim/45">
              Estructura propuesta
            </p>
            <p className="mt-2 font-serif text-lg text-paper">{blueprint.landingType}</p>
            <p className="mt-1 text-xs text-paper-dim/55">{blueprint.conversionGoal}</p>

            <ul className="mt-4 flex flex-wrap gap-1.5">
              {blueprint.modules.map((feature) => (
                <li
                  key={feature.id}
                  title={feature.rationale}
                  className="rounded-sm border border-white/[0.07] px-2 py-1 text-[10px] text-paper-dim/60"
                >
                  {feature.label}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-[11px] leading-relaxed text-paper-dim/40">
              Esta vista previa usa sólo información del dataset. Para construir la demo definitiva,
              genera el prompt desde el{" "}
              <Link
                href={`/prospects/${slug}#entregables`}
                className="text-paper-dim underline-offset-2 hover:text-gold hover:underline"
              >
                Prospect Studio
              </Link>{" "}
              y ejecútalo en Claude Code. {NICHE_LABEL[lead.niche]} · {lead.business_id}
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
