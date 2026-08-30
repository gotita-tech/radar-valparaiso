-- Fotografías y vídeo asociados a un incidente, más el bucket que los guarda.
--
-- Todavía no hay interfaz de subida: esto es la infraestructura, dejada lista y
-- cerrada. La tabla es el índice consultable; los bytes viven en Storage.

create table if not exists public.incident_media (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  media_type public.media_type not null default 'image',
  created_at timestamptz not null default now(),

  -- Refleja en la base la misma convención que imponen las políticas de
  -- Storage: <user-id>/<incident-id>/<archivo>. Si alguien inserta una fila
  -- apuntando a la carpeta de otro, la restricción la rechaza.
  constraint incident_media_path_is_owned
    check (storage_path like user_id::text || '/' || incident_id::text || '/%')
);

comment on table public.incident_media is
  'Índice de archivos de Storage por incidente. Los bytes viven en incident-media.';
comment on column public.incident_media.storage_path is
  'Ruta dentro del bucket incident-media: <user-id>/<incident-id>/<uuid>.<ext>';

create index if not exists incident_media_incident_id_idx
  on public.incident_media (incident_id, created_at);

create index if not exists incident_media_user_id_idx
  on public.incident_media (user_id);

create or replace function public.enforce_media_authorship()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.role() = 'service_role' or public.is_moderator() then
    return new;
  end if;

  new.user_id := (select auth.uid());
  return new;
end;
$$;

drop trigger if exists incident_media_enforce_authorship on public.incident_media;
create trigger incident_media_enforce_authorship
  before insert on public.incident_media
  for each row
  execute function public.enforce_media_authorship();

alter table public.incident_media enable row level security;

revoke all on table public.incident_media from anon, authenticated;
grant select on table public.incident_media to anon, authenticated;
grant insert on table public.incident_media to authenticated;
grant delete on table public.incident_media to authenticated;

drop policy if exists "Media of visible incidents is readable" on public.incident_media;
create policy "Media of visible incidents is readable"
  on public.incident_media
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.incidents i
      where i.id = incident_media.incident_id
        and i.status <> 'rejected'::public.incident_status
    )
  );

drop policy if exists "Users attach media to their own incidents" on public.incident_media;
create policy "Users attach media to their own incidents"
  on public.incident_media
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.incidents i
      where i.id = incident_media.incident_id
        and i.reported_by = (select auth.uid())
    )
  );

drop policy if exists "Users delete their own media" on public.incident_media;
create policy "Users delete their own media"
  on public.incident_media
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Bucket
-- ---------------------------------------------------------------------------
-- Privado a propósito. Las fotos de un incidente son contenido público, pero un
-- bucket público deja cualquier objeto accesible por URL para siempre: también
-- las de un incidente que la moderación acabe rechazando. Con el bucket cerrado
-- la aplicación firma URLs de vida corta y la retirada de un contenido surte
-- efecto de verdad.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'incident-media',
  'incident-media',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Escritura confinada a <auth.uid()>/… Nadie puede escribir, sobrescribir ni
-- borrar en la carpeta de otra persona.

drop policy if exists "Incident media is readable" on storage.objects;
create policy "Incident media is readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'incident-media');

drop policy if exists "Users upload into their own folder" on storage.objects;
create policy "Users upload into their own folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'incident-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users overwrite only their own files" on storage.objects;
create policy "Users overwrite only their own files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'incident-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'incident-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete only their own files" on storage.objects;
create policy "Users delete only their own files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'incident-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
