# Dataset — Opportunity Radar Valparaíso

## Fuente canónica

`docs/Radar-de-Oportunidades-Valparaiso.docx`

Todo el contenido de `leads.json` procede de ese documento. En concreto de:

| Origen en el documento | Qué aporta |
| --- | --- |
| Tabla E — `leads_raw.csv` | nombre, nicho, comuna, dirección, teléfono público, dominio web, fuente primaria |
| Tabla F — `leads_enriched.csv` | latitud, longitud, clasificación web y los cinco sub-scores, Priority y Confidence |
| Formato G — `leads.json` | registro completo de `b001` y los valores de ejemplo del diccionario de datos, citados a María Clarita (`b002`) |
| Tabla I — `top_prospects.csv` | líneas de explicabilidad de `b001`, `b004`, `b005`, `b010`, `b011`, `b012` |
| § Recomendaciones comerciales | `evidence_notes` de los prospectos de barbería y de Tutti Foods |
| Obras citadas | `source_urls` de cada negocio |

`docs/deep-research-report.md` se conserva **sólo como contexto conceptual y
comercial**. Ninguno de sus negocios (España, casos simulados) entra en el
dataset.

## Reglas aplicadas

1. **Los 15 originales no se recalculan.** Para ellos, `priority_score`,
   `confidence_score` y los cinco sub-scores se copian literalmente del
   suministro. `scoring_source: "document"` los identifica y el pipeline de
   incorporación se niega a tocarlos.

   Los registros añadidos después llevan `scoring_source: "engine"` y sus
   scores los calcula `lib/radar/scoring.ts`, que implementa la rúbrica del
   propio documento. **No son comparables sin más:** el motor no puntúa lo que
   no se ha comprobado, así que un registro con auditoría incompleta queda por
   debajo de uno del documento aunque el negocio sea equivalente. La ficha del
   prospecto lo advierte.
2. **No se inventa información.** Cualquier campo del esquema canónico sin
   respaldo documental queda en `null`.
3. **Campos derivados por definición**, no por inferencia: `has_website` y
   `social_only_presence` se deducen de `website_classification` según la propia
   definición de las categorías (0–4), y `priority_tier` de los rangos
   0–39 / 40–59 / 60–74 / 75–84 / 85–100.
4. **Sólo canales corporativos públicos.** No hay teléfonos personales,
   domicilios particulares ni correos privados, conforme a la Ley N.º 19.628 y a
   la sección de cumplimiento normativo del documento.

## Validaciones que cumple el dataset

- Los cinco sub-scores suman exactamente el `priority_score` en los 15 registros.
- El `priority_tier` coincide con el rango que le corresponde al `priority_score`.
- Las líneas de `score_explanations` **no** suman el total: en el documento son
  un extracto de evidencia, no un desglose exhaustivo. La aplicación lo declara
  explícitamente en la ficha del prospecto.

## `data_flags`

Único campo añadido durante la normalización. No altera ningún valor del
suministro: marca un problema de calidad detectado en él.

- `placeholder_phone` (`b001`): el teléfono y WhatsApp del fragmento de ejemplo
  del documento (`+56912345678`) tienen forma de número de relleno. El valor se
  conserva por fidelidad a la fuente, pero la interfaz oculta el acceso rápido a
  WhatsApp y muestra una advertencia en la ficha.

## Regenerar el GeoJSON

`leads.geojson` y su copia servible `public/data/leads.geojson` se derivan de
`leads.json`. Tras editar el JSON:

```bash
npm run data:build
```

La aplicación no hace `fetch` de estos archivos: importa `leads.json` en tiempo
de compilación y construye la `FeatureCollection` en memoria
(`lib/radar/data.ts`). Los `.geojson` existen como artefacto exportable y para
descarga directa desde `/data/leads.geojson`.

## Ampliar el dataset

```bash
# 1. Escribe hechos observables en data/intake/*.json (NO scores)
# 2. Rellena coordenadas desde OpenStreetMap
npm run data:geocode
# 3. Valida, puntúa con el motor y fusiona en leads.json
npm run data:ingest
# 4. Regenera GeoJSON y la migración de semilla
npm run data:build && npm run data:seed
```

`npm run data:check` contrasta el motor contra los 15 del documento. El motor
debe quedar **por debajo**, nunca por encima: si sobrepasa, la rúbrica está mal
implementada y el script falla.

### Qué se escribe en un intake

Hechos, no puntuaciones. Cada registro necesita como mínimo `business_id`,
`business_name`, `niche`, `commune`, `website_classification`, `source_primary`,
`source_urls` y `retrieved_at`, más un bloque `audit` con las señales que el
esquema canónico no guarda (responsividad, HTTPS, actividad social, antigüedad,
fuentes independientes).

En `audit`, `null` significa "no comprobado" y **nunca suma puntos**. Es
deliberado: es preferible un registro honesto con confianza 47 que uno inventado
con confianza 90.

El validador rechaza el lote entero si algo no cuadra —clase web incoherente con
`website_url`, `source_urls` vacío, coordenadas fuera de la región, id duplicado,
o un intento de repuntuar uno de los 15 del documento— y no escribe nada.

## Cobertura

31 negocios · 6 comunas (Valparaíso, Viña del Mar, Concón, Villa Alemana,
Quilpué, La Calera) · 4 nichos.

Por nicho: 24 barberías, 5 restaurantes, 1 bar, 1 boutique.

La ampliación de agosto de 2026 añadió 16 barberías reales verificadas en
AgendaPro y en el sitio propio del negocio. De ellas, 15 tienen coordenadas
resueltas contra OpenStreetMap; Muski Barber Shop se queda sin ubicación porque
Nominatim no resuelve su dirección, y no se inventa una.

De esas 16, quince operan **sin sitio web propio** (clase 3, sólo agregador o
redes). La excepción es Cambia tu Look, que sí tiene web con reservas y precios
y por eso puntúa LOW: no necesita lo que vendemos. Sirve de contraste y alimenta
el cálculo de brecha competitiva de sus vecinos.

Ningún negocio del piloto alcanza el rango VERY HIGH (≥ 85). El máximo es
`b001` con 83. El KPI se mantiene por completitud del modelo.
