# Handoff — Radar Valparaíso

Estado del trabajo para que otra sesión pueda continuar sin releer todo el
historial. Última actualización: **30 de agosto de 2026**.

---

## 0. Lo único que bloquea todo

**Las migraciones de Supabase NO están aplicadas.** El usuario decidió
ejecutarlas él mismo, en su terminal, para no pegar credenciales en el chat.

```bash
npx supabase login
npx supabase link --project-ref myfbcxnmvhkaxbkxshxs
npx supabase db push
```

Cómo comprobar si ya se aplicaron:

```bash
curl -s https://experimento-02.vercel.app/api/incidents
```

- `503` + mensaje amable → **no aplicadas** (estado actual)
- `200` + `{"ok":true,"incidents":[]}` → aplicadas

Mientras no se apliquen, la aplicación degrada de forma controlada: `/radar`
usa la copia local de `data/leads.json` y `/incidentes` muestra su estado
degradado. **Esto es correcto, no es un bug.**

Si `db push` falla, los dos puntos con más probabilidad de dar problemas son:

1. Las políticas sobre `storage.objects` en
   `20260830090700_create_incident_media.sql` (requieren privilegios sobre el
   esquema `storage`).
2. El trigger `on_auth_user_created` sobre `auth.users` en
   `20260830090100_create_profiles.sql`.

Ambos son patrones documentados de Supabase y deberían funcionar con el rol
`postgres`, pero es donde mirar primero.

---

## 1. Contexto imprescindible

### Dos radares distintos, no confundirlos

| | `/radar` | `/incidentes` |
| --- | --- | --- |
| Qué es | Prospección comercial B2B | Radar ciudadano público |
| Datos | `public.leads` (negocios con brecha digital) | `public.incidents` (reportes de vecinos) |
| Estado | Funcionando, ampliado a 31 prospectos | Construido, esperando migraciones |

El encargo original describía un esquema de incidentes ciudadanos, pero la
aplicación existente era el radar comercial. Se construyó **lo nuevo al lado**,
sin tocar lo que ya funcionaba.

### Tres premisas del encargo que resultaron falsas

1. **`data/leads.json` nunca fue un archivo de escritura.** No hay ni hubo
   endpoint que escriba en él; es un `import` estático. La "deuda técnica de
   persistir en el filesystem de Vercel" no existía.
2. **El repo tenía `main` divergido.** El Prospect Studio local no estaba
   subido y el backend de Supabase sólo estaba en remoto. Se fusionaron en
   `17a0936`.
3. **El repositorio se renombró** de `experimento-02` a `radar-valparaiso`. El
   remote ya apunta al nombre nuevo. La URL de producción sigue siendo
   `experimento-02.vercel.app`.

---

## 2. Qué está hecho y verificado

### Supabase (escrito, sin aplicar)

12 migraciones en `supabase/migrations/`, todas idempotentes:

```
20260829224839_create_app_health.sql            preexistente, NO tocar
20260830090000_create_platform_foundation.sql   enums + set_updated_at()
20260830090100_create_profiles.sql              perfiles + anti-escalada de rol
20260830090200_create_incident_categories.sql   catálogo
20260830090300_seed_incident_categories.sql     12 categorías reales
20260830090400_create_incidents.sql             núcleo + índices + RLS
20260830090500_create_incident_confirmations.sql votos + recuento por trigger
20260830090600_create_incident_comments.sql     comentarios
20260830090700_create_incident_media.sql        media + bucket privado
20260830090800_create_leads.sql                 prospectos comerciales
20260830090900_seed_leads.sql                   31 prospectos (GENERADO)
20260830091000_enable_incidents_realtime.sql    publicación realtime
```

Principios que hay que respetar al tocarlas:

- **RLS activo en todas las tablas**, sin excepción.
- **RLS filtra filas, no columnas.** Por eso cada tabla escribible tiene además
  un trigger que fija en el servidor lo que el cliente no debe elegir (autoría,
  estado de moderación, recuento, rol, reputación). No quitar.
- **Nunca `service_role`** en el proyecto. La app entera funciona con la clave
  publishable y RLS.
- Las funciones `security definer` llevan `set search_path = ''`.

`20260830090900_seed_leads.sql` es **generado**: no editarlo a mano, regenerar
con `npm run data:seed`.

### Aplicación

```
lib/supabase/     config, client (navegador), server (cookies), public (sin
                  cookies, permite estático), database.types
lib/data/         leads, incidents, categories, media, errors
lib/incidents/    types, validation (compartida cliente/servidor)
lib/radar/scoring.ts   motor de scoring  ← lo nuevo de esta sesión
hooks/useIncidentsRealtime.ts
components/incidents/  IncidentRadar, IncidentMap, ReportForm, AccessPanel
app/incidentes, app/acceso, app/auth/callback, app/api/incidents
middleware.ts     refresco de sesión
```

Verificado en producción: `/`, `/radar`, `/incidentes` responden 200;
`/api/health/supabase` sigue devolviendo `{"ok":true,"supabase":"connected"}`;
`/api/incidents` devuelve 503 con mensaje amable **sin filtrar el esquema**.

---

## 3. Lo de esta sesión: motor de scoring + ampliación

### El problema que resolvía

El dataset tenía 15 registros porque cada uno exigía copiar a mano cinco
sub-scores del documento canónico. Ampliar era inviable.

### El motor

`lib/radar/scoring.ts` implementa la rúbrica del § "Algoritmo del Priority
Score" del `.docx`. La investigación aporta **hechos observables** y el motor
deriva los cinco sub-scores, el tier, la explicabilidad y el Confidence Score.

Reglas que lo definen:

- **Los 15 originales no se recalculan nunca.** Llevan
  `scoring_source: "document"` y el pipeline se niega a tocarlos.
- **Lo no comprobado no suma.** Un `null` en `audit` vale cero. Por eso un
  registro nuevo puntúa por debajo de uno del documento aunque el negocio sea
  equivalente — la ficha del prospecto lo advierte explícitamente.
- **El scoring necesita el conjunto entero**, no un lead suelto: el percentil de
  reseñas se normaliza por nicho y comuna, y la brecha competitiva mira a 500 m.

**Ambigüedad conocida del documento**, aislada en `competitiveGap()`: la prosa
nombra la métrica como "proporción de competidores que *carecen* de web" y acto
seguido razona que "a mayor concentración de competidores *digitalizados*, mayor
la presión". Se implementó la segunda (la que explica el porqué comercial).
Invertirla es cambiar una línea.

### Validación

```bash
npm run data:check
```

Contrasta el motor contra los 15 del documento. Criterio: el motor debe quedar
**por debajo**, nunca por encima. Estado actual: 0 registros por encima,
desviación media 12,6 puntos, coincidencia del top 5 = 4/5. El script sale con
código 1 si algún registro sobrepasa al documento.

(La desviación bajó de 26,3 a 12,6 al pasar de 15 a 31 registros: con más
vecinos, percentil y brecha competitiva tienen datos reales. El motor mejora
solo conforme crece el dataset.)

### La ampliación

Dataset: **15 → 36 prospectos**. Barberías: **8 → 29**. Comunas: **4 → 8**
(nuevas: Quilpué, La Calera, Los Andes, Quillota).

21 barberías reales, verificadas en fichas públicas de AgendaPro y Fresha y en
el sitio propio del negocio. 20 con coordenadas resueltas contra OpenStreetMap
(Nominatim, sin clave). Muski Barber Shop se queda sin coordenadas porque
Nominatim no resuelve su dirección — **no se inventa**.

Dos ya tienen buena web y por eso puntúan LOW: Mapu Barber Shop (28) y Cambia
tu Look (29). No necesitan lo que se vende, pero alimentan la brecha competitiva
de sus vecinos, así que entran igual.

**Fresha sí publica rating y reseñas; AgendaPro no.** Por eso Life Barbería &
Studio (5,0 con 135 reseñas verificadas) alcanza GOOD 61, el mejor del lote,
mientras los de AgendaPro se quedan en ~45 con el rating en `null`. No es que
sean peores negocios: es que su reputación no está verificada.

### Lección: el caso Mapu

`b017` se clasificó primero como "sólo agregador, sin web" a partir de su ficha
de AgendaPro. **Era falso**: tiene sitio propio con precios, reservas, HTTPS,
viewport responsive y dos sucursales desde 2017. Al corregirlo pasó de
MEDIUM 43 / confianza 47 a **LOW 28 / confianza 86**.

Dos conclusiones que conviene no olvidar al ampliar:

1. **Una ficha de agregador no prueba ausencia de web.** Hay que buscar el
   dominio del negocio antes de asignar clase 3 o 4.
2. El Confidence Score bajo estaba haciendo su trabajo: avisaba de que ese
   registro se apoyaba en una sola fuente. Cuando la confianza es ~47, el dato
   es una hipótesis, no un hecho.

### Pipeline de ampliación

```bash
# 1. Escribir hechos observables en data/intake/*.json (NO scores)
npm run data:geocode   # coordenadas desde OpenStreetMap
npm run data:ingest    # valida, puntúa con el motor, fusiona en leads.json
npm run data:build     # regenera GeoJSON
npm run data:seed      # regenera la migración de semilla
```

El validador rechaza el lote entero si algo no cuadra (clase web incoherente con
`website_url`, `source_urls` vacío, coordenadas fuera de la región, id
duplicado, intento de repuntuar uno de los 15) y no escribe nada.

---

## 4. Estado de verificación

| Comprobación | Estado |
| --- | --- |
| `npx tsc --noEmit` | limpio |
| `npm run lint` | limpio, sin warnings |
| `npm run build` | pasa · 36 rutas en `/prospects` y `/demos` |
| `npm run data:check` | pasa (0 registros por encima del documento) |
| Producción | verificada en `3c8ed43`; el commit de scoring despliega solo al hacer push |

Las 21 barberías nuevas obtuvieron su Prospect Studio y su demo conceptual sin
tocar código: `generateStaticParams` las recoge del dataset.

**Aviso de SWC en Windows:** el build puede mostrar "Attempted to load
@next/swc-win32-x64-msvc … Una directiva de Control de aplicaciones bloqueó este
archivo". Next cae a WASM y compila igual. Es política del equipo, no un error
del proyecto.

**Nota sobre Windows/OneDrive:** si `npm run build` falla con
`EINVAL: readlink ... server-reference-manifest.js`, es un artefacto viciado en
`.next`, no un error de código. `rm -rf .next` y reconstruir.

---

## 5. Pendientes reales

1. **Aplicar las migraciones** (sección 0). Es el bloqueo principal.
2. **`npm run build`** sin verificar tras los cambios de scoring.
3. **Teselas de mapa con "API KEY REQUIRED".** CARTO ahora exige clave y afecta
   a los tres mapas (`RadarMap`, `LocatorMap`, `IncidentMap`). Es **previo** a
   este trabajo. Se dejó sin tocar porque elegir entre teselas claras sin clave
   o conseguir una clave es decisión del usuario. Hay una tarea en marcha en
   otra sesión (`task_87d1faf9`).
4. **Interfaz de subida de fotos** — bucket y políticas listos, falta el
   formulario.
5. **Panel de moderación** — las políticas de moderador existen y no hay
   pantalla que las use. Ascender a alguien a `moderator` se hace hoy desde el
   panel de Supabase.
6. **Reputación** — la columna existe, nadie la calcula.
7. **Límite de frecuencia** en `POST /api/incidents`. Hoy la única barrera es
   tener cuenta.
8. **`/pipeline` sigue en `localStorage`.** Migrarlo exigiría login obligatorio
   para uso interno; se dejó como estaba.
9. **Enriquecer los que vienen de AgendaPro**: rating, reseñas, teléfonos y
   actividad social siguen en `null` (confianza ~47). Dos vías comprobadas:
   buscar la ficha del negocio en **Fresha**, que sí publica reputación, y
   buscar su dominio propio, que suele traer teléfono, precios y horarios.
10. **Revisar las clases 3 y 4 ya cargadas.** Tras el caso Mapu, conviene
    comprobar si alguno de los demás "sin web" tiene en realidad dominio
    propio. Candidatos por volumen: los ocho de AgendaPro cargados el 30/08.

---

## 6. Reglas del proyecto que no hay que romper

- **No se inventa información.** Campo sin respaldo → `null`. Esto es el núcleo
  de la credibilidad del dataset.
- **Sólo canales corporativos públicos** (Ley N.º 19.628). Nada de teléfonos
  personales ni correos privados.
- **Sin servicios de pago ni dependencias nuevas.** La arquitectura es
  GitHub + Vercel + Supabase. Cartografía: CARTO/OSM sin token. Geocodificación:
  Nominatim, con su límite de 1 consulta/segundo respetado en el script.
- **No rediseñar la web.** Sólo se toca UI cuando hace falta para representar
  bien los datos (estados de carga, error, procedencia).
- **Nunca `force push`**, nunca desactivar RLS para arreglar un error, nunca
  `service_role` en el frontend, nunca secretos en `NEXT_PUBLIC_*`.
- **El documento canónico manda** sobre los 15 originales.

---

## 7. Documentación de referencia

- `docs/supabase-architecture.md` — modelo de datos, RLS, decisiones y por qué
  (por qué no PostGIS todavía, por qué el bucket es privado, por qué
  `leads.json` sigue existiendo).
- `data/README.md` — procedencia del dataset, reglas de normalización y cómo
  ampliarlo.
- `docs/Radar-de-Oportunidades-Valparaiso.docx` — documento canónico. La rúbrica
  de scoring está en § "Algoritmo del Priority Score".
