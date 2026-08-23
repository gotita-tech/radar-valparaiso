/**
 * Tipos del esquema canónico definido en
 * docs/Radar-de-Oportunidades-Valparaiso.docx (§ "Esquema Canónico y
 * Diccionario de Datos").
 *
 * Los scores no se recalculan: se leen tal cual del suministro.
 */

export type Niche = "restaurant" | "bar" | "barbershop" | "boutique";

export type PriorityTier = "LOW" | "MEDIUM" | "GOOD" | "HIGH" | "VERY_HIGH";

/** 0 GOOD · 1 IMPROVABLE · 2 MINIMAL · 3 SOCIAL_ONLY · 4 NO_WEBSITE_FOUND */
export type WebsiteClassification = 0 | 1 | 2 | 3 | 4;

export type ScoreDimension =
  | "digital_need"
  | "commercial_attractiveness"
  | "contactability"
  | "landing_fit"
  | "local_opportunity";

export type DataFlag = "placeholder_phone";

export type ScoreExplanation = {
  dimension: ScoreDimension;
  points: number;
  label: string;
};

export type Lead = {
  business_id: string;
  business_name: string;
  niche: Niche;
  subcategory: string | null;
  commune: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;

  website_url: string | null;
  has_website: boolean;
  website_classification: WebsiteClassification;
  website_quality: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  social_only_presence: boolean;
  online_booking: boolean | null;
  online_ordering: boolean | null;
  online_menu: boolean | null;
  online_catalog: boolean | null;
  whatsapp_business: string | null;
  public_business_email: string | null;
  public_business_phone: string | null;

  rating: number | null;
  review_count: number | null;
  social_activity: string | null;
  multiple_locations: boolean | null;
  business_age_signal: string | null;

  digital_need_score: number;
  commercial_attractiveness_score: number;
  contactability_score: number;
  landing_fit_score: number;
  local_opportunity_score: number;
  priority_score: number;
  confidence_score: number;
  priority_tier: PriorityTier;

  score_explanations: ScoreExplanation[];
  /**
   * Observaciones de auditoría sobre el propio dato, añadidas durante la
   * normalización. No alteran ningún valor del suministro: sólo advierten.
   */
  data_flags?: DataFlag[];
  source_primary: string;
  source_urls: string[];
  retrieved_at: string;
  evidence_notes: string | null;

  /**
   * URL de una demo real ya construida para este prospecto. Ausente mientras no
   * exista: nunca se rellena con una URL inventada ni con la ruta de la demo
   * conceptual autogenerada.
   */
  demo_url?: string | null;
};

export type LeadDataset = {
  dataset: string;
  version: string;
  region: string;
  source_document: string;
  source_tables: string[];
  notes: string;
  generated_from_document_at: string;
  leads: Lead[];
};

export type LeadFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    business_id: string;
    business_name: string;
    niche: Niche;
    commune: string;
    address: string | null;
    priority_score: number;
    confidence_score: number;
    priority_tier: PriorityTier;
    website_classification: WebsiteClassification;
  };
};

export type LeadFeatureCollection = {
  type: "FeatureCollection";
  name: string;
  features: LeadFeature[];
};

export type ScoreThreshold = 0 | 60 | 75 | 85;

export type SortKey = "priority_score" | "confidence_score" | "business_name" | "digital_need_score";

export type Filters = {
  communes: string[];
  niches: Niche[];
  webClasses: WebsiteClassification[];
  minScore: ScoreThreshold;
  search: string;
  onlyContactable: boolean;
};

export const EMPTY_FILTERS: Filters = {
  communes: [],
  niches: [],
  webClasses: [],
  minScore: 0,
  search: "",
  onlyContactable: false,
};
