/**
 * Capa de densidad territorial sobre Leaflet, dibujada en un canvas propio.
 *
 * Representa densidad de oportunidades comerciales ponderada por
 * priority_score — NO es una predicción estadística de ventas.
 *
 * Se implementa a mano (en vez de leaflet.heat) para no añadir dependencias
 * sin tipos y para poder ponderar cada punto por su score.
 */
import type { LatLngExpression, Map as LeafletMap } from "leaflet";

type Leaflet = typeof import("leaflet");

export type HeatPoint = { lat: number; lng: number; weight: number };

export type HeatLayerHandle = {
  addTo: (map: LeafletMap) => void;
  remove: () => void;
  setPoints: (points: HeatPoint[]) => void;
};

/** Rampa fría → cálida, sobria y legible sobre base oscura. */
const GRADIENT: [number, string][] = [
  [0.0, "rgba(28, 60, 92, 0)"],
  [0.25, "rgba(46, 106, 148, 0.55)"],
  [0.45, "rgba(91, 141, 184, 0.72)"],
  [0.65, "rgba(201, 162, 39, 0.80)"],
  [0.82, "rgba(214, 126, 51, 0.86)"],
  [1.0, "rgba(217, 80, 63, 0.92)"],
];

function buildGradientRamp() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8ClampedArray(256 * 4);

  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  for (const [stop, color] of GRADIENT) gradient.addColorStop(stop, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1, 256);

  return ctx.getImageData(0, 0, 1, 256).data;
}

/** Punto estampado como gradiente radial en escala de alfa. */
function buildStamp(radius: number, blur: number) {
  const canvas = document.createElement("canvas");
  const size = radius + blur;
  canvas.width = size * 2;
  canvas.height = size * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const gradient = ctx.createRadialGradient(size, size, 0, size, size, size);
  gradient.addColorStop(0, "rgba(0,0,0,1)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size, size, size, 0, Math.PI * 2, false);
  ctx.fill();

  return canvas;
}

/** Radio en píxeles: crece con el zoom para que la mancha siga siendo territorial. */
function radiusForZoom(zoom: number) {
  if (zoom <= 9) return 16;
  if (zoom <= 11) return 26;
  if (zoom <= 13) return 40;
  if (zoom <= 15) return 58;
  return 76;
}

export function createHeatLayer(L: Leaflet, initialPoints: HeatPoint[]): HeatLayerHandle {
  let points = initialPoints;
  let ramp: Uint8ClampedArray | null = null;

  const HeatLayer = L.Layer.extend({
    onAdd(this: Record<string, unknown>, map: LeafletMap) {
      const canvas = L.DomUtil.create("canvas", "radar-heat-canvas") as HTMLCanvasElement;
      canvas.style.position = "absolute";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "199";
      (this as { _canvas: HTMLCanvasElement })._canvas = canvas;
      (this as { _map: LeafletMap })._map = map;

      map.getPanes().overlayPane?.appendChild(canvas);
      map.on("moveend zoomend resize", (this as { _reset: () => void })._reset, this);
      (this as { _reset: () => void })._reset();
    },

    onRemove(this: Record<string, unknown>, map: LeafletMap) {
      const canvas = (this as { _canvas?: HTMLCanvasElement })._canvas;
      canvas?.remove();
      map.off("moveend zoomend resize", (this as { _reset: () => void })._reset, this);
    },

    _reset(this: Record<string, unknown>) {
      const map = (this as { _map?: LeafletMap })._map;
      const canvas = (this as { _canvas?: HTMLCanvasElement })._canvas;
      if (!map || !canvas) return;

      const size = map.getSize();
      const topLeft = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(canvas, topLeft);
      canvas.width = size.x;
      canvas.height = size.y;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;

      (this as { _draw: () => void })._draw();
    },

    _draw(this: Record<string, unknown>) {
      const map = (this as { _map?: LeafletMap })._map;
      const canvas = (this as { _canvas?: HTMLCanvasElement })._canvas;
      if (!map || !canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!points.length) return;

      const zoom = map.getZoom();
      const radius = radiusForZoom(zoom);
      const blur = Math.round(radius * 0.6);
      const stamp = buildStamp(radius, blur);
      const half = stamp.width / 2;

      const maxWeight = Math.max(...points.map((p) => p.weight), 1);

      for (const point of points) {
        const pixel = map.latLngToContainerPoint([point.lat, point.lng] as LatLngExpression);
        if (
          pixel.x < -half ||
          pixel.y < -half ||
          pixel.x > canvas.width + half ||
          pixel.y > canvas.height + half
        ) {
          continue;
        }
        // Peso normalizado y suavizado: evita que un solo punto sature la celda.
        ctx.globalAlpha = Math.min(1, Math.max(0.12, (point.weight / maxWeight) ** 1.6));
        ctx.drawImage(stamp, pixel.x - half, pixel.y - half);
      }
      ctx.globalAlpha = 1;

      if (!ramp) ramp = buildGradientRamp();

      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = image.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3];
        if (alpha === 0) continue;
        const offset = alpha * 4;
        pixels[i] = ramp[offset];
        pixels[i + 1] = ramp[offset + 1];
        pixels[i + 2] = ramp[offset + 2];
        pixels[i + 3] = Math.round(alpha * 0.85);
      }
      ctx.putImageData(image, 0, 0);
    },
  });

  const layer = new (HeatLayer as unknown as new () => {
    addTo: (map: LeafletMap) => void;
    remove: () => void;
    _reset?: () => void;
    _map?: LeafletMap;
  })();

  return {
    addTo: (map) => layer.addTo(map),
    remove: () => layer.remove(),
    setPoints: (next) => {
      points = next;
      if (layer._map) layer._reset?.();
    },
  };
}
