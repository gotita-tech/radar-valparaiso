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

1. **Los scores no se recalculan.** `priority_score`, `confidence_score` y los
   cinco sub-scores se copian literalmente del suministro. El motor de scoring
   descrito en el documento queda documentado pero no se ejecuta en esta versión.
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

## Cobertura

15 negocios · 4 comunas (Valparaíso, Viña del Mar, Concón, Villa Alemana) ·
4 nichos (barbería, restaurante, bar, boutique).

Quilpué aparece en el documento como comuna de expansión, pero el dataset piloto
no contiene ningún negocio allí: la interfaz sólo muestra las comunas realmente
presentes en los datos.

Ningún negocio del piloto alcanza el rango VERY HIGH (≥ 85). El máximo es
`b001` con 83. El KPI se mantiene por completitud del modelo.
