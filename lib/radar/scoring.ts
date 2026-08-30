/**
 * Motor de scoring.
 *
 * Implementa el § "Algoritmo del Priority Score" y el § "Confidence Score
 * Separado" de `docs/Radar-de-Oportunidades-Valparaiso.docx`. Cada constante de
 * este archivo sale del documento; no hay ponderaciones inventadas.
 *
 * Hasta ahora el dataset copiaba los scores del documento a mano, y por eso
 * eran 15 registros. Con el motor, la investigación aporta **hechos
 * observables** y los cinco sub-scores, el tier y la explicabilidad se derivan.
 *
 * Dos decisiones que conviene tener presentes:
 *
 * 1. **Los 15 originales no se recalculan.** Sus scores son los del documento y
 *    se conservan tal cual (`scoring_source: "document"`). El motor sólo puntúa
 *    lo que se incorpore a partir de ahora.
 * 2. **El scoring necesita el conjunto entero, no un lead suelto.** El percentil
 *    de reseñas se normaliza dentro del mismo nicho y comuna, y la brecha
 *    competitiva mira a 500 m. Por eso la entrada es `scoreDataset(...)`.
 */
import type {
  Lead,
  Niche,
  PriorityTier,
  ScoreExplanation,
  WebsiteClassification,
} from "./types";
import { tierOf } from "./taxonomy.ts";

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

/** Campos que produce el motor. Todo lo demás es observación. */
export type ScoreField =
  | "digital_need_score"
  | "commercial_attractiveness_score"
  | "contactability_score"
  | "landing_fit_score"
  | "local_opportunity_score"
  | "priority_score"
  | "confidence_score"
  | "priority_tier"
  | "score_explanations";

export type LeadFacts = Omit<Lead, ScoreField>;

export type SocialRecency = "last_7_days" | "last_30_days" | "inactive" | "unknown";
export type CrossSourceMatch = "exact" | "minor_discrepancies" | "unknown";

/**
 * Señales que el esquema canónico no guarda pero el algoritmo necesita.
 *
 * Son observaciones de auditoría: las aporta quien investiga, mirando el sitio
 * y los perfiles. `null` significa "no comprobado" y **nunca** suma puntos.
 */
export type LeadAudit = {
  /** Deficiencia técnica (§ A). Sólo aplica si el negocio tiene web. */
  mobile_friendly: boolean | null;
  https: boolean | null;
  essential_info_easy: boolean | null;

  /** Actividad digital comercial (§ B). */
  social_recency: SocialRecency;

  /** Robustez aparente (§ B). */
  physical_location_verified: boolean | null;
  established_over_2_years: boolean | null;

  /** Confidence Score. */
  independent_sources: number;
  verified_at: string;
  cross_source_match: CrossSourceMatch;
};

export type LeadObservation = LeadFacts & { audit: LeadAudit };

// ---------------------------------------------------------------------------
// Constantes del documento
// ---------------------------------------------------------------------------

/** § A — "Estado de Presencia Web (Máx. 25 pts)". */
const WEB_PRESENCE_POINTS: Record<WebsiteClassification, number> = {
  4: 25, // NO_WEBSITE_FOUND
  3: 22, // SOCIAL_ONLY
  2: 16, // MINIMAL
  1: 9, // IMPROVABLE
  0: 0, // GOOD
};

/**
 * § D — "Landing-Page Fit".
 *
 * La prosa da rangos (restaurante 9–10, bar 7–8, boutique 5–6) pero la
 * implementación de referencia del mismo documento fija un valor único por
 * nicho. Se sigue la referencia: desempata sin abrir la puerta a criterio libre.
 */
const LANDING_FIT_POINTS: Record<Niche, number> = {
  barbershop: 10,
  restaurant: 9,
  bar: 8,
  boutique: 5,
};

/**
 * § E — "Concentración Territorial". Ejes citados literalmente en el documento.
 *
 * Se comparan normalizados (sin tildes, en minúsculas) contra `address`.
 */
const STRATEGIC_AXES: { commune: string; needle: string; label: string }[] = [
  { commune: "Viña del Mar", needle: "libertad", label: "Av. Libertad" },
  { commune: "Viña del Mar", needle: "valparaiso", label: "Calle Valparaíso" },
  { commune: "Valparaíso", needle: "cerro alegre", label: "Cerro Alegre" },
  { commune: "Valparaíso", needle: "argentina", label: "Av. Argentina" },
  { commune: "Concón", needle: "borgono", label: "Av. Borgoño" },
];

const COMPETITOR_RADIUS_METERS = 500;

/** Cohorte mínima para que un percentil signifique algo. */
const MIN_COHORT_FOR_PERCENTILE = 3;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Distancia en metros entre dos puntos. Haversine, sin dependencias. */
export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Teléfono móvil chileno: +569XXXXXXXX. El fijo lleva código de área (+5632…).
 * Sirve para no pagar dos veces el mismo canal en § C.
 */
function isChileanMobile(phone: string | null): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return /^569\d{8}$/.test(digits);
}

function sameNumber(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a.replace(/\D/g, "") === b.replace(/\D/g, "");
}

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(value, max));
}

// ---------------------------------------------------------------------------
// A. Digital Need (máx. 40)
// ---------------------------------------------------------------------------

function digitalNeed(lead: LeadObservation, out: ScoreExplanation[]): number {
  const dimension = "digital_need" as const;
  let total = 0;

  const presence = WEB_PRESENCE_POINTS[lead.website_classification];
  if (presence > 0) {
    total += presence;
    out.push({
      dimension,
      points: presence,
      label:
        lead.website_classification === 4
          ? "Sin sitio propio detectado"
          : lead.website_classification === 3
            ? "Opera sólo en redes sociales o agregadores"
            : lead.website_classification === 2
              ? "Presencia web mínima, sin contenido transaccional"
              : "Sitio propio con deficiencias relevantes",
    });
  }

  // Carencias de conversión (máx. 10).
  let conversion = 0;
  if (!lead.online_booking && (lead.niche === "barbershop" || lead.niche === "restaurant")) {
    conversion += 4;
    out.push({ dimension, points: 4, label: "Sin sistema de reservas propio" });
  }
  if (!lead.online_menu && !lead.online_catalog) {
    conversion += 3;
    out.push({ dimension, points: 3, label: "Sin menú ni catálogo digital estructurado" });
  }
  if (!lead.whatsapp_business) {
    conversion += 3;
    out.push({ dimension, points: 3, label: "Sin canal visible de WhatsApp Business" });
  }
  total += clamp(conversion, 10);

  /*
   * Deficiencia técnica (máx. 5). Sólo se evalúa si hay web que evaluar: un
   * negocio sin sitio ya cobró los 25 puntos de presencia, y penalizarlo además
   * por "no ser responsive" contaría dos veces la misma carencia.
   */
  if (lead.has_website) {
    let technical = 0;
    if (lead.audit.mobile_friendly === false) {
      technical += 2;
      out.push({ dimension, points: 2, label: "Sin versión móvil adaptativa" });
    }
    if (lead.audit.https === false) {
      technical += 2;
      out.push({ dimension, points: 2, label: "Sin certificado SSL/HTTPS" });
    }
    if (lead.audit.essential_info_easy === false) {
      technical += 1;
      out.push({ dimension, points: 1, label: "Horarios o ubicación difíciles de encontrar" });
    }
    total += clamp(technical, 5);
  }

  return clamp(total, 40);
}

// ---------------------------------------------------------------------------
// B. Commercial Attractiveness (máx. 25)
// ---------------------------------------------------------------------------

/**
 * Percentil del volumen de reseñas dentro del mismo nicho y comuna.
 *
 * Con menos de tres comparables el percentil no dice nada, así que se cae a los
 * umbrales absolutos de la implementación de referencia del documento
 * (>150, >50, >10). Es el mismo criterio, sin fingir una cohorte que no existe.
 */
function reputationDemand(
  lead: LeadObservation,
  cohort: LeadObservation[],
  out: ScoreExplanation[],
): number {
  const dimension = "commercial_attractiveness" as const;
  const reviews = lead.review_count ?? 0;

  if (cohort.length >= MIN_COHORT_FOR_PERCENTILE) {
    const below = cohort.filter((other) => (other.review_count ?? 0) < reviews).length;
    const percentile = (below / (cohort.length - 1)) * 100;

    const points = percentile > 80 ? 10 : percentile >= 60 ? 8 : percentile >= 40 ? 5 : 2;
    out.push({
      dimension,
      points,
      label: `Volumen de reseñas en el percentil ${Math.round(percentile)} de su nicho y comuna`,
    });
    return points;
  }

  const points = reviews > 150 ? 10 : reviews > 50 ? 7 : reviews > 10 ? 4 : 2;
  out.push({
    dimension,
    points,
    label: `${reviews} reseñas (umbral absoluto: cohorte insuficiente para percentil)`,
  });
  return points;
}

function commercialAttractiveness(
  lead: LeadObservation,
  cohort: LeadObservation[],
  out: ScoreExplanation[],
): number {
  const dimension = "commercial_attractiveness" as const;
  let total = reputationDemand(lead, cohort, out);

  // Calidad reputacional (máx. 5).
  const rating = lead.rating;
  if (rating !== null) {
    const points = rating >= 4.5 ? 5 : rating >= 4.0 ? 3 : 1;
    total += points;
    out.push({ dimension, points, label: `Rating ${rating.toFixed(1)}` });
  }

  // Actividad digital comercial (máx. 5).
  const activity =
    lead.audit.social_recency === "last_7_days"
      ? 5
      : lead.audit.social_recency === "last_30_days"
        ? 3
        : 0;
  if (activity > 0) {
    total += activity;
    out.push({
      dimension,
      points: activity,
      label:
        lead.audit.social_recency === "last_7_days"
          ? "Publicaciones en redes en los últimos 7 días"
          : "Publicaciones en redes en el último mes",
    });
  }

  // Robustez aparente (máx. 5).
  let robustness = 0;
  if (lead.audit.physical_location_verified) {
    robustness += 3;
    out.push({ dimension, points: 3, label: "Local físico verificado en zona comercial" });
  }
  if (lead.audit.established_over_2_years || lead.multiple_locations) {
    robustness += 2;
    out.push({
      dimension,
      points: 2,
      label: lead.multiple_locations ? "Múltiples sucursales" : "Más de 2 años operando",
    });
  }
  total += clamp(robustness, 5);

  return clamp(total, 25);
}

// ---------------------------------------------------------------------------
// C. Contactability (máx. 15)
// ---------------------------------------------------------------------------

function contactability(lead: LeadObservation, out: ScoreExplanation[]): number {
  const dimension = "contactability" as const;
  let total = 0;

  if (lead.public_business_email) {
    total += 6;
    out.push({ dimension, points: 6, label: "Correo empresarial público verificado" });
  }

  const hasMobileChannel =
    Boolean(lead.whatsapp_business) || isChileanMobile(lead.public_business_phone);

  if (hasMobileChannel) {
    total += 5;
    out.push({ dimension, points: 5, label: "WhatsApp Business o móvil corporativo" });
  }

  /*
   * Tercer canal. El documento nota que no se duplican puntos por el mismo
   * canal: si el "fijo" es literalmente el mismo número que el WhatsApp, no
   * cuenta. Instagram entra aquí como canal de contacto activo, igual que en la
   * implementación de referencia.
   */
  const landline =
    lead.public_business_phone &&
    !isChileanMobile(lead.public_business_phone) &&
    !sameNumber(lead.public_business_phone, lead.whatsapp_business);

  if (landline) {
    total += 4;
    out.push({ dimension, points: 4, label: "Teléfono fijo corporativo verificado" });
  } else if (lead.instagram_url) {
    total += 4;
    out.push({ dimension, points: 4, label: "Perfil de Instagram como canal activo" });
  }

  return clamp(total, 15);
}

// ---------------------------------------------------------------------------
// D. Landing Fit (máx. 10)
// ---------------------------------------------------------------------------

function landingFit(lead: LeadObservation, out: ScoreExplanation[]): number {
  const points = LANDING_FIT_POINTS[lead.niche];
  out.push({
    dimension: "landing_fit",
    points,
    label:
      lead.niche === "barbershop"
        ? "Barbería: necesidad crítica de servicios, precios y agendamiento"
        : lead.niche === "restaurant"
          ? "Restaurante: menú visual, horarios y reservas directas"
          : lead.niche === "bar"
            ? "Bar: cartelera de eventos y reservas de mesa"
            : "Boutique: utilidad moderada sin e-commerce completo",
  });
  return points;
}

// ---------------------------------------------------------------------------
// E. Local Opportunity (máx. 10)
// ---------------------------------------------------------------------------

/**
 * Brecha competitiva.
 *
 * ATENCIÓN — el documento se contradice en este punto. Nombra la métrica como
 * "proporción de competidores que **carecen** de sitio web propio" y acto
 * seguido razona que "a mayor concentración de competidores **digitalizados**,
 * mayor es la presión y urgencia del prospecto por equipararse".
 *
 * Se implementa la segunda: es la que explica el porqué comercial y la que
 * produce un incentivo coherente (un negocio rodeado de competidores con web
 * tiene más urgencia, no menos). Queda aislada en esta función para que
 * invertirla sea cambiar una línea si se decide lo contrario.
 */
function competitiveGap(
  lead: LeadObservation,
  sameNiche: LeadObservation[],
  out: ScoreExplanation[],
): number {
  if (lead.latitude === null || lead.longitude === null) return 2;

  const origin = { latitude: lead.latitude, longitude: lead.longitude };

  const neighbours = sameNiche.filter((other) => {
    if (other.business_id === lead.business_id) return false;
    if (other.latitude === null || other.longitude === null) return false;
    return (
      distanceMeters(origin, {
        latitude: other.latitude,
        longitude: other.longitude,
      }) <= COMPETITOR_RADIUS_METERS
    );
  });

  if (neighbours.length === 0) {
    out.push({
      dimension: "local_opportunity",
      points: 2,
      label: "Sin competidores directos a 500 m: presión competitiva no establecida",
    });
    return 2;
  }

  const digitised = neighbours.filter((other) => other.has_website).length;
  const points = Math.round((digitised / neighbours.length) * 5);

  out.push({
    dimension: "local_opportunity",
    points,
    label: `${digitised} de ${neighbours.length} competidores a 500 m ya tienen web`,
  });

  return points;
}

function localOpportunity(
  lead: LeadObservation,
  sameNiche: LeadObservation[],
  out: ScoreExplanation[],
): number {
  let total = 0;

  const address = lead.address ? normalize(lead.address) : "";
  const axis = STRATEGIC_AXES.find(
    (candidate) => candidate.commune === lead.commune && address.includes(candidate.needle),
  );

  if (axis) {
    total += 5;
    out.push({
      dimension: "local_opportunity",
      points: 5,
      label: `Eje comercial estratégico: ${axis.label}`,
    });
  } else {
    total += 2;
    out.push({
      dimension: "local_opportunity",
      points: 2,
      label: "Fuera de los ejes comerciales citados en el documento",
    });
  }

  total += competitiveGap(lead, sameNiche, out);

  return clamp(total, 10);
}

// ---------------------------------------------------------------------------
// Confidence Score
// ---------------------------------------------------------------------------

/** Atributos canónicos que cuentan para la densidad de campos verificados. */
const DENSITY_FIELDS: (keyof LeadFacts)[] = [
  "business_name",
  "niche",
  "subcategory",
  "commune",
  "address",
  "latitude",
  "longitude",
  "website_url",
  "website_quality",
  "instagram_url",
  "facebook_url",
  "online_booking",
  "online_ordering",
  "online_menu",
  "online_catalog",
  "whatsapp_business",
  "public_business_email",
  "public_business_phone",
  "rating",
  "review_count",
  "social_activity",
  "multiple_locations",
  "business_age_signal",
  "evidence_notes",
];

function daysSince(iso: string): number {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return (Date.now() - then) / 86_400_000;
}

export function confidenceScore(lead: LeadObservation): number {
  // Densidad de campos verificados (30 pts).
  const present = DENSITY_FIELDS.filter((field) => {
    const value = lead[field];
    return value !== null && value !== undefined && value !== "";
  }).length;
  const density = (present / DENSITY_FIELDS.length) * 30;

  // Confirmación por fuentes independientes (30 pts).
  const sources = lead.audit.independent_sources;
  const sourceRatio = sources >= 3 ? 1 : sources === 2 ? 0.75 : sources === 1 ? 0.4 : 0;
  const sourceScore = sourceRatio * 30;

  // Actualidad (20 pts).
  const age = daysSince(lead.audit.verified_at);
  const recency = age <= 30 ? 20 : age <= 90 ? 12 : 5;

  /*
   * Concordancia de datos (20 pts). Con una sola fuente no hay nada que cruzar,
   * así que no se puede cobrar: no es un castigo, es que la comprobación no se
   * hizo.
   */
  const concordance =
    sources < 2
      ? 0
      : lead.audit.cross_source_match === "exact"
        ? 20
        : lead.audit.cross_source_match === "minor_discrepancies"
          ? 10
          : 10;

  return Math.round(clamp(density + sourceScore + recency + concordance, 100));
}

// ---------------------------------------------------------------------------
// Motor
// ---------------------------------------------------------------------------

export type ScoredLead = Lead & {
  /** Deja explícito de dónde vienen los números de este registro. */
  scoring_source: "engine";
};

/**
 * Puntúa un conjunto completo.
 *
 * El conjunto importa: el percentil de reseñas se normaliza por nicho y comuna,
 * y la brecha competitiva mira a los vecinos del mismo nicho. Puntuar un lead
 * aislado daría un número distinto.
 */
export function scoreDataset(observations: LeadObservation[]): ScoredLead[] {
  const byCohort = new Map<string, LeadObservation[]>();
  const byNiche = new Map<Niche, LeadObservation[]>();

  for (const lead of observations) {
    const cohortKey = `${lead.niche}::${lead.commune}`;
    byCohort.set(cohortKey, [...(byCohort.get(cohortKey) ?? []), lead]);
    byNiche.set(lead.niche, [...(byNiche.get(lead.niche) ?? []), lead]);
  }

  return observations.map((lead) => {
    const explanations: ScoreExplanation[] = [];

    const cohort = byCohort.get(`${lead.niche}::${lead.commune}`) ?? [];
    const sameNiche = byNiche.get(lead.niche) ?? [];

    const digital = digitalNeed(lead, explanations);
    const attractiveness = commercialAttractiveness(lead, cohort, explanations);
    const contact = contactability(lead, explanations);
    const fit = landingFit(lead, explanations);
    const local = localOpportunity(lead, sameNiche, explanations);

    const priority = digital + attractiveness + contact + fit + local;
    const { audit: _audit, ...facts } = lead;

    return {
      ...facts,
      digital_need_score: digital,
      commercial_attractiveness_score: attractiveness,
      contactability_score: contact,
      landing_fit_score: fit,
      local_opportunity_score: local,
      priority_score: priority,
      confidence_score: confidenceScore(lead),
      priority_tier: tierOf(priority) as PriorityTier,
      score_explanations: explanations,
      scoring_source: "engine" as const,
    };
  });
}
