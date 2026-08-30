# Arquitectura de datos — Supabase

Cómo está montado el backend, por qué está montado así y qué queda pendiente.

## Las dos aplicaciones

El repositorio sirve **dos radares distintos** sobre la misma infraestructura.
Conviene no confundirlos:

| | `/radar` — Opportunity Radar | `/incidentes` — Radar ciudadano |
| --- | --- | --- |
| Qué mapea | Negocios con brecha digital | Incidentes reportados por vecinos |
| Para quién | Uso comercial propio (B2B) | Público general |
| Origen | `public.leads`, dataset curado a mano | `public.incidents`, reportes de usuarios |
| Escritura | Ninguna desde el cliente | Cualquier cuenta autenticada |
| Renderizado | Estático, revalidado cada 5 min | Dinámico |

Comparten lenguaje visual, base cartográfica y capa de datos. No comparten
tablas.

## Tablas

```
incident_categories ──┐
                      ├──< incidents ──┬──< incident_confirmations
profiles ─────────────┘                ├──< incident_comments
   │                                   └──< incident_media ──> Storage
   └──> auth.users                     
leads   (independiente)
app_health (sonda de conectividad)
```

- **`incident_categories`** — catálogo. `slug` es la clave estable de la
  aplicación; `id` la de integridad referencial. Nada referencia una categoría
  por su texto visible.
- **`incidents`** — núcleo. Coordenadas, estado de moderación, severidad y
  recuento de confirmaciones.
- **`incident_confirmations`** — un voto por persona e incidente (clave única).
- **`profiles`** — 1:1 con `auth.users`, creado por trigger al registrarse.
- **`incident_comments`** — borrado lógico, para no romper hilos.
- **`incident_media`** — índice de los archivos que viven en Storage.
- **`leads`** — los 15 prospectos comerciales, espejo de `data/leads.json`.

## Principios de seguridad

**RLS está activo en todas las tablas.** Ninguna excepción, ni siquiera en las
de sólo lectura.

**RLS filtra filas, no columnas.** Por eso cada tabla escribible lleva además un
trigger `BEFORE INSERT/UPDATE` que fija en el servidor lo que el cliente no debe
elegir:

| Trigger | Qué impide |
| --- | --- |
| `enforce_incident_authorship` | Crear un incidente ya `verified`, con 900 confirmaciones o a nombre de otro |
| `protect_profile_privileges` | Que un usuario se ascienda a `admin` o se suba la reputación |
| `enforce_confirmation_authorship` | Votar en nombre de otra persona |
| `enforce_comment_authorship` | Cambiar el autor de un comentario |

Además, los `grant` son por columna donde importa: `profiles` sólo concede
`update (display_name, avatar_url)` a `authenticated`. Aunque una política
fallara, `role` no es escribible desde la clave publishable.

**Las funciones `security definer` fijan `search_path = ''`** y cualifican cada
referencia. Sin eso, un `search_path` manipulado por el llamante es una vía
conocida de escalada de privilegios.

**No hay `service_role` en el proyecto.** Ni en el código, ni en las variables
de entorno de Vercel, ni en `.env.example`. La aplicación entera funciona con la
clave publishable y RLS. Si algún día hace falta (importaciones masivas, panel
de moderación), va en una variable **sin** prefijo `NEXT_PUBLIC_` y se usa
exclusivamente desde una Route Handler.

## Capa de datos

```
lib/supabase/
  config.ts          Lectura de env. getSupabaseConfig() lanza; ...OrNull() no.
  client.ts          Navegador, con sesión. Para escrituras tras un gesto.
  server.ts          Servidor, con cookies. Convierte la ruta en dinámica.
  public.ts          Servidor, sin cookies. Permite estático + revalidate.
  database.types.ts  Tipos del esquema.

lib/data/
  leads.ts       getLeads(), getLeadById()      — con fallback local
  incidents.ts   getIncidents(), getIncidentById(), getIncidentConfirmations()
  categories.ts  getIncidentCategories()
  media.ts       getIncidentMedia()             — firma URLs de Storage
  errors.ts      logDataError() + mensajes de cara al usuario
```

La regla: **el detalle técnico se queda en el log del servidor**. Lo que llega
al navegador es una frase corta, sin código de Postgres ni nombres de columna.

### Por qué `public.ts` existe

`server.ts` lee cookies con `next/headers`, y eso convierte en dinámica
cualquier ruta que lo toque. `/radar` no depende de quién mira, así que usa el
cliente sin cookies y conserva el prerenderizado con `revalidate = 300`.

### Por qué las categorías se cruzan en memoria

`getIncidents()` no usa un join anidado de PostgREST. Con tipos escritos a mano,
la inferencia del join se degrada a `any` con facilidad. Son doce categorías:
traerlas enteras y cruzarlas en JavaScript cuesta menos que perder el tipado.

## `data/leads.json` sigue en el repositorio

A propósito, y por dos razones:

1. **Es el documento de origen.** La migración de semilla se genera desde él con
   `npm run data:seed`. El JSON manda; el SQL se deriva.
2. **Es la red de seguridad del radar.** Si Supabase no responde, `/radar` se
   dibuja con la copia versionada en vez de quedarse en blanco, y el pie de
   página dice cuál de las dos fuentes está mostrando.

Nunca fue un archivo de escritura: no hay ni hubo ningún endpoint que escribiera
en él. La deuda técnica de "persistir en el filesystem de Vercel" que se
sospechaba **no existía**.

## Datos de demostración

`incident_categories` se siembra con 12 categorías reales. **`incidents` se
queda vacía a propósito.**

Sembrar incendios o accidentes ficticios en un radar de emergencias ciudadanas
es engañoso aunque lleven una etiqueta de demo. La columna `is_demo` y su aviso
en la interfaz existen para cuando hagan falta; el estado vacío explica que el
radar está activo y esperando reportes.

## Coordenadas: por qué todavía no PostGIS

Las consultas de hoy son "los más recientes" y "los de este recuadro". Un índice
B-tree sobre `(latitude, longitude)` las resuelve de sobra con el volumen
previsto.

PostGIS empieza a valer la pena con: radios reales en metros, vecino más
próximo, polígonos de comuna o detección de duplicados por proximidad — justo lo
que pedirá la fase de IA. La migración no exigiría rehacer el modelo:

```sql
alter table public.incidents
  add column geog geography(Point, 4326)
  generated always as (st_point(longitude, latitude)::geography) stored;

create index incidents_geog_idx on public.incidents using gist (geog);
```

Las dos columnas actuales se conservan y nada del código existente se rompe.

## Realtime

Sólo `public.incidents` está en la publicación `supabase_realtime`.

Realtime aplica las mismas políticas de RLS que una consulta normal: un
suscriptor anónimo recibe exactamente lo que ya podría leer. Publicar la tabla
no abre nada que el `SELECT` público no tuviera abierto.

El cliente (`hooks/useIncidentsRealtime.ts`) mantiene **un canal por montaje**,
lo cierra en el cleanup y, si la suscripción falla, **se degrada a refetch cada
60 s** en vez de quedarse mudo. La interfaz muestra en qué modo está.

## Storage

Bucket `incident-media`, **privado**, 10 MB por archivo, sólo imágenes.

Privado a propósito: las fotos de un incidente son contenido público, pero un
bucket público deja cualquier objeto accesible por URL para siempre — también
las de un incidente que la moderación acabe rechazando. Con el bucket cerrado,
`lib/data/media.ts` firma URLs de 10 minutos y retirar contenido surte efecto.

Rutas: `<user-id>/<incident-id>/<uuid>.<ext>`. La convención se impone dos
veces: en las políticas de `storage.objects` (`foldername(name)[1] = auth.uid()`)
y en la restricción `incident_media_path_is_owned` de la tabla.

**No hay interfaz de subida todavía.** La infraestructura está cerrada y lista;
falta el formulario.

## Autenticación

Pública de lectura, autenticada para escribir. Ver el radar nunca pide cuenta.

- **Enlace mágico** y **email/contraseña** están implementados (`/acceso`).
- **Google OAuth** encaja en el mismo flujo pero necesita client id y secret que
  hoy no existen. Añadir el botón sin ellos sólo produciría un error al
  pulsarlo, así que no se pinta.

`middleware.ts` refresca el token antes de cada render, porque los Server
Components no pueden escribir cookies. El middleware **no decide permisos**:
eso es cosa de RLS. Bloquear rutas ahí daría una falsa sensación de seguridad.

## Migraciones

```
20260829224839_create_app_health.sql          sonda de salud (preexistente)
20260830090000_create_platform_foundation.sql enums + set_updated_at()
20260830090100_create_profiles.sql            perfiles, roles, anti-escalada
20260830090200_create_incident_categories.sql catálogo
20260830090300_seed_incident_categories.sql   12 categorías
20260830090400_create_incidents.sql           núcleo + índices + RLS
20260830090500_create_incident_confirmations.sql votos + recuento por trigger
20260830090600_create_incident_comments.sql   comentarios
20260830090700_create_incident_media.sql      media + bucket + políticas
20260830090800_create_leads.sql               prospectos comerciales
20260830090900_seed_leads.sql                 15 prospectos (GENERADO)
20260830091000_enable_incidents_realtime.sql  publicación realtime
```

Todas son idempotentes (`if not exists`, `drop policy if exists`, `on conflict`),
así que reaplicarlas es seguro.

Aplicar:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

## Índices

Sólo los caminos de acceso que la aplicación usa. Cada índice se paga en cada
escritura, así que no se indexa "por si acaso".

| Tabla | Índice | Para qué |
| --- | --- | --- |
| `incidents` | `created_at desc` | portada |
| `incidents` | `created_at desc where status <> 'rejected'` | el listado por defecto |
| `incidents` | `status`, `category_id` | filtros |
| `incidents` | `reported_by where not null` | "mis reportes" |
| `incidents` | `(latitude, longitude)` | recuadro del mapa |
| `incident_confirmations` | `incident_id`, `user_id` | ficha y "ya voté" |
| `incident_comments` | `(incident_id, created_at desc) where not is_deleted` | hilo |
| `leads` | `priority_score desc`, `commune`, `niche` | ranking y filtros |

## Pendiente

- **Aplicar las migraciones** al proyecto remoto (requiere credenciales que no
  están en el repo).
- **Interfaz de subida de fotos** — la infraestructura está lista.
- **Panel de moderación** — las políticas de moderador existen y no hay pantalla
  que las use. Ascender a alguien a `moderator` hoy se hace desde el panel de
  Supabase.
- **Reputación** — la columna existe y nadie la calcula todavía.
- **Límite de frecuencia** en `POST /api/incidents`. Hoy la barrera es tener
  cuenta; con volumen real hará falta algo más.
- **Pipeline comercial** (`/pipeline`) sigue en `localStorage`. Migrarlo a
  Supabase exigiría login obligatorio para uso interno; se dejó como estaba
  porque hoy funciona y nadie más lo usa.
