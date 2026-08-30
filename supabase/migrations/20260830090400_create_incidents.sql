-- Núcleo del radar ciudadano.
--
-- Coordenadas en `double precision` en vez de PostGIS: las consultas actuales
-- son "dame los incidentes recientes" y "dame los de este rectángulo", que un
-- índice B-tree compuesto resuelve de sobra con el volumen previsto. PostGIS
-- pasa a valer la pena cuando aparezcan radios reales, vecinos más próximos o
-- polígonos de comuna. La migración no exigiría rehacer el modelo: bastaría con
-- añadir una columna `geography(Point,4326)` generada desde estas dos.

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.incident_categories (id) on delete restrict,

  title text not null,
  description text,
  status public.incident_status not null default 'reported',
  severity public.incident_severity not null default 'medium',

  latitude double precision not null,
  longitude double precision not null,
  address text,
  commune text,
  region text not null default 'Región de Valparaíso',

  source text not null default 'citizen',
  source_url text,

  reported_by uuid references public.profiles (id) on delete set null,
  is_verified boolean not null default false,
  verification_count integer not null default 0,

  -- Distingue lo sembrado por una migración de lo reportado por una persona.
  -- La interfaz lo etiqueta, así que producción nunca muestra un dato ficticio
  -- haciéndose pasar por real.
  is_demo boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,

  constraint incidents_title_length
    check (char_length(trim(title)) between 4 and 140),
  constraint incidents_description_length
    check (description is null or char_length(description) <= 2000),
  constraint incidents_latitude_range
    check (latitude between -90 and 90),
  constraint incidents_longitude_range
    check (longitude between -180 and 180),
  constraint incidents_source_url_scheme
    check (source_url is null or source_url ~* '^https?://'),
  constraint incidents_verification_count_range
    check (verification_count >= 0),
  constraint incidents_resolved_at_consistency
    check ((status = 'resolved') = (resolved_at is not null))
);

comment on table public.incidents is
  'Incidentes del radar ciudadano. Lectura pública salvo los rechazados.';
comment on column public.incidents.source is
  'Procedencia: citizen, import, official. Texto libre para no cerrar el modelo.';
comment on column public.incidents.is_demo is
  'true = registro de demostración sembrado por migración, no un reporte real.';
comment on column public.incidents.verification_count is
  'Confirmaciones de la comunidad. Lo mantiene un trigger, no el cliente.';

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
-- Sólo los caminos de acceso que la aplicación usa de verdad: portada por
-- fecha, filtro por categoría, filtro por estado, recuadro del mapa y "mis
-- reportes". Nada más: cada índice se paga en cada escritura.

create index if not exists incidents_created_at_idx
  on public.incidents (created_at desc);

create index if not exists incidents_status_idx
  on public.incidents (status);

create index if not exists incidents_category_id_idx
  on public.incidents (category_id);

create index if not exists incidents_reported_by_idx
  on public.incidents (reported_by)
  where reported_by is not null;

create index if not exists incidents_coordinates_idx
  on public.incidents (latitude, longitude);

-- El listado por defecto: lo visible, lo más reciente primero.
create index if not exists incidents_public_feed_idx
  on public.incidents (created_at desc)
  where status <> 'rejected';

drop trigger if exists incidents_set_updated_at on public.incidents;
create trigger incidents_set_updated_at
  before update on public.incidents
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Campos que decide el servidor, no quien reporta
-- ---------------------------------------------------------------------------
-- Sin esto, un cliente con la clave publishable podría crear un incidente ya
-- verificado y con 900 confirmaciones. RLS filtra filas, no columnas, así que
-- el saneado va en un trigger.

create or replace function public.enforce_incident_authorship()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if auth.role() = 'service_role' or public.is_moderator() then
      return new;
    end if;

    new.reported_by        := (select auth.uid());
    new.status             := 'reported'::public.incident_status;
    new.is_verified        := false;
    new.verification_count := 0;
    new.is_demo            := false;
    new.resolved_at        := null;
    return new;
  end if;

  if auth.role() = 'service_role' or public.is_moderator() then
    return new;
  end if;

  -- Quien reporta corrige su texto; el ciclo de moderación no le pertenece.
  new.reported_by        := old.reported_by;
  new.status             := old.status;
  new.is_verified        := old.is_verified;
  new.verification_count := old.verification_count;
  new.is_demo            := old.is_demo;
  new.resolved_at        := old.resolved_at;
  return new;
end;
$$;

comment on function public.enforce_incident_authorship() is
  'Fija autoría y estado de moderación en el servidor; el cliente no los elige.';

drop trigger if exists incidents_enforce_authorship on public.incidents;
create trigger incidents_enforce_authorship
  before insert or update on public.incidents
  for each row
  execute function public.enforce_incident_authorship();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.incidents enable row level security;

revoke all on table public.incidents from anon, authenticated;
grant select on table public.incidents to anon, authenticated;
grant insert on table public.incidents to authenticated;
grant update on table public.incidents to authenticated;
grant delete on table public.incidents to authenticated;

-- Leer: cualquiera, salvo lo rechazado por moderación.
drop policy if exists "Public incidents are readable" on public.incidents;
create policy "Public incidents are readable"
  on public.incidents
  for select
  to anon, authenticated
  using (status <> 'rejected'::public.incident_status);

drop policy if exists "Authors read their own incidents" on public.incidents;
create policy "Authors read their own incidents"
  on public.incidents
  for select
  to authenticated
  using ((select auth.uid()) = reported_by);

drop policy if exists "Moderators read every incident" on public.incidents;
create policy "Moderators read every incident"
  on public.incidents
  for select
  to authenticated
  using (public.is_moderator());

-- Crear: sólo cuentas autenticadas y siempre a su propio nombre.
drop policy if exists "Authenticated users report incidents" on public.incidents;
create policy "Authenticated users report incidents"
  on public.incidents
  for insert
  to authenticated
  with check ((select auth.uid()) = reported_by);

-- Editar: el autor, mientras nadie haya empezado a moderarlo.
drop policy if exists "Authors edit their pending incidents" on public.incidents;
create policy "Authors edit their pending incidents"
  on public.incidents
  for update
  to authenticated
  using (
    (select auth.uid()) = reported_by
    and status = 'reported'::public.incident_status
  )
  with check ((select auth.uid()) = reported_by);

drop policy if exists "Moderators manage incidents" on public.incidents;
create policy "Moderators manage incidents"
  on public.incidents
  for update
  to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- Borrar: el autor, sólo mientras siga pendiente. La moderación no borra:
-- rechaza, para conservar el rastro.
drop policy if exists "Authors delete their pending incidents" on public.incidents;
create policy "Authors delete their pending incidents"
  on public.incidents
  for delete
  to authenticated
  using (
    (select auth.uid()) = reported_by
    and status = 'reported'::public.incident_status
  );
