-- Comentarios de un incidente.
--
-- Borrado lógico: un comentario retirado deja la fila para no romper hilos ni
-- recuentos, pero deja de mostrar su contenido a nadie salvo a moderación.

create table if not exists public.incident_comments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint incident_comments_content_length
    check (char_length(trim(content)) between 1 and 1000)
);

comment on table public.incident_comments is
  'Comentarios ciudadanos sobre un incidente. Borrado lógico vía is_deleted.';

create index if not exists incident_comments_incident_id_idx
  on public.incident_comments (incident_id, created_at desc)
  where not is_deleted;

create index if not exists incident_comments_user_id_idx
  on public.incident_comments (user_id);

drop trigger if exists incident_comments_set_updated_at on public.incident_comments;
create trigger incident_comments_set_updated_at
  before update on public.incident_comments
  for each row
  execute function public.set_updated_at();

create or replace function public.enforce_comment_authorship()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.role() = 'service_role' or public.is_moderator() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.user_id := (select auth.uid());
    new.is_deleted := false;
  else
    new.user_id := old.user_id;
    new.incident_id := old.incident_id;
  end if;

  return new;
end;
$$;

drop trigger if exists incident_comments_enforce_authorship on public.incident_comments;
create trigger incident_comments_enforce_authorship
  before insert or update on public.incident_comments
  for each row
  execute function public.enforce_comment_authorship();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.incident_comments enable row level security;

revoke all on table public.incident_comments from anon, authenticated;
grant select on table public.incident_comments to anon, authenticated;
grant insert on table public.incident_comments to authenticated;
grant update (content, is_deleted) on table public.incident_comments to authenticated;
grant delete on table public.incident_comments to authenticated;

drop policy if exists "Visible comments are publicly readable" on public.incident_comments;
create policy "Visible comments are publicly readable"
  on public.incident_comments
  for select
  to anon, authenticated
  using (not is_deleted);

drop policy if exists "Moderators read every comment" on public.incident_comments;
create policy "Moderators read every comment"
  on public.incident_comments
  for select
  to authenticated
  using (public.is_moderator());

drop policy if exists "Users comment as themselves" on public.incident_comments;
create policy "Users comment as themselves"
  on public.incident_comments
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users edit their own comments" on public.incident_comments;
create policy "Users edit their own comments"
  on public.incident_comments
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Moderators moderate comments" on public.incident_comments;
create policy "Moderators moderate comments"
  on public.incident_comments
  for update
  to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

drop policy if exists "Users delete their own comments" on public.incident_comments;
create policy "Users delete their own comments"
  on public.incident_comments
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
