"use client";

import Link from "next/link";
import { ArrowLeft, Download, LayoutList, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import type { Lead } from "@/lib/radar/types";
import { Segmented, ToolButton } from "./ui";

export type RadarView = "map" | "list";

export default function RadarTopBar({
  view,
  onViewChange,
  search,
  onSearchChange,
  onExportCsv,
  onExportGeoJson,
  onOpenFilters,
  activeFilterCount,
  visible,
}: {
  view: RadarView;
  onViewChange: (view: RadarView) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onExportCsv: () => void;
  onExportGeoJson: () => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  visible: Lead[];
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-ink-950/92 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <Link
          href="/"
          className="group inline-flex shrink-0 items-center gap-2 text-paper-dim transition-colors duration-300 hover:text-gold"
          title="Volver a la landing"
        >
          <ArrowLeft
            size={16}
            strokeWidth={1.6}
            className="transition-transform duration-300 group-hover:-translate-x-0.5"
          />
          <span className="hidden font-serif text-sm sm:inline">Vicente Jara</span>
        </Link>

        <span className="hidden h-5 w-px bg-white/10 sm:block" aria-hidden="true" />

        <div className="hidden min-w-0 lg:block">
          <p className="truncate font-serif text-sm text-paper">Opportunity Radar</p>
          <p className="truncate text-[10px] uppercase tracking-widest2 text-gold/60">
            Región de Valparaíso
          </p>
        </div>

        <div className="relative ml-auto w-full max-w-xs flex-1 lg:ml-6">
          <Search
            size={14}
            strokeWidth={1.6}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-paper-dim/40"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar negocio, dirección o comuna…"
            aria-label="Buscar prospecto"
            className="w-full rounded-md border border-white/[0.07] bg-white/[0.02] py-2 pl-9 pr-8 text-xs text-paper placeholder:text-paper-dim/35 transition-colors duration-200 focus:border-gold/40 focus:outline-none"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-paper-dim/40 transition-colors duration-200 hover:text-paper"
            >
              <X size={12} strokeWidth={1.8} />
            </button>
          ) : null}
        </div>

        <div className="hidden shrink-0 md:block">
          <Segmented<RadarView>
            ariaLabel="Cambiar vista"
            value={view}
            onChange={onViewChange}
            options={[
              { value: "map", label: "Mapa", icon: <MapIcon size={13} strokeWidth={1.6} /> },
              { value: "list", label: "Listado", icon: <LayoutList size={13} strokeWidth={1.6} /> },
            ]}
          />
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
          <ToolButton
            onClick={onExportCsv}
            icon={<Download size={13} strokeWidth={1.6} />}
            disabled={!visible.length}
            title="Descargar la selección visible en CSV"
          >
            CSV
          </ToolButton>
          <ToolButton
            onClick={onExportGeoJson}
            icon={<Download size={13} strokeWidth={1.6} />}
            disabled={!visible.length}
            title="Descargar la selección visible en GeoJSON"
          >
            GeoJSON
          </ToolButton>
        </div>

        <button
          type="button"
          onClick={onOpenFilters}
          className="relative shrink-0 rounded-md border border-white/[0.07] bg-white/[0.02] p-2 text-paper-dim transition-colors duration-200 hover:border-gold/40 hover:text-gold lg:hidden"
          aria-label="Abrir filtros"
        >
          <SlidersHorizontal size={15} strokeWidth={1.6} />
          {activeFilterCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-medium tabular-nums text-ink-950">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="flex items-center gap-2 border-t border-white/[0.05] px-4 py-2 md:hidden">
        <Segmented<RadarView>
          ariaLabel="Cambiar vista"
          value={view}
          onChange={onViewChange}
          options={[
            { value: "map", label: "Mapa", icon: <MapIcon size={13} strokeWidth={1.6} /> },
            { value: "list", label: "Listado", icon: <LayoutList size={13} strokeWidth={1.6} /> },
          ]}
        />
        <div className="ml-auto flex items-center gap-1.5">
          <ToolButton
            onClick={onExportCsv}
            icon={<Download size={13} strokeWidth={1.6} />}
            disabled={!visible.length}
            title="Descargar CSV"
          >
            CSV
          </ToolButton>
        </div>
      </div>
    </header>
  );
}
