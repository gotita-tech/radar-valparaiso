"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { TIER } from "@/lib/radar/taxonomy";
import type { Lead } from "@/lib/radar/types";

/**
 * Mapa localizador de un único prospecto. Comparte base cartográfica y estilo
 * con el mapa del Radar (CARTO sobre datos de OpenStreetMap, sin token).
 */
export default function LocatorMap({ lead }: { lead: Lead }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (lead.latitude === null || lead.longitude === null) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const position: [number, number] = [lead.latitude as number, lead.longitude as number];
      const map = L.map(containerRef.current, {
        center: position,
        zoom: 16,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
        dragging: true,
        preferCanvas: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      map.attributionControl.setPrefix("");
      L.control.zoom({ position: "bottomright" }).addTo(map);

      const color = TIER[lead.priority_tier].color;
      L.circleMarker(position, {
        radius: 9,
        color: "#F5F5F5",
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindTooltip(lead.business_name, {
          direction: "top",
          offset: [0, -10],
          className: "radar-tooltip",
          permanent: false,
        });

      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lead]);

  if (lead.latitude === null || lead.longitude === null) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-md border border-white/[0.06] bg-ink-950/60 px-6 text-center">
        <p className="text-[11px] leading-relaxed text-paper-dim/40">
          El dataset no registra coordenadas para este prospecto.
        </p>
      </div>
    );
  }

  return (
    <div className="radar-map relative h-[200px] overflow-hidden rounded-md border border-white/[0.06]">
      <div ref={containerRef} className="h-full w-full" />
      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-950">
          <span className="text-[11px] text-paper-dim/40">Cargando ubicación…</span>
        </div>
      ) : null}
    </div>
  );
}
