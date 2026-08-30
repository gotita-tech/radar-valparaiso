-- Realtime sobre public.incidents.
--
-- Realtime aplica las mismas políticas de RLS que una consulta normal: un
-- suscriptor anónimo sólo recibe los incidentes que ya podría leer, y los
-- rechazados por moderación no se emiten. Publicar esta tabla no abre ninguna
-- puerta que el SELECT público no tuviera abierta.
--
-- Sólo `incidents`. Comentarios y confirmaciones se leen bajo demanda al abrir
-- una ficha; suscribirlos a todos supondría abrir canales que nadie mira.

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'incidents'
  ) then
    alter publication supabase_realtime add table public.incidents;
  end if;
end
$$;
