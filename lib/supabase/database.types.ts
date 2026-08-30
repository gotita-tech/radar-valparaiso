/**
 * Tipos del esquema `public` de Supabase.
 *
 * Se mantienen a mano y en paralelo con `supabase/migrations/`. Cuando el
 * proyecto tenga la CLI enlazada, este archivo se regenera con:
 *
 *   npx supabase gen types typescript --project-id <ref> --schema public \
 *     > lib/supabase/database.types.ts
 *
 * Mientras tanto la regla es simple: **toda migración que cambie una columna
 * cambia también este archivo en el mismo commit**. Es la única forma de que
 * `npm run typecheck` siga siendo una comprobación real del esquema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type IncidentStatus =
  | "reported"
  | "under_review"
  | "verified"
  | "resolved"
  | "rejected";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type UserRole = "user" | "moderator" | "admin";

export type ConfirmationType = "confirm" | "dispute" | "resolved";

export type MediaType = "image" | "video";

type IncidentCategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type IncidentRow = {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  address: string | null;
  commune: string | null;
  region: string;
  source: string;
  source_url: string | null;
  reported_by: string | null;
  is_verified: boolean;
  verification_count: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  reputation: number;
  created_at: string;
  updated_at: string;
};

type IncidentConfirmationRow = {
  id: string;
  incident_id: string;
  user_id: string;
  confirmation_type: ConfirmationType;
  created_at: string;
  updated_at: string;
};

type IncidentCommentRow = {
  id: string;
  incident_id: string;
  user_id: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

type IncidentMediaRow = {
  id: string;
  incident_id: string;
  user_id: string;
  storage_path: string;
  media_type: MediaType;
  created_at: string;
};

type LeadRow = {
  business_id: string;
  business_name: string;
  niche: string;
  subcategory: string | null;
  commune: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  website_url: string | null;
  has_website: boolean;
  website_classification: number;
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
  priority_tier: string;
  score_explanations: Json;
  data_flags: string[];
  source_primary: string;
  source_urls: string[];
  retrieved_at: string;
  evidence_notes: string | null;
  demo_url: string | null;
  created_at: string;
  updated_at: string;
};

type AppHealthRow = {
  id: number;
  status: string;
  created_at: string;
};

/** Columnas que fija el servidor: nunca forman parte de un insert del cliente. */
type ServerOwnedIncidentColumns =
  | "id"
  | "status"
  | "is_verified"
  | "verification_count"
  | "is_demo"
  | "created_at"
  | "updated_at"
  | "resolved_at";

/**
 * Tabla de sólo lectura para el cliente.
 *
 * `never` sería lo natural, pero supabase-js exige que `Insert` y `Update`
 * satisfagan `Record<string, unknown>`: al no cumplirlo, todo el esquema deja
 * de encajar y cada `select` se infiere como `never`. `Record<string, never>`
 * sí cumple la restricción y sigue haciendo imposible construir un insert con
 * cualquier propiedad. Quien manda de verdad es RLS; esto sólo evita escribir
 * por descuido código que la base va a rechazar.
 */
type ReadOnly = Record<string, never>;

export type Database = {
  public: {
    Tables: {
      app_health: {
        Row: AppHealthRow;
        Insert: ReadOnly;
        Update: ReadOnly;
        Relationships: [];
      };
      incident_categories: {
        Row: IncidentCategoryRow;
        Insert: ReadOnly;
        Update: ReadOnly;
        Relationships: [];
      };
      incidents: {
        Row: IncidentRow;
        // Las columnas con DEFAULT en la migración quedan opcionales: hay que
        // excluirlas del Omit, porque una intersección con Partial no relaja lo
        // que ya era obligatorio.
        Insert: Omit<
          IncidentRow,
          ServerOwnedIncidentColumns | "region" | "source" | "severity"
        > &
          Partial<Pick<IncidentRow, "region" | "source" | "severity">>;
        Update: Partial<
          Pick<
            IncidentRow,
            "title" | "description" | "severity" | "address" | "commune" | "source_url"
          >
        >;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: ReadOnly;
        Update: Partial<Pick<ProfileRow, "display_name" | "avatar_url">>;
        Relationships: [];
      };
      incident_confirmations: {
        Row: IncidentConfirmationRow;
        Insert: Pick<IncidentConfirmationRow, "incident_id" | "user_id"> &
          Partial<Pick<IncidentConfirmationRow, "confirmation_type">>;
        Update: Partial<Pick<IncidentConfirmationRow, "confirmation_type">>;
        Relationships: [];
      };
      incident_comments: {
        Row: IncidentCommentRow;
        Insert: Pick<IncidentCommentRow, "incident_id" | "user_id" | "content">;
        Update: Partial<Pick<IncidentCommentRow, "content" | "is_deleted">>;
        Relationships: [];
      };
      incident_media: {
        Row: IncidentMediaRow;
        Insert: Pick<
          IncidentMediaRow,
          "incident_id" | "user_id" | "storage_path"
        > &
          Partial<Pick<IncidentMediaRow, "media_type">>;
        Update: ReadOnly;
        Relationships: [];
      };
      leads: {
        Row: LeadRow;
        Insert: ReadOnly;
        Update: ReadOnly;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      incident_status: IncidentStatus;
      incident_severity: IncidentSeverity;
      user_role: UserRole;
      confirmation_type: ConfirmationType;
      media_type: MediaType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
