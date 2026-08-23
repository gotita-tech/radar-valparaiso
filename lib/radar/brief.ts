/**
 * Generador de Prospect Brief en Markdown.
 *
 * Compone el diagnóstico determinista y el blueprint del nicho en un documento
 * listo para leer, compartir o adjuntar. No añade ninguna afirmación que no
 * provenga del dataset o de los motores de diagnóstico y solución.
 */
import { buildDiagnosis, CLAIM_LABEL } from "./diagnosis";
import { blueprintSummary, PRIORITY_LABEL } from "./solution";
import { DIMENSION, DIMENSION_ORDER, NICHE_LABEL, TIER, WEB_CLASS, sourceLabel } from "./taxonomy";
import type { Lead, ScoreDimension } from "./types";

const NA = "No disponible";

function dimensionValue(lead: Lead, dimension: ScoreDimension) {
  switch (dimension) {
    case "digital_need":
      return lead.digital_need_score;
    case "commercial_attractiveness":
      return lead.commercial_attractiveness_score;
    case "contactability":
      return lead.contactability_score;
    case "landing_fit":
      return lead.landing_fit_score;
    case "local_opportunity":
      return lead.local_opportunity_score;
  }
}

export function channelsOf(lead: Lead) {
  const channels: { label: string; value: string; href: string }[] = [];
  if (lead.website_url)
    channels.push({ label: "Sitio web", value: lead.website_url, href: lead.website_url });
  if (lead.instagram_url)
    channels.push({ label: "Instagram", value: lead.instagram_url, href: lead.instagram_url });
  if (lead.whatsapp_business)
    channels.push({
      label: "WhatsApp Business",
      value: lead.whatsapp_business,
      href: `https://wa.me/${lead.whatsapp_business.replace(/[^\d]/g, "")}`,
    });
  if (lead.public_business_phone)
    channels.push({
      label: "Teléfono comercial",
      value: lead.public_business_phone,
      href: `tel:${lead.public_business_phone.replace(/[^\d+]/g, "")}`,
    });
  if (lead.public_business_email)
    channels.push({
      label: "Correo corporativo",
      value: lead.public_business_email,
      href: `mailto:${lead.public_business_email}`,
    });
  return channels;
}

export function buildBrief(lead: Lead): string {
  const diagnosis = buildDiagnosis(lead);
  const blueprint = blueprintSummary(lead);
  const tier = TIER[lead.priority_tier];
  const webClass = WEB_CLASS[lead.website_classification];
  const channels = channelsOf(lead);

  const lines: string[] = [];
  const push = (...values: string[]) => lines.push(...values);

  push(`# PROSPECT BRIEF`, "");
  push(
    `> Generado por Opportunity Radar a partir del dataset canónico. Sin llamadas a servicios externos.`,
    "",
  );

  push(`## Negocio`, "", `**${lead.business_name}**`, "");
  if (lead.subcategory) push(`Subcategoría: ${lead.subcategory}`, "");
  push(`ID interno: \`${lead.business_id}\``, "");

  push(`## Nicho`, "", NICHE_LABEL[lead.niche], "");

  push(`## Ubicación`, "");
  push(`- Comuna: ${lead.commune}`);
  push(`- Dirección: ${lead.address ?? NA}`);
  push(
    `- Coordenadas: ${
      lead.latitude !== null && lead.longitude !== null
        ? `${lead.latitude}, ${lead.longitude}`
        : NA
    }`,
    "",
  );

  push(`## Priority Score`, "");
  push(`**${lead.priority_score} / 100** — ${tier.label} (${tier.range})`, "");
  push(`${tier.action}`, "");
  push(`| Dimensión | Puntaje | Máximo |`, `| --- | ---: | ---: |`);
  for (const dimension of DIMENSION_ORDER) {
    push(
      `| ${DIMENSION[dimension].label} | ${dimensionValue(lead, dimension)} | ${DIMENSION[dimension].max} |`,
    );
  }
  push("");

  push(`## Confidence Score`, "");
  push(`**${lead.confidence_score} / 100**`, "");
  push(
    lead.confidence_score < 65
      ? `Por debajo del umbral de 65: el documento canónico exige validación humana antes de iniciar contacto comercial.`
      : `Dentro del rango fiable para operar sin validación adicional.`,
    "",
  );

  push(`## Evidencia disponible`, "");
  push(`- Presencia web: ${webClass.label} (${webClass.short})`);
  push(`- Fuente primaria de descubrimiento: ${sourceLabel(lead.source_primary)}`);
  push(`- Calificación pública: ${lead.rating !== null ? `${lead.rating} / 5` : NA}`);
  push(`- Volumen de reseñas: ${lead.review_count !== null ? lead.review_count : NA}`);
  push(`- Actividad social: ${lead.social_activity ?? NA}`);
  push(`- Antigüedad observada: ${lead.business_age_signal ?? NA}`);
  if (lead.evidence_notes) push(`- Nota del auditor: ${lead.evidence_notes}`);
  push(`- Datos recuperados el: ${new Date(lead.retrieved_at).toLocaleDateString("es-CL")}`, "");

  if (diagnosis.gaps.length) {
    push(`### Vacíos de información`, "");
    for (const gap of diagnosis.gaps) push(`- **${gap.label}** (\`${gap.field}\`) — ${gap.impact}`);
    push("");
  }

  push(`## Señales detectadas`, "");
  for (const signal of diagnosis.signals) {
    push(`- **[${CLAIM_LABEL[signal.kind].toUpperCase()}] ${signal.label}** — ${signal.detail}`);
    push(`  - Respaldo: \`${signal.evidence}\``);
  }
  push("");

  push(`## Problema digital`, "");
  push(`**${diagnosis.problem.headline}**`, "");
  push(diagnosis.problem.body, "");

  push(`## Oportunidad comercial`, "");
  push(`- **Qué puede mejorarse:** ${diagnosis.opportunity.improvement}`);
  push(`- **Por qué aporta valor una landing:** ${diagnosis.opportunity.value}`);
  push(`- **Qué acción debe facilitar:** ${diagnosis.opportunity.facilitatedAction}`);
  push(`- **Advertencia:** ${diagnosis.opportunity.caveat}`, "");

  push(`## Solución recomendada`, "");
  push(`**${blueprint.landingType}**`, "");
  push(`${blueprint.scopeNote}`, "");

  push(`## Objetivo de conversión`, "");
  push(blueprint.conversionGoal, "");

  push(`## Funcionalidades sugeridas`, "");
  for (const feature of blueprint.modules) {
    push(`- **${feature.label}** _(${PRIORITY_LABEL[feature.priority]})_ — ${feature.rationale}`);
    if (feature.source) push(`  - Alimentado por: \`${feature.source}\``);
    if (feature.needsData) push(`  - Pendiente: ${feature.needsData}`);
  }
  push("");

  push(`## Canales disponibles`, "");
  if (channels.length) {
    for (const channel of channels) push(`- ${channel.label}: ${channel.value}`);
  } else {
    push(`- Ningún canal corporativo público registrado en el dataset.`);
  }
  if (lead.data_flags?.includes("placeholder_phone")) {
    push(
      "",
      `> ⚠ El teléfono y el WhatsApp de este registro provienen del fragmento de ejemplo del documento canónico y tienen forma de número de relleno. Verifica el número real antes de cualquier gestión.`,
    );
  }
  push("");

  push(`## Fuentes`, "");
  for (const url of lead.source_urls) push(`- ${url}`);
  push("");

  push(`---`, "");
  push(
    `Documento canónico: \`docs/Radar-de-Oportunidades-Valparaiso.docx\`. Los scores no se recalculan en esta versión.`,
  );

  return lines.join("\n");
}

export function briefFilename(lead: Lead, slug: string) {
  return `brief-${slug}.md`;
}
