-- Prospectos comerciales del Opportunity Radar.
--
-- Traslada a Postgres el esquema canónico de `data/leads.json`, que hasta ahora
-- se importaba en tiempo de compilación. Los nombres de columna son los mismos
-- que los del JSON: la capa de datos no tiene que traducir nada y el dataset
-- sigue siendo comparable con su documento de origen.
--
-- `business_id` es la clave primaria porque ya es un identificador opaco y
-- estable del suministro (b001, b002…), y porque las rutas de la aplicación
-- (/prospects/[slug], /demos/[slug]) lo resuelven contra ese valor.

create table if not exists public.leads (
  business_id text primary key,
  business_name text not null,
  niche text not null,
  subcategory text,
  commune text not null,
  address text,
  latitude double precision,
  longitude double precision,

  website_url text,
  has_website boolean not null default false,
  website_classification smallint not null,
  website_quality text,
  instagram_url text,
  facebook_url text,
  social_only_presence boolean not null default false,
  online_booking boolean,
  online_ordering boolean,
  online_menu boolean,
  online_catalog boolean,
  whatsapp_business text,
  public_business_email text,
  public_business_phone text,

  rating numeric(2, 1),
  review_count integer,
  social_activity text,
  multiple_locations boolean,
  business_age_signal text,

  digital_need_score integer not null,
  commercial_attractiveness_score integer not null,
  contactability_score integer not null,
  landing_fit_score integer not null,
  local_opportunity_score integer not null,
  priority_score integer not null,
  confidence_score integer not null,
  priority_tier text not null,

  score_explanations jsonb not null default '[]'::jsonb,
  data_flags text[] not null default '{}'::text[],
  source_primary text not null,
  source_urls text[] not null default '{}'::text[],
  retrieved_at timestamptz not null,
  evidence_notes text,
  demo_url text,

  -- De dónde salen los números: copiados del documento canónico o calculados
  -- por el motor de scoring desde hechos observables. Importa al comparar, y
  -- por eso viaja hasta la interfaz en vez de quedarse en el proceso de carga.
  scoring_source text not null default 'document',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint leads_business_id_format
    check (business_id ~ '^[a-z0-9_-]{2,32}$'),
  constraint leads_niche_known
    check (niche in ('restaurant', 'bar', 'barbershop', 'boutique')),
  constraint leads_website_classification_range
    check (website_classification between 0 and 4),
  constraint leads_priority_tier_known
    check (priority_tier in ('LOW', 'MEDIUM', 'GOOD', 'HIGH', 'VERY_HIGH')),
  constraint leads_latitude_range
    check (latitude is null or latitude between -90 and 90),
  constraint leads_longitude_range
    check (longitude is null or longitude between -180 and 180),
  constraint leads_rating_range
    check (rating is null or rating between 0 and 5),
  constraint leads_review_count_range
    check (review_count is null or review_count >= 0),
  constraint leads_priority_score_range
    check (priority_score between 0 and 100),
  constraint leads_confidence_score_range
    check (confidence_score between 0 and 100),
  constraint leads_score_explanations_is_array
    check (jsonb_typeof(score_explanations) = 'array'),
  constraint leads_scoring_source_known
    check (scoring_source in ('document', 'engine'))
);

comment on table public.leads is
  'Dataset de prospectos del Opportunity Radar. Espejo del esquema de data/leads.json.';
comment on column public.leads.score_explanations is
  'Extracto de evidencia del documento canónico. NO es un desglose que sume priority_score.';
comment on column public.leads.data_flags is
  'Avisos de calidad detectados durante la normalización. No alteran el suministro.';

create index if not exists leads_priority_score_idx
  on public.leads (priority_score desc);

create index if not exists leads_commune_idx
  on public.leads (commune);

create index if not exists leads_niche_idx
  on public.leads (niche);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Lectura pública: el dashboard es público y estos datos ya se servían dentro
-- del bundle. Escritura, ninguna desde el cliente — el dataset lo mantiene una
-- migración o un administrador con service_role.

alter table public.leads enable row level security;

revoke all on table public.leads from anon, authenticated;
grant select on table public.leads to anon, authenticated;

drop policy if exists "Leads are publicly readable" on public.leads;
create policy "Leads are publicly readable"
  on public.leads
  for select
  to anon, authenticated
  using (true);
