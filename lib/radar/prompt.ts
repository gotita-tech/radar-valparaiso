/**
 * Generador del prompt para Claude Code.
 *
 * Convierte datos + diagnóstico + oportunidad + solución en instrucciones
 * listas para pegar. El prompt lleva incorporadas las restricciones de no
 * invención: quien lo ejecute recibe la misma disciplina de datos que aplica
 * el Radar.
 */
import { buildDiagnosis, CLAIM_LABEL } from "./diagnosis";
import { channelsOf } from "./brief";
import { blueprintSummary, PRIORITY_LABEL } from "./solution";
import { NICHE_LABEL, TIER, WEB_CLASS, sourceLabel } from "./taxonomy";
import type { Lead } from "./types";

const NA = "No disponible";

export function buildClaudePrompt(lead: Lead, slug: string): string {
  const diagnosis = buildDiagnosis(lead);
  const blueprint = blueprintSummary(lead);
  const tier = TIER[lead.priority_tier];
  const webClass = WEB_CLASS[lead.website_classification];
  const channels = channelsOf(lead);

  const lines: string[] = [];
  const push = (...values: string[]) => lines.push(...values);

  push(`# MISIÓN`, "");
  push(`Construye una DEMO profesional de landing page para:`, "");
  push(`**${lead.business_name}**`, "");
  push(`Nicho:`, `${NICHE_LABEL[lead.niche]}${lead.subcategory ? ` — ${lead.subcategory}` : ""}`, "");
  push(`Ubicación:`, `${lead.commune}${lead.address ? ` — ${lead.address}` : ""}`, "");
  push(
    `Esta demo se construye como **propuesta conceptual** y NO debe presentarse como sitio oficial del establecimiento. Debe quedar visiblemente identificada como demo.`,
    "",
  );

  push(`# DATOS VERIFICADOS`, "");
  push(`Todo lo de esta sección proviene del dataset canónico del Opportunity Radar.`, "");
  push(`| Campo | Valor |`, `| --- | --- |`);
  push(`| Nombre comercial | ${lead.business_name} |`);
  push(`| Nicho | ${NICHE_LABEL[lead.niche]} |`);
  push(`| Comuna | ${lead.commune} |`);
  push(`| Dirección | ${lead.address ?? NA} |`);
  push(
    `| Coordenadas | ${lead.latitude !== null && lead.longitude !== null ? `${lead.latitude}, ${lead.longitude}` : NA} |`,
  );
  push(`| Presencia web | ${webClass.label} (${webClass.short}) |`);
  push(`| Sitio web | ${lead.website_url ?? NA} |`);
  push(`| Instagram | ${lead.instagram_url ?? NA} |`);
  push(`| WhatsApp Business | ${lead.whatsapp_business ?? NA} |`);
  push(`| Teléfono comercial | ${lead.public_business_phone ?? NA} |`);
  push(`| Correo corporativo | ${lead.public_business_email ?? NA} |`);
  push(`| Calificación pública | ${lead.rating !== null ? `${lead.rating} / 5` : NA} |`);
  push(`| Volumen de reseñas | ${lead.review_count !== null ? lead.review_count : NA} |`);
  push(`| Priority Score | ${lead.priority_score} / 100 (${tier.label}) |`);
  push(`| Confidence Score | ${lead.confidence_score} / 100 |`);
  push(`| Fuente primaria | ${sourceLabel(lead.source_primary)} |`, "");

  if (diagnosis.gaps.length) {
    push(`**Datos que NO tenemos** y que por tanto deben quedar como placeholder explícito:`, "");
    for (const gap of diagnosis.gaps) push(`- ${gap.label} (\`${gap.field}\`)`);
    push("");
  }

  push(`# PROBLEMA DIGITAL DETECTADO`, "");
  push(`**${diagnosis.problem.headline}**`, "");
  push(diagnosis.problem.body, "");
  push(`Señales que lo sustentan:`, "");
  for (const signal of diagnosis.signals.filter((s) => s.tone === "critical" || s.tone === "warning")) {
    push(`- [${CLAIM_LABEL[signal.kind].toUpperCase()}] ${signal.label} — \`${signal.evidence}\``);
  }
  push("");

  push(`# OPORTUNIDAD`, "");
  push(`- ${diagnosis.opportunity.improvement}`);
  push(`- ${diagnosis.opportunity.value}`);
  push(`- ${diagnosis.opportunity.facilitatedAction}`, "");
  push(`Activos que la landing puede capitalizar:`, "");
  const assets = diagnosis.signals.filter((s) => s.tone === "positive");
  if (assets.length) {
    for (const signal of assets) push(`- ${signal.label} — \`${signal.evidence}\``);
  } else {
    push(`- El dataset no registra activos reputacionales cuantificados para este prospecto.`);
  }
  push("");

  push(`# OBJETIVO PRINCIPAL`, "");
  push(blueprint.conversionGoal, "");
  push(
    `Toda decisión de diseño debe poder justificarse por su aporte a ese objetivo. Si un bloque no acerca al visitante a esa acción, no va.`,
    "",
  );

  push(`# FUNCIONALIDADES RECOMENDADAS`, "");
  push(`Tipo de landing: **${blueprint.landingType}**`, "");
  push(blueprint.scopeNote, "");
  for (const feature of blueprint.modules) {
    push(`### ${feature.label} — ${PRIORITY_LABEL[feature.priority]}`);
    push(feature.rationale);
    if (feature.source) push(`Dato disponible: \`${feature.source}\``);
    if (feature.needsData) push(`⚠ Pendiente: ${feature.needsData}`);
    push("");
  }

  push(`# DIRECCIÓN UX/UI`, "");
  push(
    `Diseña una landing altamente profesional y específica para este nicho. Debe parecer una propuesta diseñada para este negocio en particular, no una plantilla genérica rellenada.`,
    "",
  );
  push(`Prioriza:`, "");
  push(
    `- identidad visual propia del rubro y del local;`,
    `- jerarquía tipográfica clara;`,
    `- mobile first — la mayoría del tráfico local llega desde el teléfono;`,
    `- responsive real en desktop, tablet y móvil;`,
    `- performance: sin dependencias pesadas ni imágenes sin optimizar;`,
    `- conversión: la acción principal siempre alcanzable;`,
    `- llamadas a la acción claras y no repetitivas;`,
    `- microinteracciones discretas, nunca decorativas.`,
    "",
  );
  push(`Evita: cyberpunk, neón, gradientes gratuitos, glassmorphism sin motivo, tarjetas anidadas, emojis como sistema iconográfico y animaciones que no comuniquen nada.`, "");

  push(`# RESTRICCIONES`, "");
  push(`NO inventes:`, "");
  push(
    `- testimonios ni reseñas;`,
    `- precios;`,
    `- nombres de empleados;`,
    `- promociones u ofertas;`,
    `- fotografías presentadas como reales del local;`,
    `- datos comerciales;`,
    `- horarios;`,
    `- productos;`,
    `- servicios específicos no verificados.`,
    "",
  );
  push(
    `Cuando falte información, usa placeholders claramente identificados (por ejemplo \`[PENDIENTE: lista de servicios]\`) en vez de rellenar con datos plausibles. Un placeholder visible es correcto; un dato inventado no lo es.`,
    "",
  );
  if (lead.data_flags?.includes("placeholder_phone")) {
    push(
      `⚠ El teléfono y el WhatsApp de este registro tienen forma de número de relleno en la fuente. NO los publiques en la demo: usa un placeholder hasta verificar el número real.`,
      "",
    );
  }
  push(
    `La demo no debe enviar mensajes, correos ni contactar al negocio de ninguna forma automática.`,
    "",
  );

  push(`# CANALES DISPONIBLES`, "");
  if (channels.length) {
    for (const channel of channels) push(`- ${channel.label}: ${channel.value}`);
  } else {
    push(`- Ninguno registrado. Todos los contactos deben ser placeholders.`);
  }
  push("");

  push(`# FUENTES`, "");
  for (const url of lead.source_urls) push(`- ${url}`);
  push("");

  push(`# RESULTADO`, "");
  push(`La demo debe poder ejecutarse dentro del proyecto existente en:`, "");
  push("```text", `/demos/${slug}`, "```", "");
  push(
    `El proyecto es Next.js 15 (App Router) + TypeScript + TailwindCSS. Ya existe una ruta \`/demos/[slug]\` con una demo conceptual autogenerada: reemplázala o especialízala para este negocio manteniendo la marca visible de demo.`,
    "",
  );
  push(
    `No añadas backend, base de datos, autenticación ni variables de entorno. El despliegue es Vercel desde el mismo repositorio.`,
  );

  return lines.join("\n");
}

export function promptFilename(slug: string) {
  return `prompt-demo-${slug}.md`;
}
