-- Catálogo de categorías de incidente.
--
-- El slug es la clave estable que usa la aplicación; el id (uuid) es la clave
-- de integridad referencial. Ninguna tabla referencia la categoría por su texto
-- visible, de modo que renombrar "Corte de luz" no rompe ningún dato.

create table if not exists public.incident_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  color text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint incident_categories_slug_format
    check (slug ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  constraint incident_categories_name_length
    check (char_length(name) between 2 and 60),
  constraint incident_categories_color_format
    check (color is null or color ~ '^#[0-9A-Fa-f]{6}$')
);

comment on table public.incident_categories is
  'Catálogo de tipos de incidente. Lectura pública de las categorías activas.';
comment on column public.incident_categories.slug is
  'Identificador estable en la aplicación. Inmutable en la práctica.';

create index if not exists incident_categories_active_order_idx
  on public.incident_categories (sort_order, name)
  where is_active;

drop trigger if exists incident_categories_set_updated_at on public.incident_categories;
create trigger incident_categories_set_updated_at
  before update on public.incident_categories
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- El catálogo lo mantiene una migración o un administrador. Ni anon ni
-- authenticated reciben insert/update/delete.

alter table public.incident_categories enable row level security;

revoke all on table public.incident_categories from anon, authenticated;
grant select on table public.incident_categories to anon, authenticated;

drop policy if exists "Active categories are publicly readable" on public.incident_categories;
create policy "Active categories are publicly readable"
  on public.incident_categories
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists "Moderators read every category" on public.incident_categories;
create policy "Moderators read every category"
  on public.incident_categories
  for select
  to authenticated
  using (public.is_moderator());
