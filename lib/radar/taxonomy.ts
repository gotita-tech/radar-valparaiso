/**
 * Etiquetas, umbrales y paletas derivadas del documento canónico.
 * Todo lo que aquí aparece está definido en el suministro; no hay
 * interpretación libre de rangos ni de clasificaciones.
 */
import type {
  DataFlag,
  Niche,
  PriorityTier,
  ScoreDimension,
  WebsiteClassification,
} from "./types";

export const NICHE_LABEL: Record<Niche, string> = {
  barbershop: "Barbería",
  restaurant: "Restaurante",
  bar: "Bar",
  boutique: "Boutique",
};

/** § "Sistema de Clasificación de Presencia Web" (0 a 4). */
export const WEB_CLASS: Record<
  WebsiteClassification,
  { key: string; label: string; short: string; description: string }
> = {
  0: {
    key: "GOOD",
    label: "Buena web",
    short: "GOOD",
    description:
      "Sitio propio activo, dominio personalizado, HTTPS, diseño responsive y llamadas a la acción claras.",
  },
  1: {
    key: "IMPROVABLE",
    label: "Mejorable",
    short: "IMPROVABLE",
    description:
      "Sitio propio con deficiencias técnicas o de diseño relevantes: sin HTTPS, sin responsividad, lento o desactualizado.",
  },
  2: {
    key: "MINIMAL",
    label: "Mínima",
    short: "MINIMAL",
    description:
      "Presencia extremadamente básica: mono-página sin contenido transaccional o plantilla genérica sin configurar.",
  },
  3: {
    key: "SOCIAL_ONLY",
    label: "Sólo redes",
    short: "SOCIAL_ONLY",
    description:
      "Sin sitio propio. Opera exclusivamente vía redes sociales o perfiles en agregadores de terceros.",
  },
  4: {
    key: "NO_WEBSITE_FOUND",
    label: "Sin web detectada",
    short: "NO_WEBSITE_FOUND",
    description:
      "No se localizó sitio propio ni perfil digital tras agotar los protocolos de búsqueda. Ausencia no detectada, no certeza de inexistencia.",
  },
};

export const WEB_CLASS_ORDER: WebsiteClassification[] = [0, 1, 2, 3, 4];

/** § "Rangos de Prioridad Comercial". */
export const TIER: Record<
  PriorityTier,
  { label: string; range: string; action: string; color: string; soft: string }
> = {
  VERY_HIGH: {
    label: "VERY HIGH",
    range: "85 – 100",
    action: "Oportunidad crítica. Asignación inmediata a ejecutivos de cierre.",
    color: "#D9503F",
    soft: "rgba(217, 80, 63, 0.14)",
  },
  HIGH: {
    label: "HIGH",
    range: "75 – 84",
    action: "Oportunidad alta. Prioridad para contacto comercial directo.",
    color: "#C9A227",
    soft: "rgba(201, 162, 39, 0.14)",
  },
  GOOD: {
    label: "GOOD",
    range: "60 – 74",
    action: "Oportunidad buena. Candidato a secuencias automatizadas.",
    color: "#5B8DB8",
    soft: "rgba(91, 141, 184, 0.14)",
  },
  MEDIUM: {
    label: "MEDIUM",
    range: "40 – 59",
    action: "Oportunidad media. Prospección secundaria.",
    color: "#8A8A8A",
    soft: "rgba(138, 138, 138, 0.12)",
  },
  LOW: {
    label: "LOW",
    range: "0 – 39",
    action: "Oportunidad baja. Descartar de campañas activas.",
    color: "#5A5A5A",
    soft: "rgba(90, 90, 90, 0.12)",
  },
};

export const TIER_ORDER: PriorityTier[] = ["VERY_HIGH", "HIGH", "GOOD", "MEDIUM", "LOW"];

/** § "Algoritmo del Priority Score" — máximos por dimensión. */
export const DIMENSION: Record<
  ScoreDimension,
  { label: string; max: number; description: string }
> = {
  digital_need: {
    label: "Digital Need",
    max: 40,
    description:
      "Estado de presencia web, carencias de conversión (reservas, menú/catálogo, WhatsApp) y deficiencia técnica.",
  },
  commercial_attractiveness: {
    label: "Commercial Attractiveness",
    max: 25,
    description:
      "Reputación y demanda por percentil de reseñas, calidad reputacional, actividad digital y robustez aparente.",
  },
  contactability: {
    label: "Contactability",
    max: 15,
    description:
      "Canales corporativos públicos disponibles: email empresarial, WhatsApp Business, teléfono o formulario.",
  },
  landing_fit: {
    label: "Landing Fit",
    max: 10,
    description:
      "Valor práctico que aporta una landing page profesional al rubro del negocio.",
  },
  local_opportunity: {
    label: "Local Opportunity",
    max: 10,
    description:
      "Concentración territorial en ejes comerciales estratégicos y brecha competitiva en un radio de 500 m.",
  },
};

export const DIMENSION_ORDER: ScoreDimension[] = [
  "digital_need",
  "commercial_attractiveness",
  "contactability",
  "landing_fit",
  "local_opportunity",
];

export const SOURCE_LABEL: Record<string, string> = {
  agendapro: "AgendaPro",
  fresha: "Fresha",
  direct: "Sitio web del negocio",
  delivery_app: "Aplicación de delivery",
  social_news: "Prensa / redes sociales",
  osm: "OpenStreetMap",
};

/** Advertencias de auditoría sobre el dato, no sobre el negocio. */
export const DATA_FLAG: Record<DataFlag, string> = {
  placeholder_phone:
    "El teléfono y el WhatsApp de este registro provienen del fragmento de ejemplo del documento canónico y tienen forma de número de relleno (+56 9 1234 5678). No los uses para contactar: verifica el número real antes de cualquier gestión.",
};

export function tierOf(score: number) {
  if (score >= 85) return "VERY_HIGH" as const;
  if (score >= 75) return "HIGH" as const;
  if (score >= 60) return "GOOD" as const;
  if (score >= 40) return "MEDIUM" as const;
  return "LOW" as const;
}

export function sourceLabel(key: string) {
  return SOURCE_LABEL[key] ?? key;
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
