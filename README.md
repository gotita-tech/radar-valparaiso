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
components/
  Navbar.tsx
  Hero.tsx
  About.tsx
  Services.tsx
  Methodology.tsx
  Projects.tsx
  TechStack.tsx
  ValueProposition.tsx
  CTAFinal.tsx
  Footer.tsx
  GrandHallBackdrop.tsx   Fondo ambiental de claroscuro, toda la página
  ui/HankoSeal.tsx        Elemento de firma visual (sello / hanko)
  ui/LuxuryButton.tsx     Botón con brillo al hover + sonido metálico
  three/GoldParticlesScene.tsx    Escena 3D (partículas + anillo doradas)
  three/GoldParticlesCanvas.tsx   Carga la escena solo en el navegador
hooks/
  useMetallicChime.ts     Sintetiza el sonido con Web Audio API (sin mp3)
public/
  favicon.svg
```

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
