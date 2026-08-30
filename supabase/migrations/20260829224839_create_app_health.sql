create table if not exists public.app_health (
  id smallint primary key,
  status text not null,
  created_at timestamptz not null default now(),
  constraint app_health_singleton check (id = 1),
  constraint app_health_status_ok check (status = 'ok')
);

comment on table public.app_health is
  'Public, read-only connectivity probe for application health checks.';

alter table public.app_health enable row level security;

revoke all on table public.app_health from anon, authenticated;
grant select (id, status, created_at) on table public.app_health to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_health'
      and policyname = 'Application health is publicly readable'
  ) then
    create policy "Application health is publicly readable"
      on public.app_health
      for select
      to anon, authenticated
      using (id = 1 and status = 'ok');
  end if;
end
$$;

insert into public.app_health (id, status)
values (1, 'ok')
on conflict (id) do update
set status = excluded.status;
