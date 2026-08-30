"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Flame, Layers, MapPin, X } from "lucide-react";
import {
  DATASET_META,
  LEADS,
  applyFilters,
  computeMetrics,
  sortLeads,
} from "@/lib/radar/data";
import type { LeadsSource } from "@/lib/data/leads";
import { downloadText, leadsToCsv, leadsToGeoJson } from "@/lib/radar/export";
import { EMPTY_FILTERS, type Filters, type Lead, type SortKey } from "@/lib/radar/types";
import DistributionPanel from "./DistributionPanel";
import FilterPanel from "./FilterPanel";
import KpiStrip from "./KpiStrip";
import LeadTable from "./LeadTable";
import RadarTopBar, { type RadarView } from "./RadarTopBar";
import RankingPanel from "./RankingPanel";
import ProspectSheet from "./ProspectSheet";
import { SectionLabel, Segmented, ToolButton } from "./ui";

const RadarMap = dynamic(() => import("./RadarMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink-900/40">
      <span className="text-xs text-paper-dim/40">Preparando el mapa…</span>
    </div>
  ),
});

type Shortcut = "very_high" | "high" | "no_website" | null;

/**
 * El dashboard recibe los prospectos ya resueltos desde el servidor
 * (`app/radar/page.tsx`), que los pide a Supabase. Los valores por defecto
 * mantienen funcionando cualquier uso del componente sin props y sirven de red
 * si la consulta falla.
 */
export default function RadarApp({
  leads = LEADS,
  source = "local",
}: {
  leads?: Lead[];
  source?: LeadsSource;
} = {}) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [view, setView] = useState<RadarView>("map");
  const [sortKey, setSortKey] = useState<SortKey>("priority_score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showHeat, setShowHeat] = useState(true);
  const [showPins, setShowPins] = useState(true);
  const [basemap, setBasemap] = useState<"dark" | "osm">("dark");
  const [fitNonce, setFitNonce] = useState(0);

  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => applyFilters(leads, filters), [leads, filters]);
  const sorted = useMemo(
    () => sortLeads(filtered, sortKey, sortDirection),
    [filtered, sortKey, sortDirection],
  );
  const ranking = useMemo(() => sortLeads(filtered, "priority_score", "desc"), [filtered]);
  const metrics = useMemo(() => computeMetrics(filtered), [filtered]);
  const selectedLead = useMemo(
    () => leads.find((lead) => lead.business_id === selectedId) ?? null,
    [leads, selectedId],
  );

  const activeFilterCount =
    filters.communes.length +
    filters.niches.length +
    filters.webClasses.length +
    (filters.minScore > 0 ? 1 : 0) +
    (filters.search.trim() ? 1 : 0) +
    (filters.onlyContactable ? 1 : 0);

  const shortcut: Shortcut = useMemo(() => {
    const onlyScore =
      !filters.communes.length && !filters.niches.length && !filters.webClasses.length;
    if (onlyScore && filters.minScore === 85) return "very_high";
    if (onlyScore && filters.minScore === 75) return "high";
    if (
      filters.webClasses.length === 2 &&
      filters.webClasses.includes(3) &&
      filters.webClasses.includes(4)
    ) {
      return "no_website";
    }
    return null;
  }, [filters]);

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const focusVeryHigh = useCallback(() => {
    setFilters((current) =>
      current.minScore === 85
        ? { ...current, minScore: 0 }
        : { ...EMPTY_FILTERS, search: current.search, minScore: 85 },
    );
  }, []);

  const focusHigh = useCallback(() => {
    setFilters((current) =>
      current.minScore === 75
        ? { ...current, minScore: 0 }
        : { ...EMPTY_FILTERS, search: current.search, minScore: 75 },
    );
  }, []);

  const focusNoWebsite = useCallback(() => {
    setFilters((current) => {
      const already =
        current.webClasses.length === 2 &&
        current.webClasses.includes(3) &&
        current.webClasses.includes(4);
      return already
        ? { ...current, webClasses: [] }
        : { ...current, webClasses: [3, 4] };
    });
  }, []);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
        return;
      }
      setSortKey(key);
      setSortDirection(key === "business_name" ? "asc" : "desc");
    },
    [sortKey],
  );

  const openChannel = useCallback(
    (lead: Lead, channel: "website" | "instagram" | "whatsapp") => {
      const target =
        channel === "website"
          ? lead.website_url
          : channel === "instagram"
            ? lead.instagram_url
            : lead.whatsapp_business
              ? `https://wa.me/${lead.whatsapp_business.replace(/[^\d]/g, "")}`
              : null;
      if (!target) return;
      window.open(target, "_blank", "noopener,noreferrer");
    },
    [],
  );

  const focusOnMap = useCallback((lead: Lead) => {
    setSelectedId(lead.business_id);
    setView("map");
    requestAnimationFrame(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const exportCsv = useCallback(() => {
    downloadText("opportunity-radar-valparaiso.csv", "text/csv", leadsToCsv(sorted));
  }, [sorted]);

  const exportGeoJson = useCallback(() => {
    downloadText(
      "opportunity-radar-valparaiso.geojson",
      "application/geo+json",
      leadsToGeoJson(sorted),
    );
  }, [sorted]);

  return (
    <div className="min-h-screen bg-ink-950/80">
      <RadarTopBar
        view={view}
        onViewChange={setView}
        search={filters.search}
        onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
        onExportCsv={exportCsv}
        onExportGeoJson={exportGeoJson}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={activeFilterCount}
        visible={sorted}
      />

      <div className="flex">
        {/* Panel lateral de filtros — desktop */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[264px] shrink-0 border-r border-white/[0.07] lg:block">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            onReset={resetFilters}
            leads={leads}
            activeCount={activeFilterCount}
          />
        </aside>

        <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
          <section>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl text-paper md:text-3xl">Opportunity Radar</h1>
                <p className="mt-1 text-xs text-paper-dim/55">
                  Inteligencia comercial y geoespacial · {DATASET_META.region}
                </p>
              </div>
              <p className="hidden text-right text-[10px] leading-relaxed text-paper-dim/35 sm:block">
                Dataset piloto v{DATASET_META.version} · scores del documento canónico
                <br />
                sin recálculo en esta versión
              </p>
            </div>

            <KpiStrip
              metrics={metrics}
              totalUnfiltered={leads.length}
              onFocusVeryHigh={focusVeryHigh}
              onFocusHigh={focusHigh}
              onFocusNoWebsite={focusNoWebsite}
              activeShortcut={shortcut}
            />
          </section>

          {view === "map" ? (
            <section
              ref={mapSectionRef}
              className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"
            >
              <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-ink-900/30">
                <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-2">
                  <span className="mr-1 hidden text-[10px] uppercase tracking-widest2 text-paper-dim/40 sm:inline">
                    Capas
                  </span>
                  <ToolButton
                    onClick={() => setShowPins((value) => !value)}
                    active={showPins}
                    icon={<MapPin size={13} strokeWidth={1.6} />}
                    title="Mostrar u ocultar los marcadores"
                  >
                    Pins
                  </ToolButton>
                  <ToolButton
                    onClick={() => setShowHeat((value) => !value)}
                    active={showHeat}
                    icon={<Flame size={13} strokeWidth={1.6} />}
                    title="Mostrar u ocultar la densidad de oportunidad"
                  >
                    Densidad
                  </ToolButton>
                  <ToolButton
                    onClick={() => setFitNonce((value) => value + 1)}
                    icon={<Crosshair size={13} strokeWidth={1.6} />}
                    title="Encuadrar sobre los prospectos filtrados"
                  >
                    Encuadrar
                  </ToolButton>
                  <div className="ml-auto flex items-center gap-1.5">
                    <Layers size={13} strokeWidth={1.6} className="text-paper-dim/35" />
                    <Segmented<"dark" | "osm">
                      ariaLabel="Base cartográfica"
                      value={basemap}
                      onChange={setBasemap}
                      options={[
                        { value: "dark", label: "Oscuro" },
                        { value: "osm", label: "OSM" },
                      ]}
                    />
                  </div>
                </div>

                <div className="relative h-[420px] md:h-[520px] xl:h-[600px]">
                  <RadarMap
                    leads={filtered}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    showHeat={showHeat}
                    showPins={showPins}
                    basemap={basemap}
                    fitNonce={fitNonce}
                  />
                  {showHeat ? <HeatLegend /> : null}
                </div>

                <p className="border-t border-white/[0.06] px-3 py-2 text-[10px] leading-relaxed text-paper-dim/35">
                  La capa de densidad representa <strong className="text-paper-dim/55">densidad
                  territorial de oportunidades comerciales</strong> ponderada por Priority Score. No
                  es una predicción estadística de ventas ni una estimación de demanda.
                </p>
              </div>

              <div className="flex max-h-[720px] flex-col overflow-hidden rounded-lg border border-white/[0.07] bg-ink-900/30">
                <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
                  <div>
                    <p className="font-serif text-sm text-paper">Top Opportunities</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-widest2 text-paper-dim/40">
                      Orden descendente por Priority Score
                    </p>
                  </div>
                  <span className="shrink-0 rounded-sm bg-white/[0.05] px-1.5 py-0.5 text-[10px] tabular-nums text-paper-dim">
                    {ranking.length}
                  </span>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <RankingPanel
                    leads={ranking}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onOpenChannel={openChannel}
                  />
                </div>
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-lg border border-white/[0.07] bg-ink-900/30">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
                <div>
                  <p className="font-serif text-sm text-paper">Listado de prospectos</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-widest2 text-paper-dim/40">
                    Ordenamiento dinámico por columna
                  </p>
                </div>
                <span className="shrink-0 rounded-sm bg-white/[0.05] px-1.5 py-0.5 text-[10px] tabular-nums text-paper-dim">
                  {sorted.length}
                </span>
              </div>
              <LeadTable
                leads={sorted}
                selectedId={selectedId}
                onSelect={setSelectedId}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </section>
          )}

          <section>
            <DistributionPanel
              metrics={metrics}
              leads={filtered}
              activeNiches={filters.niches}
              activeCommunes={filters.communes}
              onSelectNiche={(niche) =>
                setFilters((current) => ({
                  ...current,
                  niches: current.niches.includes(niche)
                    ? current.niches.filter((item) => item !== niche)
                    : [...current.niches, niche],
                }))
              }
              onSelectCommune={(commune) =>
                setFilters((current) => ({
                  ...current,
                  communes: current.communes.includes(commune)
                    ? current.communes.filter((item) => item !== commune)
                    : [...current.communes, commune],
                }))
              }
            />
          </section>

          <footer className="rounded-lg border border-white/[0.07] bg-ink-900/20 px-4 py-4">
            <SectionLabel>Procedencia de los datos</SectionLabel>
            <p className="mb-2 text-[11px] leading-relaxed text-paper-dim/55">
              {source === "supabase" ? (
                <>
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#5FA463] align-middle" />
                  Los {leads.length} prospectos se están leyendo desde{" "}
                  <span className="text-paper-dim">Supabase</span> (tabla{" "}
                  <code className="font-mono text-[10px]">public.leads</code>).
                </>
              ) : (
                <>
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#C9A227] align-middle" />
                  Mostrando la <span className="text-paper-dim">copia local versionada</span> del
                  dataset: la base de datos no respondió o todavía no tiene la semilla aplicada.
                </>
              )}
            </p>
            <p className="text-[11px] leading-relaxed text-paper-dim/55">
              {DATASET_META.notes} Fuente canónica:{" "}
              <span className="text-paper-dim">{DATASET_META.sourceDocument}</span> (
              {DATASET_META.sourceTables.join(" · ")}). Cartografía base ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="text-paper-dim underline-offset-2 hover:text-gold hover:underline"
              >
                OpenStreetMap
              </a>{" "}
              y CARTO. Sólo se almacenan canales de contacto corporativos publicados por los propios
              establecimientos, conforme a la Ley N.º 19.628.
            </p>
          </footer>
        </main>
      </div>

      {/* Panel de filtros — móvil y tablet */}
      <AnimatePresence>
        {filtersOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 z-[55] bg-ink-950/70 backdrop-blur-[2px] lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Filtros"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-[56] flex w-[86%] max-w-[320px] flex-col border-r border-white/[0.08] bg-ink-950 lg:hidden"
            >
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Cerrar filtros"
                className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-paper-dim transition-colors duration-200 hover:bg-white/[0.05] hover:text-paper"
              >
                <X size={16} strokeWidth={1.6} />
              </button>
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
                leads={leads}
                activeCount={activeFilterCount}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <ProspectSheet
        lead={selectedLead}
        onClose={() => setSelectedId(null)}
        onFocusMap={focusOnMap}
      />
    </div>
  );
}

function HeatLegend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-md border border-white/[0.08] bg-ink-950/85 px-3 py-2 backdrop-blur-sm">
      <p className="text-[9px] uppercase tracking-widest text-paper-dim/45">
        Densidad de oportunidad
      </p>
      <div
        className="mt-1.5 h-1.5 w-32 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, rgba(46,106,148,0.7), rgba(91,141,184,0.85), #C9A227, #D67E33, #D9503F)",
        }}
      />
      <div className="mt-1 flex justify-between text-[9px] tabular-nums text-paper-dim/35">
        <span>baja</span>
        <span>extrema</span>
      </div>
    </div>
  );
}
