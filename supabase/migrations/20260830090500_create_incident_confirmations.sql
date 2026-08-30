-- Confirmación comunitaria: "esto sigue ahí", "ya no está", "esto no es cierto".
--
-- Un voto por persona e incidente, garantizado por la clave única. Cambiar de
-- opinión es un UPDATE de la propia fila, no una fila nueva.

create table if not exists public.incident_confirmations (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  confirmation_type public.confirmation_type not null default 'confirm',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint incident_confirmations_unique_vote unique (incident_id, user_id)
);

comment on table public.incident_confirmations is
  'Voto de la comunidad sobre un incidente. Único por (incidente, usuario).';

create index if not exists incident_confirmations_incident_id_idx
  on public.incident_confirmations (incident_id);

create index if not exists incident_confirmations_user_id_idx
  on public.incident_confirmations (user_id);

drop trigger if exists incident_confirmations_set_updated_at on public.incident_confirmations;
create trigger incident_confirmations_set_updated_at
  before update on public.incident_confirmations
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Recuento derivado
-- ---------------------------------------------------------------------------
-- `incidents.verification_count` se recalcula a partir de los votos reales en
-- lugar de incrementarse a ciegas: así un borrado, un cambio de voto o una
-- reejecución dejan siempre el mismo número.
--
-- El umbral de verificación automática vive aquí, en un único sitio.

create or replace function public.refresh_incident_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  confirmations integer;
  verification_threshold constant integer := 3;
begin
  -- En un trigger de DELETE, NEW no está asignado: leer NEW.incident_id ahí es
  -- un error en tiempo de ejecución. Se ramifica por TG_OP en lugar de confiar
  -- en que un coalesce lo resuelva.
  if tg_op = 'DELETE' then
    target_id := old.incident_id;
  else
    target_id := new.incident_id;
  end if;

  select count(*)
    into confirmations
    from public.incident_confirmations c
   where c.incident_id = target_id
     and c.confirmation_type = 'confirm'::public.confirmation_type;

  update public.incidents i
     set verification_count = confirmations,
         -- La verificación automática nunca degrada una decisión humana: si un
         -- moderador ya marcó el incidente, se respeta.
         is_verified = (i.is_verified or confirmations >= verification_threshold)
   where i.id = target_id;

  return null;
end;
$$;

comment on function public.refresh_incident_verification() is
  'Recalcula verification_count desde los votos reales. Umbral de verificación: 3.';

drop trigger if exists incident_confirmations_refresh_count on public.incident_confirmations;
create trigger incident_confirmations_refresh_count
  after insert or update or delete on public.incident_confirmations
  for each row
  execute function public.refresh_incident_verification();

-- ---------------------------------------------------------------------------
-- Autoría
-- ---------------------------------------------------------------------------

create or replace function public.enforce_confirmation_authorship()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  new.user_id := (select auth.uid());
  return new;
end;
$$;

drop trigger if exists incident_confirmations_enforce_authorship on public.incident_confirmations;
create trigger incident_confirmations_enforce_authorship
  before insert on public.incident_confirmations
  for each row
  execute function public.enforce_confirmation_authorship();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.incident_confirmations enable row level security;

revoke all on table public.incident_confirmations from anon, authenticated;
grant select on table public.incident_confirmations to anon, authenticated;
grant insert on table public.incident_confirmations to authenticated;
grant update (confirmation_type) on table public.incident_confirmations to authenticated;
grant delete on table public.incident_confirmations to authenticated;

-- El recuento es público; sirve para mostrar "3 personas lo confirman".
drop policy if exists "Confirmations are publicly readable" on public.incident_confirmations;
create policy "Confirmations are publicly readable"
  on public.incident_confirmations
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users confirm as themselves" on public.incident_confirmations;
create policy "Users confirm as themselves"
  on public.incident_confirmations
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users change their own vote" on public.incident_confirmations;
create policy "Users change their own vote"
  on public.incident_confirmations
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users withdraw their own vote" on public.incident_confirmations;
create policy "Users withdraw their own vote"
  on public.incident_confirmations
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
