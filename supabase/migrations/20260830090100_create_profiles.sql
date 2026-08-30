-- Perfiles de usuario, enlazados 1:1 con auth.users.
--
-- La plataforma pública sigue siendo anónima: nada de esto es obligatorio para
-- leer el radar. La tabla existe para que reportes, comentarios y confirmaciones
-- puedan atribuirse en cuanto se active la autenticación.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  reputation integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_display_name_length
    check (display_name is null or char_length(display_name) between 2 and 60),
  constraint profiles_reputation_range
    check (reputation >= 0)
);

comment on table public.profiles is
  'Perfil público de cada cuenta. El id es el mismo uuid que auth.users.id.';
comment on column public.profiles.role is
  'Autoridad de moderación. Sólo modificable por admin o service_role.';
comment on column public.profiles.reputation is
  'Reputación acumulada. La calcula el servidor, nunca el propio usuario.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Lectura de rol sin recursión de RLS
-- ---------------------------------------------------------------------------
-- Una política sobre `profiles` que consultase `profiles` se llamaría a sí misma.
-- `security definer` rompe el ciclo: la función lee la tabla saltándose RLS y
-- sólo devuelve el rol del usuario en curso.

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role from public.profiles p where p.id = (select auth.uid())),
    'user'::public.user_role
  );
$$;

comment on function public.current_user_role() is
  'Rol del usuario autenticado. security definer para evitar recursión en RLS.';

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_user_role() in ('moderator'::public.user_role, 'admin'::public.user_role);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_user_role() = 'admin'::public.user_role;
$$;

-- ---------------------------------------------------------------------------
-- El usuario no puede promoverse a sí mismo
-- ---------------------------------------------------------------------------
-- RLS decide QUÉ FILAS se pueden tocar, no qué columnas. Sin esto, la política
-- "edita tu propio perfil" permitiría un UPDATE con role = 'admin'.

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  new.role := old.role;
  new.reputation := old.reputation;
  return new;
end;
$$;

comment on function public.protect_profile_privileges() is
  'Revierte silenciosamente cambios de role/reputation hechos por el propio usuario.';

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileges();

-- ---------------------------------------------------------------------------
-- Alta automática del perfil al registrarse
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    nullif(trim(coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant update (display_name, avatar_url) on table public.profiles to authenticated;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Moderators update any profile" on public.profiles;
create policy "Moderators update any profile"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
