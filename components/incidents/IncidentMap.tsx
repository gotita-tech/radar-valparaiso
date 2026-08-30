"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, CircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { INCIDENT_SEVERITY_COLORS, type Incident } from "@/lib/incidents/types";

/**
 * Mapa del radar ciudadano.
 *
 * Misma base cartográfica que el radar comercial —CARTO sobre OpenStreetMap,
 * sin token ni servicio de pago— y el mismo patrón de montaje: Leaflet se
 * importa dinámicamente porque toca `window` al cargarse.
 */

const REGION_CENTER: [number, number] = [-33.03, -71.55];
const REGION_ZOOM = 12;

type Props = {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Con `onPick` activo, un clic en el mapa elige coordenadas en vez de deseleccionar. */
  onPick?: (coords: { latitude: number; longitude: number }) => void;
  pickedPoint?: { latitude: number; longitude: number } | null;
};

function radiusFor(incident: Incident) {
  return incident.is_verified ? 9 : 7;
}

export default function IncidentMap({
  incidents,
  selectedId,
  onSelect,
  onPick,
  pickedPoint,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const markerGroupRef = useRef<LayerGroup | null>(null);
  const pickMarkerRef = useRef<CircleMarker | null>(null);

  // Los handlers se leen desde una ref para que el efecto de montaje no dependa
  // de ellos: volver a crear el mapa en cada render sería un desastre visual.
  const pickHandlerRef = useRef(onPick);
  const selectHandlerRef = useRef(onSelect);
  pickHandlerRef.current = onPick;
  selectHandlerRef.current = onSelect;

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: REGION_CENTER,
        zoom: REGION_ZOOM,
        zoomControl: false,
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

      map.on("click", (event: import("leaflet").LeafletMouseEvent) => {
        const pick = pickHandlerRef.current;
        if (!pick) return;
        pick({ latitude: event.latlng.lat, longitude: event.latlng.lng });
      });

      leafletRef.current = L;
      markerGroupRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerGroupRef.current = null;
      pickMarkerRef.current = null;
    };
  }, []);

  // Marcadores. Se redibujan enteros cuando cambia la lista: con decenas de
  // incidentes es más simple y más barato que reconciliar capa por capa.
  useEffect(() => {
    const L = leafletRef.current;
    const group = markerGroupRef.current;
    if (!ready || !L || !group) return;

    group.clearLayers();

    for (const incident of incidents) {
      const color = INCIDENT_SEVERITY_COLORS[incident.severity];

      const marker = L.circleMarker([incident.latitude, incident.longitude], {
        radius: radiusFor(incident),
        color: incident.id === selectedId ? "#F5F5F5" : color,
        weight: incident.id === selectedId ? 2.5 : 1.5,
        fillColor: color,
        fillOpacity: incident.status === "resolved" ? 0.25 : 0.75,
      });

      marker.bindTooltip(incident.title, {
        direction: "top",
        offset: [0, -10],
        className: "radar-tooltip",
      });

      marker.on("click", (event) => {
        // Sin esto el clic llega también al mapa y, en modo selección de punto,
        // movería la chincheta al pinchar un incidente existente.
        L.DomEvent.stopPropagation(event);
        selectHandlerRef.current(incident.id);
      });

      marker.addTo(group);
    }
  }, [incidents, selectedId, ready]);

  // Chincheta del punto elegido en el formulario.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    pickMarkerRef.current?.remove();
    pickMarkerRef.current = null;

    if (!pickedPoint) return;

    pickMarkerRef.current = L.circleMarker(
      [pickedPoint.latitude, pickedPoint.longitude],
      {
        radius: 10,
        color: "#F5F5F5",
        weight: 2,
        fillColor: "#C9A227",
        fillOpacity: 0.85,
      },
    ).addTo(map);
  }, [pickedPoint, ready]);

  // Centrar sobre el incidente abierto en la ficha.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !selectedId) return;

    const incident = incidents.find((item) => item.id === selectedId);
    if (!incident) return;

    map.panTo([incident.latitude, incident.longitude], { animate: true });
  }, [selectedId, incidents, ready]);

  return (
    <div className="radar-map relative h-full w-full">
      <div
        ref={containerRef}
        className={`h-full w-full ${onPick ? "cursor-crosshair" : ""}`}
      />
      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-900/60">
          <span className="text-xs text-paper-dim/40">Preparando el mapa…</span>
        </div>
      ) : null}
      {onPick ? (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[400] -translate-x-1/2 rounded-md border border-gold/30 bg-ink-950/90 px-3 py-1.5 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-widest text-gold/80">
            Pincha en el mapa para situar el incidente
          </p>
        </div>
      ) : null}
    </div>
  );
}
