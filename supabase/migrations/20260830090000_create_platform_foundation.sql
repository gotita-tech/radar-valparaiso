-- Radar Valparaíso — fundación de la plataforma.
--
-- Tipos enumerados, funciones auxiliares y el disparador reutilizable de
-- `updated_at`. Todo lo que crean las migraciones posteriores se apoya aquí.
--
-- Las funciones se declaran con `set search_path = ''` y referencias totalmente
-- cualificadas: así no dependen del search_path del llamante, que es un vector
-- conocido de escalada de privilegios en funciones `security definer`.

-- ---------------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'incident_status') then
    create type public.incident_status as enum (
      'reported',
      'under_review',
      'verified',
      'resolved',
      'rejected'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'incident_severity') then
    create type public.incident_severity as enum (
      'low',
      'medium',
      'high',
      'critical'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum (
      'user',
      'moderator',
      'admin'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'confirmation_type') then
    create type public.confirmation_type as enum (
      'confirm',
      'dispute',
      'resolved'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'media_type') then
    create type public.media_type as enum (
      'image',
      'video'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Disparador reutilizable de updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger BEFORE UPDATE: mantiene updated_at sin depender del cliente.';
