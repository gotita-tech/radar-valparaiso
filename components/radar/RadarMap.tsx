"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { createHeatLayer, type HeatLayerHandle } from "./heat-layer";
import { NICHE_LABEL, TIER, WEB_CLASS } from "@/lib/radar/taxonomy";
import type { Lead } from "@/lib/radar/types";

type Basemap = "dark" | "osm";

type Props = {
  leads: Lead[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showHeat: boolean;
  showPins: boolean;
  basemap: Basemap;
  fitNonce: number;
};

const REGION_CENTER: [number, number] = [-33.01, -71.56];
const CLUSTER_CELL = 56;

const TILE_CONFIG: Record<Basemap, { url: string; attribution: string }> = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

function markerRadius(score: number) {
  return Math.max(5, Math.min(11, 5 + (score - 50) / 7));
}

export default function RadarMap({
  leads,
  selectedId,
  onSelect,
  showHeat,
  showPins,
  basemap,
  fitNonce,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const tileRef = useRef<TileLayer | null>(null);
  const markerGroupRef = useRef<import("leaflet").LayerGroup | null>(null);
  const heatRef = useRef<HeatLayerHandle | null>(null);
  const markerIndexRef = useRef<Map<string, import("leaflet").CircleMarker>>(new Map());

  const leadsRef = useRef(leads);
  const selectedRef = useRef(selectedId);
  const selectHandlerRef = useRef(onSelect);
  const showPinsRef = useRef(showPins);

  const [ready, setReady] = useState(false);
  const [wheelArmed, setWheelArmed] = useState(false);

  leadsRef.current = leads;
  selectedRef.current = selectedId;
  selectHandlerRef.current = onSelect;
  showPinsRef.current = showPins;

  const buildPopup = useCallback((lead: Lead) => {
    const tier = TIER[lead.priority_tier];
    const root = document.createElement("div");
    root.className = "radar-popup";
    root.innerHTML = `
      <p class="radar-popup__eyebrow">${NICHE_LABEL[lead.niche]} &middot; ${lead.commune}</p>
      <p class="radar-popup__title">${lead.business_name}</p>
      ${lead.address ? `<p class="radar-popup__address">${lead.address}</p>` : ""}
      <div class="radar-popup__scores">
        <div>
          <span class="radar-popup__value" style="color:${tier.color}">${lead.priority_score}</span>
          <span class="radar-popup__label">Priority</span>
        </div>
        <div>
          <span class="radar-popup__value">${lead.confidence_score}</span>
          <span class="radar-popup__label">Confidence</span>
        </div>
        <div>
          <span class="radar-popup__tier" style="color:${tier.color};background:${tier.soft}">${tier.label}</span>
          <span class="radar-popup__label">${WEB_CLASS[lead.website_classification].label}</span>
        </div>
      </div>
    `;

    const action = document.createElement("button");
    action.type = "button";
    action.className = "radar-popup__action";
    action.textContent = "Ver ficha completa";
    action.addEventListener("click", () => selectHandlerRef.current(lead.business_id));
    root.appendChild(action);

    return root;
  }, []);

  /** Reagrupa y redibuja los marcadores para el zoom actual. */
  const redrawMarkers = useCallback(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const group = markerGroupRef.current;
    if (!L || !map || !group) return;

    group.clearLayers();
    markerIndexRef.current.clear();
    if (!showPinsRef.current) return;

    const positioned = leadsRef.current.filter(
      (lead) => lead.latitude !== null && lead.longitude !== null,
    );
    const zoom = map.getZoom();

    const buckets = new Map<string, Lead[]>();
    for (const lead of positioned) {
      const point = map.project([lead.latitude as number, lead.longitude as number], zoom);
      const key = `${Math.floor(point.x / CLUSTER_CELL)}:${Math.floor(point.y / CLUSTER_CELL)}`;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(lead);
      else buckets.set(key, [lead]);
    }

    for (const bucket of buckets.values()) {
      const selectedInBucket = bucket.find((l) => l.business_id === selectedRef.current);

      if (bucket.length > 1 && !selectedInBucket) {
        const lat =
          bucket.reduce((sum, l) => sum + (l.latitude as number), 0) / bucket.length;
        const lng =
          bucket.reduce((sum, l) => sum + (l.longitude as number), 0) / bucket.length;
        const top = bucket.reduce((best, l) =>
          l.priority_score > best.priority_score ? l : best,
        );
        const color = TIER[top.priority_tier].color;

        const cluster = L.marker([lat, lng], {
          icon: L.divIcon({
            className: "radar-cluster",
            html: `<span style="--cluster-color:${color}">${bucket.length}</span>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          }),
          keyboard: false,
        });
        cluster.bindTooltip(
          `${bucket.length} negocios &middot; máx. ${top.priority_score}`,
          { direction: "top", offset: [0, -14], className: "radar-tooltip" },
        );
        cluster.on("click", () => {
          const bounds = L.latLngBounds(
            bucket.map((l) => [l.latitude as number, l.longitude as number]),
          );
          map.flyToBounds(bounds.pad(0.6), { duration: 0.6, maxZoom: 17 });
        });
        group.addLayer(cluster);
        continue;
      }

      for (const lead of bucket) {
        const isSelected = lead.business_id === selectedRef.current;
        const color = TIER[lead.priority_tier].color;
        const marker = L.circleMarker(
          [lead.latitude as number, lead.longitude as number],
          {
            radius: markerRadius(lead.priority_score) + (isSelected ? 3 : 0),
            color: isSelected ? "#F5F5F5" : color,
            weight: isSelected ? 2 : 1.25,
            opacity: 1,
            fillColor: color,
            fillOpacity: isSelected ? 0.95 : 0.62,
            className: "radar-marker",
          },
        );

        marker.bindTooltip(
          `<strong>${lead.business_name}</strong><br/>${NICHE_LABEL[lead.niche]} &middot; ${lead.commune} &middot; ${lead.priority_score}`,
          { direction: "top", offset: [0, -8], className: "radar-tooltip" },
        );
        marker.bindPopup(() => buildPopup(lead), {
          className: "radar-popup-wrapper",
          closeButton: true,
          minWidth: 236,
          maxWidth: 268,
          offset: [0, -4],
        });

        group.addLayer(marker);
        markerIndexRef.current.set(lead.business_id, marker);
      }
    }
  }, [buildPopup]);

  // Inicialización única del mapa.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: REGION_CENTER,
        zoom: 12,
        zoomControl: false,
        attributionControl: true,
        preferCanvas: true,
        // El mapa ocupa buena parte de una página que se recorre con scroll:
        // la rueda queda desactivada hasta que el usuario hace clic en el mapa.
        scrollWheelZoom: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);
      map.attributionControl.setPrefix("");

      map.on("click focus", () => {
        map.scrollWheelZoom.enable();
        setWheelArmed(true);
      });
      map.on("mouseout", () => {
        map.scrollWheelZoom.disable();
        setWheelArmed(false);
      });

      const config = TILE_CONFIG.dark;
      const tiles = L.tileLayer(config.url, {
        attribution: config.attribution,
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      const group = L.layerGroup().addTo(map);

      leafletRef.current = L;
      mapRef.current = map;
      tileRef.current = tiles;
      markerGroupRef.current = group;

      map.on("zoomend", redrawMarkers);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.off("zoomend", redrawMarkers);
      mapRef.current?.remove();
      mapRef.current = null;
      markerGroupRef.current = null;
      heatRef.current = null;
      leafletRef.current = null;
      tileRef.current = null;
    };
  }, [redrawMarkers]);

  // Base cartográfica seleccionable (ambas gratuitas y sin token).
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    tileRef.current?.remove();
    const config = TILE_CONFIG[basemap];
    tileRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 19,
      subdomains: basemap === "dark" ? "abcd" : "abc",
    }).addTo(map);
  }, [basemap, ready]);

  // Marcadores y clustering según filtros y selección.
  useEffect(() => {
    if (!ready) return;
    redrawMarkers();
  }, [ready, leads, selectedId, showPins, redrawMarkers]);

  // Capa de densidad ponderada por priority_score.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    const points = leads
      .filter((lead) => lead.latitude !== null && lead.longitude !== null)
      .map((lead) => ({
        lat: lead.latitude as number,
        lng: lead.longitude as number,
        weight: lead.priority_score,
      }));

    if (!showHeat) {
      heatRef.current?.remove();
      heatRef.current = null;
      return;
    }

    if (!heatRef.current) {
      heatRef.current = createHeatLayer(L, points);
      heatRef.current.addTo(map);
    } else {
      heatRef.current.setPoints(points);
    }
  }, [ready, leads, showHeat]);

  // Encuadre sobre el conjunto filtrado.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    const positioned = leads.filter((l) => l.latitude !== null && l.longitude !== null);
    if (!positioned.length) {
      map.flyTo(REGION_CENTER, 11, { duration: 0.6 });
      return;
    }
    const bounds = L.latLngBounds(
      positioned.map((l) => [l.latitude as number, l.longitude as number]),
    );
    map.flyToBounds(bounds.pad(0.25), { duration: 0.7, maxZoom: 15 });
  }, [ready, fitNonce, leads]);

  // Centra y abre el popup del prospecto seleccionado desde otras vistas.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !selectedId) return;

    const lead = leads.find((l) => l.business_id === selectedId);
    if (!lead || lead.latitude === null || lead.longitude === null) return;

    map.flyTo([lead.latitude, lead.longitude], Math.max(map.getZoom(), 15), {
      duration: 0.6,
    });
  }, [ready, selectedId, leads]);

  // El contenedor cambia de tamaño al abrir/cerrar paneles.
  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const observer = new ResizeObserver(() => mapRef.current?.invalidateSize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <div className="radar-map relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {ready && !wheelArmed ? (
        <p className="pointer-events-none absolute bottom-3 right-14 z-[400] rounded-md border border-white/[0.08] bg-ink-950/85 px-2.5 py-1.5 text-[10px] text-paper-dim/45 backdrop-blur-sm">
          Haz clic en el mapa para habilitar el zoom con la rueda
        </p>
      ) : null}
      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-950">
          <div className="flex items-center gap-2 text-xs text-paper-dim/60">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-gold" />
            Cargando cartografía…
          </div>
        </div>
      ) : null}
    </div>
  );
}
