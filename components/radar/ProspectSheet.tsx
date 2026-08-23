"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Crosshair,
  ExternalLink,
  Globe,
  Instagram,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";
import { needsHumanReview } from "@/lib/radar/data";
import { slugForLead } from "@/lib/radar/slug";
import { diagnosisFor, playbookFor } from "@/lib/radar/recommendations";
import {
  DATA_FLAG,
  DIMENSION,
  DIMENSION_ORDER,
  NICHE_LABEL,
  TIER,
  WEB_CLASS,
  hostOf,
  sourceLabel,
} from "@/lib/radar/taxonomy";
import type { Lead, ScoreDimension } from "@/lib/radar/types";
import { Meter, ScoreDial, SectionLabel, TierBadge } from "./ui";

const WHATSAPP_PREFILL =
  "Hola, los contacto desde una consultoría de desarrollo web. Quisiera conversar sobre la presencia digital de su negocio.";

function waLink(number: string) {
  const digits = number.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;
}

function dimensionValue(lead: Lead, dimension: ScoreDimension) {
  switch (dimension) {
    case "digital_need":
      return lead.digital_need_score;
    case "commercial_attractiveness":
      return lead.commercial_attractiveness_score;
    case "contactability":
      return lead.contactability_score;
    case "landing_fit":
      return lead.landing_fit_score;
    case "local_opportunity":
      return lead.local_opportunity_score;
  }
}

function ExternalAction({
  href,
  icon,
  label,
  detail,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  detail?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2.5 rounded-md border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 transition-colors duration-200 hover:border-gold/40 hover:bg-gold/[0.05]"
    >
      <span className="text-paper-dim/60 transition-colors duration-200 group-hover:text-gold">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-paper">{label}</span>
        {detail ? (
          <span className="block truncate text-[11px] text-paper-dim/45">{detail}</span>
        ) : null}
      </span>
      <ExternalLink
        size={12}
        strokeWidth={1.6}
        className="shrink-0 text-paper-dim/25 transition-colors duration-200 group-hover:text-gold"
      />
    </a>
  );
}

export default function ProspectSheet({
  lead,
  onClose,
  onFocusMap,
}: {
  lead: Lead | null;
  onClose: () => void;
  onFocusMap: (lead: Lead) => void;
}) {
  useEffect(() => {
    if (!lead) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lead, onClose]);

  const tier = lead ? TIER[lead.priority_tier] : null;
  const playbook = lead ? playbookFor(lead) : null;
  const webClass = lead ? WEB_CLASS[lead.website_classification] : null;
  const review = lead ? needsHumanReview(lead) : null;

  const grouped = lead
    ? DIMENSION_ORDER.map((dimension) => ({
        dimension,
        evidence: lead.score_explanations.filter((item) => item.dimension === dimension),
      }))
    : [];
  const hasEvidence = grouped.some((group) => group.evidence.length > 0);

  return (
    <AnimatePresence>
      {lead && tier && playbook && webClass ? (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-ink-950/70 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          <motion.aside
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`Ficha del prospecto ${lead.business_name}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-[520px] flex-col border-l border-white/[0.08] bg-ink-950 shadow-[-24px_0_60px_rgba(0,0,0,0.55)]"
          >
            <header className="flex items-start gap-3 border-b border-white/[0.07] px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest2 text-gold/70">
                    {NICHE_LABEL[lead.niche]}
                  </span>
                  <TierBadge tier={lead.priority_tier} />
                </div>
                <h2 className="mt-1.5 truncate font-serif text-xl text-paper">
                  {lead.business_name}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-paper-dim/55">
                  <MapPin size={11} strokeWidth={1.6} />
                  <span className="truncate">
                    {lead.address ? `${lead.address} · ` : ""}
                    {lead.commune}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ficha"
                className="-mr-1 shrink-0 rounded-md p-1.5 text-paper-dim transition-colors duration-200 hover:bg-white/[0.05] hover:text-paper"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </header>

            {/* Acción principal: continuar el análisis sin volver a introducir nada */}
            <div className="border-b border-white/[0.07] px-5 py-3">
              <Link
                href={`/prospects/${slugForLead(lead)}`}
                className="group flex w-full items-center justify-center gap-2 rounded-md bg-gold px-4 py-3 text-sm font-medium text-ink-950 transition-colors duration-300 hover:bg-gold-soft"
              >
                <Crosshair size={15} strokeWidth={1.8} />
                Analizar oportunidad
                <ArrowRight
                  size={15}
                  strokeWidth={1.8}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </Link>
              <p className="mt-2 text-center text-[10px] text-paper-dim/35">
                Abre el Prospect Studio: diagnóstico, solución, brief y prompt para Claude Code.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Opportunity Score */}
              <section className="border-b border-white/[0.06] px-5 py-6">
                <div className="flex items-center justify-center gap-8">
                  <ScoreDial
                    value={lead.priority_score}
                    label="Opportunity Score"
                    color={tier.color}
                  />
                  <ScoreDial
                    value={lead.confidence_score}
                    label="Confidence"
                    color="#5B8DB8"
                    size={92}
                  />
                </div>
                <p className="mt-4 text-center text-xs text-paper-dim/60">{tier.action}</p>

                {review ? (
                  <p className="mt-4 flex items-start gap-2 rounded-md border border-[#D67E33]/25 bg-[#D67E33]/[0.07] px-3 py-2.5 text-[11px] leading-relaxed text-[#E0A26A]">
                    <AlertTriangle size={13} strokeWidth={1.7} className="mt-px shrink-0" />
                    <span>
                      <strong className="font-medium">Revisión humana requerida.</strong> {review}
                    </span>
                  </p>
                ) : null}
              </section>

              {/* Explicabilidad */}
              <section className="border-b border-white/[0.06] px-5 py-5">
                <SectionLabel>Desglose del score</SectionLabel>
                <ul className="space-y-3.5">
                  {DIMENSION_ORDER.map((dimension) => {
                    const meta = DIMENSION[dimension];
                    const value = dimensionValue(lead, dimension);
                    return (
                      <li key={dimension}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-xs text-paper" title={meta.description}>
                            {meta.label}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-paper-dim">
                            {value}
                            <span className="text-paper-dim/35"> / {meta.max}</span>
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <Meter value={value} max={meta.max} color={tier.color} height={3} />
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-paper-dim/40">
                          {meta.description}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* Evidencia trazable */}
              {hasEvidence ? (
                <section className="border-b border-white/[0.06] px-5 py-5">
                  <SectionLabel>Evidencia trazable</SectionLabel>
                  <ul className="space-y-2">
                    {grouped
                      .filter((group) => group.evidence.length > 0)
                      .flatMap((group) =>
                        group.evidence.map((item, index) => (
                          <li
                            key={`${group.dimension}-${index}`}
                            className="flex items-start gap-2.5 text-[11px] leading-relaxed"
                          >
                            <span
                              className="mt-px shrink-0 rounded-sm px-1.5 py-0.5 font-medium tabular-nums"
                              style={{ color: tier.color, backgroundColor: tier.soft }}
                            >
                              +{item.points}
                            </span>
                            <span className="text-paper-dim">
                              {item.label}
                              <span className="ml-1.5 text-paper-dim/35">
                                {DIMENSION[group.dimension].label}
                              </span>
                            </span>
                          </li>
                        )),
                      )}
                  </ul>
                  <p className="mt-3 text-[10px] leading-relaxed text-paper-dim/35">
                    Extracto de la tabla de explicabilidad del documento canónico. Las líneas de
                    evidencia son un subconjunto documentado; el total autoritativo es el desglose
                    por dimensión de arriba.
                  </p>
                </section>
              ) : null}

              {/* Diagnóstico digital */}
              <section className="border-b border-white/[0.06] px-5 py-5">
                <SectionLabel>Diagnóstico digital</SectionLabel>
                <div className="rounded-md border border-white/[0.06] bg-white/[0.015] p-3.5">
                  <p className="flex items-center gap-2 text-xs text-paper">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          lead.website_classification >= 3 ? "#D67E33" : "#5B8DB8",
                      }}
                    />
                    Presencia web: {webClass.label}
                    <span className="text-paper-dim/35">({webClass.short})</span>
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-paper-dim/65">
                    {diagnosisFor(lead)}
                  </p>
                  {lead.website_quality ? (
                    <p className="mt-2 text-[11px] leading-relaxed text-paper-dim/50">
                      Calidad observada: {lead.website_quality}
                    </p>
                  ) : null}
                  {lead.evidence_notes ? (
                    <p className="mt-3 border-t border-white/[0.05] pt-2.5 text-[11px] leading-relaxed text-paper-dim/50">
                      <span className="text-paper-dim/70">Evidencia: </span>
                      {lead.evidence_notes}
                    </p>
                  ) : null}
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-white/[0.06] bg-white/[0.06]">
                  <Fact label="Rating" value={lead.rating !== null ? lead.rating.toFixed(1) : "—"} />
                  <Fact
                    label="Reseñas"
                    value={lead.review_count !== null ? String(lead.review_count) : "—"}
                  />
                  <Fact label="Fuente" value={sourceLabel(lead.source_primary)} />
                </dl>
              </section>

              {/* Oportunidad comercial */}
              <section className="border-b border-white/[0.06] px-5 py-5">
                <SectionLabel>Oportunidad comercial</SectionLabel>
                <p className="mb-3 inline-flex items-center gap-2 rounded-sm bg-gold/[0.10] px-2 py-1 text-[11px] text-gold">
                  Nicho {NICHE_LABEL[lead.niche]} · oportunidad {playbook.opportunityRating}
                </p>
                <p className="text-[11px] leading-relaxed text-paper-dim/65">
                  {playbook.opportunity}
                </p>
              </section>

              {/* Solución sugerida */}
              <section className="border-b border-white/[0.06] px-5 py-5">
                <SectionLabel>Solución sugerida</SectionLabel>
                <p className="font-serif text-sm text-paper">{playbook.landingType}</p>
                <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {playbook.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-[11px] leading-relaxed text-paper-dim/65"
                    >
                      <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-gold/60" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {playbook.pitch ? (
                  <blockquote className="mt-4 border-l-2 border-gold/40 pl-3 text-[11px] italic leading-relaxed text-paper-dim/60">
                    {playbook.pitch}
                  </blockquote>
                ) : null}
              </section>

              {/* Canales y fuentes */}
              <section className="px-5 py-5">
                <SectionLabel>Canales y fuentes</SectionLabel>

                {(lead.data_flags ?? []).map((flag) => (
                  <p
                    key={flag}
                    className="mb-3 flex items-start gap-2 rounded-md border border-[#D9503F]/25 bg-[#D9503F]/[0.07] px-3 py-2.5 text-[11px] leading-relaxed text-[#E08573]"
                  >
                    <AlertTriangle size={13} strokeWidth={1.7} className="mt-px shrink-0" />
                    <span>
                      <strong className="font-medium">Dato no fiable.</strong> {DATA_FLAG[flag]}
                    </span>
                  </p>
                ))}

                <div className="space-y-1.5">
                  {lead.website_url ? (
                    <ExternalAction
                      href={lead.website_url}
                      icon={<Globe size={14} strokeWidth={1.6} />}
                      label="Abrir sitio web"
                      detail={hostOf(lead.website_url)}
                    />
                  ) : null}
                  {lead.instagram_url ? (
                    <ExternalAction
                      href={lead.instagram_url}
                      icon={<Instagram size={14} strokeWidth={1.6} />}
                      label="Abrir Instagram"
                      detail={hostOf(lead.instagram_url)}
                    />
                  ) : null}
                  {lead.whatsapp_business ? (
                    <ExternalAction
                      href={waLink(lead.whatsapp_business)}
                      icon={<MessageCircle size={14} strokeWidth={1.6} />}
                      label="Abrir WhatsApp Business"
                      detail={lead.whatsapp_business}
                    />
                  ) : null}
                  {lead.public_business_phone ? (
                    <ExternalAction
                      href={`tel:${lead.public_business_phone.replace(/[^\d+]/g, "")}`}
                      icon={<Phone size={14} strokeWidth={1.6} />}
                      label="Llamar al teléfono comercial"
                      detail={lead.public_business_phone}
                    />
                  ) : null}
                  {lead.public_business_email ? (
                    <ExternalAction
                      href={`mailto:${lead.public_business_email}`}
                      icon={<Mail size={14} strokeWidth={1.6} />}
                      label="Escribir al correo corporativo"
                      detail={lead.public_business_email}
                    />
                  ) : null}
                  {lead.source_urls.map((url) => (
                    <ExternalAction
                      key={url}
                      href={url}
                      icon={<Link2 size={14} strokeWidth={1.6} />}
                      label="Ver fuente"
                      detail={hostOf(url)}
                    />
                  ))}
                </div>

                {lead.whatsapp_business ? (
                  <p className="mt-3 rounded-md border border-white/[0.06] bg-white/[0.015] px-3 py-2.5 text-[10px] leading-relaxed text-paper-dim/45">
                    El enlace abre WhatsApp con este texto precargado y <strong>no envía nada</strong>:
                    «{WHATSAPP_PREFILL}». El documento canónico exige verificar manualmente el número
                    de WhatsApp Business antes de iniciar cualquier secuencia de prospección.
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => onFocusMap(lead)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/[0.10] px-3 py-2.5 text-xs text-paper transition-colors duration-200 hover:border-gold/50 hover:text-gold"
                >
                  <MapPin size={13} strokeWidth={1.6} />
                  Centrar en el mapa
                </button>

                <p className="mt-4 text-[10px] leading-relaxed text-paper-dim/30">
                  {lead.business_id} · datos recuperados el{" "}
                  {new Date(lead.retrieved_at).toLocaleDateString("es-CL")} · fuente primaria{" "}
                  {sourceLabel(lead.source_primary)}
                  {lead.business_age_signal ? ` · ${lead.business_age_signal}` : ""}
                </p>
              </section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-950 px-3 py-2.5">
      <dt className="text-[10px] uppercase tracking-widest text-paper-dim/40">{label}</dt>
      <dd className="mt-0.5 truncate text-xs text-paper">{value}</dd>
    </div>
  );
}
