# Landing Page Personal — IA, Automatización & Desarrollo

Landing page premium de una sola página, construida para transmitir estrategia, dominio técnico y uso inteligente de la Inteligencia Artificial. Estética inspirada en el Japón clásico: lujo minimalista, negro profundo, acentos dorados, tipografía con carácter.

**Stack:** Next.js 15 (App Router) · React · TypeScript · TailwindCSS · Framer Motion · Lucide Icons · Three.js / React Three Fiber

---

## Estructura

```
app/
  layout.tsx        Metadata, SEO, Open Graph, Twitter Cards, fuentes
  page.tsx           Ensambla todas las secciones
  globals.css        Estilos base, patrones (seigaiha, tinta), accesibilidad
  sitemap.ts          Sitemap dinámico
  robots.ts           robots.txt dinámico
  radar/page.tsx     Opportunity Radar
  prospects/[slug]/  Prospect Studio por prospecto
  demos/[slug]/      Concept demo por prospecto
  pipeline/page.tsx  Embudo comercial local
components/
  Navbar.tsx
  Hero.tsx
  About.tsx
  Services.tsx
  Methodology.tsx
  Projects.tsx
  RadarShowcase.tsx       Sección de la landing que presenta el Opportunity Radar
  TechStack.tsx
  ValueProposition.tsx
  CTAFinal.tsx
  Footer.tsx
  GrandHallBackdrop.tsx   Fondo ambiental de claroscuro, toda la página
  ui/HankoSeal.tsx        Elemento de firma visual (sello / hanko)
  ui/LuxuryButton.tsx     Botón con brillo al hover + sonido metálico
  three/GoldParticlesScene.tsx    Escena 3D (partículas + anillo doradas)
  three/GoldParticlesCanvas.tsx   Carga la escena solo en el navegador
  radar/                  Aplicación Opportunity Radar (dashboard, mapa, filtros, ficha)
  prospect/               Prospect Studio: score, señales, solución, entregables
  demos/                  Plantilla de demo conceptual por nicho
  pipeline/               Vista de embudo (columnas y tabla)
hooks/
  useMetallicChime.ts     Sintetiza el sonido con Web Audio API (sin mp3)
lib/
  site-config.ts          Datos del sitio (URL, contacto, WhatsApp)
  radar/                  Tipos, taxonomía, filtros, métricas, exportación,
                          diagnóstico, soluciones, brief, prompt y pipeline local
data/
  leads.json              Dataset canónico (fuente de verdad)
  leads.geojson           FeatureCollection derivada
  README.md               Procedencia y reglas de normalización de los datos
docs/
  Radar-de-Oportunidades-Valparaiso.docx   Documento canónico
  deep-research-report.md                  Contexto comercial (no alimenta el dataset)
scripts/
  build-geojson.mjs       Deriva los .geojson desde leads.json
public/
  favicon.svg
  data/leads.geojson      Copia servible del GeoJSON
```

---

## Opportunity Radar — Región de Valparaíso

Ruta: `/radar`

Dashboard de inteligencia comercial y geoespacial que detecta, califica y prioriza
negocios con brecha digital en la Región de Valparaíso.

### Qué incluye

- **KPIs**: total de negocios, prospectos HIGH y VERY HIGH, negocios sin sitio web,
  Priority Score promedio y Confidence Score promedio.
- **Filtros** en panel lateral: comuna, nicho, umbral de Priority Score
  (todos / ≥ 60 / ≥ 75 / ≥ 85), estado web y contactabilidad, más búsqueda por
  nombre, dirección o comuna. Todos afectan a la vez a métricas, mapa, densidad,
  ranking y listado.
- **Mapa** Leaflet + OpenStreetMap **sin token ni variables de entorno**, con
  clustering propio, capa de densidad ponderada por Priority Score, tooltips,
  popup con acciones y dos bases cartográficas (oscura y OSM estándar).
- **Ranking** *Top Opportunities* y **listado** con ordenamiento por columna
  (tabla en desktop, cards en móvil).
- **Ficha del prospecto**: Opportunity Score, Confidence, desglose de las cinco
  dimensiones, evidencia trazable, diagnóstico digital, oportunidad comercial,
  solución recomendada y enlaces reales a web, Instagram, WhatsApp, teléfono,
  correo y fuentes.
- **Exportación** a CSV y GeoJSON de la selección visible.

### Arquitectura

Sin backend, sin base de datos, sin autenticación y sin APIs privadas: la
aplicación importa `data/leads.json` en tiempo de compilación y resuelve todo en
el cliente sobre datos locales del repositorio.

La procedencia de cada campo y las reglas de normalización están en
[`data/README.md`](data/README.md).

### Regenerar el GeoJSON tras editar el dataset

```bash
npm run data:build
```

---

## Prospect Studio — del dato a la demo

Ruta: `/prospects/[slug]` · una página por prospecto, generada estáticamente.

El recorrido completo es: **Radar → Prospecto → Diagnóstico → Solución → Brief →
Prompt → Demo**, sin volver a escribir ningún dato.

### Motores deterministas

Nada de esto llama a una API de IA. Son reglas fijas sobre el dataset: el mismo
lead produce siempre el mismo resultado.

| Módulo | Qué hace |
| --- | --- |
| `lib/radar/diagnosis.ts` | Señales detectadas, vacíos de información, problema digital y oportunidad comercial |
| `lib/radar/solution.ts` | Blueprint de landing por nicho: módulos, prioridad y objetivo de conversión |
| `lib/radar/brief.ts` | Prospect Brief en Markdown |
| `lib/radar/prompt.ts` | Prompt listo para pegar en Claude Code |

Cada afirmación se etiqueta como **hecho** (está en el dataset, con el campo
citado), **inferencia** (lectura contra un umbral del modelo) o **recomendación**
(propuesta comercial). Un campo `null` significa "no lo sabemos" y nunca produce
una señal afirmativa: se declara como vacío y se arrastra al brief y al prompt
como pendiente.

### Demo conceptual

Ruta: `/demos/[slug]`

Vista previa marcada como **CONCEPT DEMO** que usa sólo datos del dataset y
placeholders explícitos para todo lo demás. No es el sitio oficial de ningún
establecimiento y no se indexa. Cuando exista una demo real, basta con añadir
`demo_url` al lead en `data/leads.json` para que el botón "Ver demo" aparezca en
el studio; mientras tanto muestra "Demo pendiente".

### Pipeline comercial local

Ruta: `/pipeline`

Nueve estados (NEW → ANALYZED → BRIEF_READY → DEMO_READY → CONTACTED →
RESPONDED → MEETING → WON, más LOST) y una nota privada por prospecto.

Todo vive en `localStorage` bajo la clave
`opportunity-radar:pipeline:v1`. **No hay backend ni sincronización**: si se
limpia el navegador o se abre el proyecto en otro equipo, esa información no
está. La interfaz lo advierte en cada punto donde se escribe.

---

## Antes de publicar: personaliza estos puntos

Tu nombre, correo y teléfono ya están cargados en el sitio (Navbar, Footer, CTA final y metadata). Lo que queda pendiente:

| Dónde | Qué cambiar |
|---|---|
| `app/layout.tsx` | `siteUrl` — el dominio final una vez despliegues en Vercel |
| `components/Navbar.tsx`, `Footer.tsx` | Enlaces reales a LinkedIn / GitHub (ahora apuntan a marcadores de posición) |
| `components/Hero.tsx`, `CTAFinal.tsx` | Si prefieres agendar reuniones por Calendly/Cal.com en vez de email, cambia el `href` del botón "Agendar reunión" |
| `components/About.tsx` | Texto de "Sobre mí" — ajústalo a tu historia real si quieres afinarlo más |
| `components/Projects.tsx` | Proyectos reales con resultados verificables |
| `public/og-image.png` | Añade una imagen 1200×630 para redes sociales (referenciada en `layout.tsx`) |

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # build de producción
npm run lint    # comprobación de calidad de código
```

---

## Publicar en GitHub

Este entorno de chat no tiene acceso a internet, así que estos comandos los ejecutas tú (2 minutos):

```bash
cd personal-landing
git init
git add .
git commit -m "Landing page inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/personal-landing.git
git push -u origin main
```

Si no tienes el repositorio creado aún, créalo primero en [github.com/new](https://github.com/new) (sin README, sin .gitignore — ya están incluidos aquí).

---

## Desplegar en Vercel

**Opción A — Web (recomendada, sin comandos):**
1. Entra a [vercel.com/new](https://vercel.com/new)
2. Importa el repositorio de GitHub que acabas de crear
3. Vercel detecta Next.js automáticamente — pulsa **Deploy**
4. En 1–2 minutos tendrás tu URL: `tu-proyecto.vercel.app`

**Opción B — CLI:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

Después de desplegar, actualiza `siteUrl` en `app/layout.tsx`, `app/sitemap.ts` y `app/robots.ts` con tu dominio real de Vercel (o tu dominio propio) y vuelve a desplegar.

---

## Notas de diseño

- **Paleta:** negro profundo `#0A0A0A` / carbón `#121212`, acentos dorados `#C9A227` y `#D4AF37`, texto `#F5F5F5` / `#D9D9D9`.
- **Tipografía:** Inter (UI/cuerpo), Playfair Display (titulares), Noto Serif JP (acentos/eyebrows).
- **Elemento de firma:** un sello (*hanko*) dibujado en SVG, como los que un artesano estampa para autentificar su trabajo — aparece en el hero y en el CTA final.
- **Patrones:** olas *seigaiha* y un fondo de tinta (*sumi-e*) generados con CSS puro, sin imágenes pesadas.
- **Fondo ambiental:** `GrandHallBackdrop` recrea el claroscuro y la simetría de un gran salón renacentista —arcos en perspectiva, luz cálida central— sin reproducir ninguna obra ni figura reconocible.
- **3D:** `GoldParticlesScene` (Three.js / React Three Fiber) dibuja polvo dorado flotante y un anillo fino detrás del titular del hero. Se carga solo en el navegador (`ssr: false`) porque WebGL no existe en el servidor.
- **Sonido:** cada botón reproduce un tintineo metálico sintetizado en tiempo real con la Web Audio API (`hooks/useMetallicChime.ts`) — no hay ningún archivo `.mp3`, así que no pesa nada en la carga. Los navegadores requieren un gesto del usuario antes de reproducir audio; el primer hover lo activa automáticamente.
- **Animaciones:** Framer Motion, entradas suaves ≤300ms, `prefers-reduced-motion` respetado.
- **Accesibilidad:** foco de teclado visible en toda la interfaz, contraste AA sobre fondo oscuro.
