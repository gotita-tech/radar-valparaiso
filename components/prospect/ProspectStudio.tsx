"use client";

import { useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Globe,
  Instagram,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Radar,
} from "lucide-react";
import { channelsOf } from "@/lib/radar/brief";
import { buildDiagnosis } from "@/lib/radar/diagnosis";
import { needsHumanReview } from "@/lib/radar/data";
import { usePipeline } from "@/lib/radar/pipeline";
import { buildBlueprint } from "@/lib/radar/solution";
import { DATA_FLAG, NICHE_LABEL, TIER, WEB_CLASS, hostOf, sourceLabel } from "@/lib/radar/taxonomy";
import type { Lead } from "@/lib/radar/types";
import DeliverablesPanel from "./DeliverablesPanel";
import PipelineControl from "./PipelineControl";
import ScoreExplainer from "./ScoreExplainer";
import SignalsPanel from "./SignalsPanel";
import SolutionPanel from "./SolutionPanel";
import { DataRow, Panel, orNA } from "./studio-ui";

const LocatorMap = dynamic(() => import("./LocatorMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[200px] items-center justify-center rounded-md border border-white/[0.06] bg-ink-950/60">
      <span className="text-[11px] text-paper-dim/40">Cargando ubicación…</span>
    </div>
  ),
});

const CHANNEL_ICON = {
  "Sitio web": Globe,
  Instagram: Instagram,
  "WhatsApp Business": MessageCircle,
  "Teléfono comercial": Phone,
  "Correo corporativo": Mail,
} as const;

export default function ProspectStudio({ lead, slug }: { lead: Lead; slug: string }) {
  const { entryOf, hydrated, setStage, setNote, advanceTo, reset } = usePipeline();
  const entry = entryOf(lead.business_id);

  const diagnosis = useMemo(() => buildDiagnosis(lead), [lead]);
  const blueprint = useMemo(() => buildBlueprint(lead), [lead]);
  const channels = useMemo(() => channelsOf(lead), [lead]);
  const tier = TIER[lead.priority_tier];
  const webClass = WEB_CLASS[lead.website_classification];
  const review = needsHumanReview(lead);
  const demoUrl = lead.demo_url ?? null;

  // Abrir el studio ya es "analizar": el estado avanza solo, nunca retrocede.
  useEffect(() => {
    if (!hydrated) return;
    advanceTo(lead.business_id, "ANALYZED");
  }, [hydrated, advanceTo, lead.business_id]);

  const markBriefReady = useCallback(
    () => advanceTo(lead.business_id, "BRIEF_READY"),
    [advanceTo, lead.business_id],
  );

  return (
    <div className="min-h-screen bg-ink-950/80">
      {/* Barra superior */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-ink-950/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 md:px-6">
          <Link
            href="/radar"
            className="group inline-flex shrink-0 items-center gap-2 text-paper-dim transition-colors duration-300 hover:text-gold"
          >
            <ArrowLeft
              size={16}
              strokeWidth={1.6}
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />
            <span className="hidden text-xs sm:inline">Volver al Radar</span>
          </Link>

          <span className="hidden h-5 w-px bg-white/10 sm:block" aria-hidden="true" />

          <nav aria-label="Ruta de navegación" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 text-[11px] text-paper-dim/40">
              <li>
                <Link href="/radar" className="transition-colors duration-200 hover:text-gold">
                  Radar
                </Link>
              </li>
              <ChevronRight size={11} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
              <li className="hidden sm:block">Prospectos</li>
              <ChevronRight
                size={11}
                strokeWidth={1.8}
                className="hidden shrink-0 sm:block"
                aria-hidden="true"
              />
              <li className="min-w-0 truncate text-paper-dim" aria-current="page">
                {lead.business_name}
              </li>
            </ol>
          </nav>

          <Link
            href="/pipeline"
            className="hidden shrink-0 items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.02] px-2.5 py-1.5 text-xs text-paper-dim transition-colors duration-200 hover:border-gold/40 hover:text-gold sm:inline-flex"
          >
            <Radar size={13} strokeWidth={1.6} />
            Pipeline
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 md:py-8">
        {/* Identidad */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest2">
              <span className="text-gold/70">Prospect Studio</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-medium"
                style={{ color: tier.color, backgroundColor: tier.soft }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tier.color }}
                  aria-hidden="true"
                />
                {tier.label}
              </span>
            </p>
            <h1 className="mt-2 font-serif text-3xl text-paper md:text-4xl">
              {lead.business_name}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-paper-dim/55">
              <span>{NICHE_LABEL[lead.niche]}</span>
              {lead.subcategory ? (
                <>
                  <span className="text-paper-dim/20">·</span>
                  <span>{lead.subcategory}</span>
                </>
              ) : null}
              <span className="text-paper-dim/20">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} strokeWidth={1.6} />
                {lead.address ? `${lead.address}, ` : ""}
                {lead.commune}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {demoUrl ? (
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-gold/50 bg-gold/[0.12] px-3 py-2 text-xs text-gold transition-colors duration-200 hover:bg-gold/[0.2]"
              >
                <ExternalLink size={13} strokeWidth={1.6} />
                Ver demo
              </a>
            ) : (
              <span
                title="Aún no existe una demo construida para este prospecto. Genera el prompt y constrúyela con Claude Code."
                className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.07] px-3 py-2 text-xs text-paper-dim/40"
              >
                Demo pendiente
              </span>
            )}
            <Link
              href={`/demos/${slug}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.09] bg-white/[0.02] px-3 py-2 text-xs text-paper transition-colors duration-200 hover:border-gold/40 hover:text-gold"
            >
              <Eye size={13} strokeWidth={1.6} />
              Vista previa
            </Link>
          </div>
        </div>

        {/* Avisos de calidad del dato */}
        {review || lead.data_flags?.length ? (
          <div className="mb-6 space-y-2">
            {review ? (
              <p className="flex items-start gap-2 rounded-md border border-[#D67E33]/25 bg-[#D67E33]/[0.07] px-3 py-2.5 text-[11px] leading-relaxed text-[#E0A26A]">
                <AlertTriangle size={13} strokeWidth={1.7} className="mt-px shrink-0" />
                <span>
                  <strong className="font-medium">Revisión humana requerida.</strong> {review}
                </span>
              </p>
            ) : null}
            {(lead.data_flags ?? []).map((flag) => (
              <p
                key={flag}
                className="flex items-start gap-2 rounded-md border border-[#D9503F]/25 bg-[#D9503F]/[0.07] px-3 py-2.5 text-[11px] leading-relaxed text-[#E08573]"
              >
                <AlertTriangle size={13} strokeWidth={1.7} className="mt-px shrink-0" />
                <span>
                  <strong className="font-medium">Dato no fiable.</strong> {DATA_FLAG[flag]}
                </span>
              </p>
            ))}
          </div>
        ) : null}

        {/* Cuerpo */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            <Panel eyebrow="Explicabilidad" title="Por qué este negocio es una oportunidad">
              <ScoreExplainer lead={lead} />
            </Panel>

            <Panel
              eyebrow="Diagnóstico"
              title="Señales detectadas"
              action={
                <span className="text-[10px] text-paper-dim/35">
                  {diagnosis.signals.length} señales · {diagnosis.gaps.length} vacíos
                </span>
              }
            >
              <SignalsPanel signals={diagnosis.signals} gaps={diagnosis.gaps} />
            </Panel>

            <Panel eyebrow="Diagnóstico" title="Problema detectado">
              <p className="font-serif text-lg leading-snug text-paper">
                {diagnosis.problem.headline}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-paper-dim/70">
                {diagnosis.problem.body}
              </p>
            </Panel>

            <Panel eyebrow="Comercial" title="Oportunidad">
              <dl className="space-y-4">
                {[
                  { label: "Qué puede mejorarse", value: diagnosis.opportunity.improvement },
                  { label: "Por qué aporta valor una landing", value: diagnosis.opportunity.value },
                  { label: "Qué acción debe facilitar", value: diagnosis.opportunity.facilitatedAction },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-[10px] uppercase tracking-widest2 text-paper-dim/45">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-xs leading-relaxed text-paper-dim/70">{item.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-white/[0.05] pt-3 text-[10px] leading-relaxed text-paper-dim/35">
                {diagnosis.opportunity.caveat}
              </p>
            </Panel>

            <Panel eyebrow="Solución" title="Landing recomendada">
              <SolutionPanel blueprint={blueprint} />
            </Panel>

            <Panel eyebrow="Entregables" title="Brief y prompt" id="entregables">
              <DeliverablesPanel
                lead={lead}
                slug={slug}
                onBriefReady={markBriefReady}
                onPromptReady={markBriefReady}
              />
            </Panel>
          </div>

          {/* Columna lateral */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Panel eyebrow="Pipeline" title="Estado comercial">
              <PipelineControl
                entry={entry}
                hydrated={hydrated}
                onStageChange={(stage) => setStage(lead.business_id, stage)}
                onNoteChange={(note) => setNote(lead.business_id, note)}
                onReset={() => reset(lead.business_id)}
              />
            </Panel>

            <Panel eyebrow="Ubicación" title="Localización">
              <LocatorMap lead={lead} />
              <dl className="mt-3">
                <DataRow label="Comuna" value={lead.commune} />
                <DataRow label="Dirección" value={orNA(lead.address)} />
                <DataRow
                  label="Coordenadas"
                  value={
                    lead.latitude !== null && lead.longitude !== null
                      ? `${lead.latitude}, ${lead.longitude}`
                      : orNA(null)
                  }
                />
              </dl>
            </Panel>

            <Panel eyebrow="Presencia" title="Estado digital">
              <p
                className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[10px] uppercase tracking-widest"
                style={{
                  color: lead.website_classification >= 3 ? "#D67E33" : "#7FA8C9",
                  backgroundColor:
                    lead.website_classification >= 3
                      ? "rgba(214,126,51,0.12)"
                      : "rgba(127,168,201,0.12)",
                }}
              >
                {webClass.label}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-paper-dim/55">
                {webClass.description}
              </p>
              <dl className="mt-3">
                <DataRow label="Rating" value={orNA(lead.rating !== null ? lead.rating.toFixed(1) : null)} />
                <DataRow label="Reseñas" value={orNA(lead.review_count)} />
                <DataRow label="Actividad" value={orNA(lead.social_activity)} />
                <DataRow label="Fuente" value={sourceLabel(lead.source_primary)} />
              </dl>
            </Panel>

            <Panel eyebrow="Contacto" title="Canales disponibles">
              {channels.length ? (
                <ul className="space-y-1.5">
                  {channels.map((channel) => {
                    const Icon =
                      CHANNEL_ICON[channel.label as keyof typeof CHANNEL_ICON] ?? Link2;
                    return (
                      <li key={channel.label}>
                        <a
                          href={channel.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2.5 rounded-md border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 transition-colors duration-200 hover:border-gold/40 hover:bg-gold/[0.05]"
                        >
                          <Icon
                            size={14}
                            strokeWidth={1.6}
                            className="shrink-0 text-paper-dim/60 transition-colors duration-200 group-hover:text-gold"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs text-paper">{channel.label}</span>
                            <span className="block truncate text-[11px] text-paper-dim/45">
                              {channel.value}
                            </span>
                          </span>
                          <ExternalLink
                            size={12}
                            strokeWidth={1.6}
                            className="shrink-0 text-paper-dim/25 transition-colors duration-200 group-hover:text-gold"
                          />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[11px] leading-relaxed text-paper-dim/40">
                  El dataset no registra ningún canal corporativo público para este prospecto. Habrá
                  que abrir vía en terreno o mediante el directorio de origen.
                </p>
              )}

              <p className="mt-3 text-[10px] leading-relaxed text-paper-dim/30">
                Los enlaces abren el canal público del negocio. La aplicación nunca envía mensajes ni
                correos por su cuenta.
              </p>
            </Panel>

            <Panel eyebrow="Trazabilidad" title="Fuentes">
              <ul className="space-y-1.5">
                {lead.source_urls.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2.5 rounded-md border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 transition-colors duration-200 hover:border-gold/40 hover:bg-gold/[0.05]"
                    >
                      <Link2
                        size={14}
                        strokeWidth={1.6}
                        className="shrink-0 text-paper-dim/60 transition-colors duration-200 group-hover:text-gold"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-paper">Ver fuente</span>
                        <span className="block truncate text-[11px] text-paper-dim/45">
                          {hostOf(url)}
                        </span>
                      </span>
                      <ExternalLink
                        size={12}
                        strokeWidth={1.6}
                        className="shrink-0 text-paper-dim/25 transition-colors duration-200 group-hover:text-gold"
                      />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] leading-relaxed text-paper-dim/30">
                {lead.business_id} · recuperado el{" "}
                {new Date(lead.retrieved_at).toLocaleDateString("es-CL")}
              </p>
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}
