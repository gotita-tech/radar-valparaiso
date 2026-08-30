"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Plus, RefreshCw, Radio } from "lucide-react";
import { useIncidentsRealtime, type LiveStatus } from "@/hooks/useIncidentsRealtime";
import {
  INCIDENT_SEVERITY_COLORS,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
  type Incident,
  type IncidentCategory,
} from "@/lib/incidents/types";
import { EmptyState, SectionLabel } from "@/components/radar/ui";
import ReportForm from "./ReportForm";

const IncidentMap = dynamic(() => import("./IncidentMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink-900/40">
      <span className="text-xs text-paper-dim/40">Preparando el mapa…</span>
    </div>
  ),
});

type Props = {
  initialIncidents: Incident[];
  categories: IncidentCategory[];
  isAuthenticated: boolean;
  /** true = Supabase no respondió al renderizar. No es lo mismo que "no hay incidentes". */
  degraded: boolean;
};

type Point = { latitude: number; longitude: number } | null;

export default function IncidentRadar({
  initialIncidents,
  categories,
  isAuthenticated,
  degraded,
}: Props) {
  const router = useRouter();
  const { incidents, status, refetch } = useIncidentsRealtime(
    initialIncidents,
    categories,
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [point, setPoint] = useState<Point>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      categoryFilter
        ? incidents.filter((incident) => incident.category?.slug === categoryFilter)
        : incidents,
    [incidents, categoryFilter],
  );

  const selected = useMemo(
    () => incidents.find((incident) => incident.id === selectedId) ?? null,
    [incidents, selectedId],
  );

  const handleCreated = useCallback(() => {
    setReporting(false);
    setPoint(null);
    void refetch();
    // Revalida el render del servidor para que una recarga muestre lo mismo.
    router.refresh();
  }, [refetch, router]);

  const confirmIncident = useCallback(
    async (incidentId: string) => {
      setConfirmError(null);
      setConfirming(incidentId);

      try {
        const response = await fetch(`/api/incidents/${incidentId}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmation_type: "confirm" }),
        });

        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => null);
          const detail =
            payload && typeof payload === "object"
              ? (payload as { error?: string })
              : {};
          setConfirmError(detail.error ?? "No se pudo registrar la confirmación.");
          return;
        }

        // El recuento lo recalcula un trigger: se relee en vez de suponerlo.
        void refetch();
      } catch {
        setConfirmError("No se pudo contactar con el servidor.");
      } finally {
        setConfirming(null);
      }
    },
    [refetch],
  );

  return (
    <div className="min-h-screen bg-ink-950/80">
      <header className="border-b border-white/[0.07] px-4 py-5 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-paper md:text-3xl">Radar ciudadano</h1>
            <p className="mt-1 text-xs text-paper-dim/55">
              Incidentes reportados por la comunidad · Región de Valparaíso
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LiveBadge status={status} />
            <button
              type="button"
              onClick={() => {
                setReporting((value) => !value);
                setSelectedId(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-sm border border-gold/30 bg-gold/[0.08] px-3 py-1.5 text-[11px] text-gold transition-colors duration-200 hover:bg-gold/[0.14]"
            >
              <Plus size={13} strokeWidth={1.6} />
              {reporting ? "Cerrar" : "Reportar"}
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-lg border border-white/[0.07] bg-ink-900/30">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
            <span className="mr-1 hidden text-[10px] uppercase tracking-widest2 text-paper-dim/40 sm:inline">
              Categorías
            </span>
            <CategoryChip
              label="Todas"
              active={categoryFilter === null}
              onClick={() => setCategoryFilter(null)}
            />
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                label={category.name}
                color={category.color}
                active={categoryFilter === category.slug}
                onClick={() =>
                  setCategoryFilter((current) =>
                    current === category.slug ? null : category.slug,
                  )
                }
              />
            ))}
          </div>

          <div className="relative h-[420px] md:h-[520px] xl:h-[600px]">
            <IncidentMap
              incidents={visible}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onPick={reporting ? (coords) => setPoint(coords) : undefined}
              pickedPoint={reporting ? point : null}
            />
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          {reporting ? (
            <ReportForm
              categories={categories}
              point={point}
              isAuthenticated={isAuthenticated}
              onCreated={handleCreated}
              onCancel={() => {
                setReporting(false);
                setPoint(null);
              }}
            />
          ) : null}

          <div className="flex max-h-[640px] flex-col overflow-hidden rounded-lg border border-white/[0.07] bg-ink-900/30">
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
              <div>
                <p className="font-serif text-sm text-paper">Incidentes activos</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest2 text-paper-dim/40">
                  Los más recientes primero
                </p>
              </div>
              <span className="shrink-0 rounded-sm bg-white/[0.05] px-1.5 py-0.5 text-[10px] tabular-nums text-paper-dim">
                {visible.length}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {degraded ? (
                <div className="px-4 py-8">
                  <EmptyState
                    title="No pudimos leer los incidentes"
                    hint="La base de datos no respondió. El mapa y el listado vuelven solos en cuanto se restablezca."
                  />
                  <button
                    type="button"
                    onClick={() => router.refresh()}
                    className="mx-auto mt-3 flex items-center gap-1.5 rounded-sm border border-white/[0.08] px-3 py-1.5 text-[11px] text-paper-dim transition-colors duration-200 hover:border-white/20"
                  >
                    <RefreshCw size={12} strokeWidth={1.6} />
                    Reintentar
                  </button>
                </div>
              ) : visible.length === 0 ? (
                <div className="px-4 py-8">
                  <EmptyState
                    title={
                      categoryFilter
                        ? "Nada reportado en esta categoría"
                        : "Todavía no hay incidentes"
                    }
                    hint={
                      categoryFilter
                        ? "Prueba con otra categoría o quita el filtro."
                        : "El radar está activo y vacío: nadie ha reportado nada por ahora. Los reportes aparecen aquí en cuanto se publican."
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.05]">
                  {visible.map((incident) => (
                    <IncidentRow
                      key={incident.id}
                      incident={incident}
                      selected={incident.id === selectedId}
                      onSelect={() => setSelectedId(incident.id)}
                      onConfirm={
                        isAuthenticated ? () => confirmIncident(incident.id) : undefined
                      }
                      confirming={confirming === incident.id}
                    />
                  ))}
                </ul>
              )}
            </div>

            {confirmError ? (
              <p className="border-t border-white/[0.06] px-4 py-2 text-[10px] text-[#E8A19B]">
                {confirmError}
              </p>
            ) : null}
          </div>

          {selected ? <IncidentDetail incident={selected} /> : null}

          <footer className="rounded-lg border border-white/[0.07] bg-ink-900/20 px-4 py-4">
            <SectionLabel>Cómo leer este radar</SectionLabel>
            <p className="text-[11px] leading-relaxed text-paper-dim/55">
              Cada punto es un reporte de una persona, no un dato oficial. Un incidente pasa a{" "}
              <span className="text-paper-dim">verificado</span> cuando tres personas distintas
              lo confirman, o cuando lo revisa un moderador. Ante una emergencia real, llama a
              los servicios de emergencia: esto no los sustituye.
            </p>
          </footer>
        </aside>
      </div>
    </div>
  );
}

function LiveBadge({ status }: { status: LiveStatus }) {
  const config: Record<LiveStatus, { label: string; color: string }> = {
    connecting: { label: "Conectando", color: "#8A8A8A" },
    live: { label: "En vivo", color: "#5FA463" },
    polling: { label: "Refresco periódico", color: "#C9A227" },
    offline: { label: "Sin conexión", color: "#8C4A45" },
  };

  const { label, color } = config[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] uppercase tracking-wider"
      style={{ borderColor: `${color}55`, color }}
      title={
        status === "polling"
          ? "El canal en tiempo real no está disponible; la lista se refresca cada minuto."
          : undefined
      }
    >
      <Radio size={11} strokeWidth={1.8} />
      {label}
    </span>
  );
}

function CategoryChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm border px-2 py-1 text-[10px] transition-colors duration-200"
      style={{
        borderColor: active ? `${color ?? "#C9A227"}77` : "rgba(255,255,255,0.08)",
        color: active ? (color ?? "#C9A227") : "#D9D9D9",
        backgroundColor: active ? `${color ?? "#C9A227"}1A` : "transparent",
      }}
    >
      {label}
    </button>
  );
}

function IncidentRow({
  incident,
  selected,
  onSelect,
  onConfirm,
  confirming,
}: {
  incident: Incident;
  selected: boolean;
  onSelect: () => void;
  onConfirm?: () => void;
  confirming: boolean;
}) {
  const color = INCIDENT_SEVERITY_COLORS[incident.severity];

  return (
    <li
      className={`px-4 py-3 transition-colors duration-200 ${
        selected ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex items-start gap-2">
          <span
            className="mt-1 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-paper">{incident.title}</p>
            <p className="mt-0.5 text-[10px] text-paper-dim/45">
              {incident.category?.name ?? "Sin categoría"}
              {incident.commune ? ` · ${incident.commune}` : ""} ·{" "}
              {INCIDENT_STATUS_LABELS[incident.status]}
              {incident.is_demo ? " · demo" : ""}
            </p>
          </div>
          {incident.is_verified ? (
            <span className="shrink-0 rounded-sm bg-[#5FA463]/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#5FA463]">
              Verificado
            </span>
          ) : null}
        </div>
      </button>

      <div className="mt-2 flex items-center gap-2 pl-4">
        <span className="text-[10px] tabular-nums text-paper-dim/35">
          {incident.verification_count} confirmacion
          {incident.verification_count === 1 ? "" : "es"}
        </span>
        {onConfirm ? (
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="inline-flex items-center gap-1 rounded-sm border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-paper-dim/70 transition-colors duration-200 hover:border-[#5FA463]/40 hover:text-[#5FA463] disabled:opacity-40"
          >
            <Check size={10} strokeWidth={2} />
            {confirming ? "…" : "Sigue ahí"}
          </button>
        ) : null}
      </div>
    </li>
  );
}

function IncidentDetail({ incident }: { incident: Incident }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-ink-900/30 px-4 py-4">
      <SectionLabel>Detalle</SectionLabel>
      <p className="font-serif text-base text-paper">{incident.title}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-paper-dim/40">
        {incident.category?.name ?? "Sin categoría"} ·{" "}
        {INCIDENT_SEVERITY_LABELS[incident.severity]} ·{" "}
        {INCIDENT_STATUS_LABELS[incident.status]}
      </p>

      {incident.description ? (
        <p className="mt-2 text-[11px] leading-relaxed text-paper-dim/70">
          {incident.description}
        </p>
      ) : null}

      {incident.address || incident.commune ? (
        <p className="mt-2 text-[11px] text-paper-dim/50">
          {[incident.address, incident.commune].filter(Boolean).join(" · ")}
        </p>
      ) : null}

      <p className="mt-2 font-mono text-[10px] tabular-nums text-paper-dim/30">
        {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
      </p>

      {incident.is_demo ? (
        <p className="mt-3 flex items-start gap-1.5 rounded-sm border border-gold/25 bg-gold/[0.07] px-2 py-1.5 text-[10px] leading-relaxed text-gold/90">
          <AlertTriangle size={11} strokeWidth={1.8} className="mt-px shrink-0" />
          Registro de demostración. No corresponde a un incidente real.
        </p>
      ) : null}
    </div>
  );
}
