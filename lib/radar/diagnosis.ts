/**
 * Motor de diagnóstico determinista.
 *
 * Lee exclusivamente los campos que ya existen en el dataset canónico y los
 * interpreta con reglas fijas. Mismo lead ⇒ mismo diagnóstico, siempre.
 *
 * Cada afirmación se etiqueta según su naturaleza epistémica:
 *
 *  · HECHO          — el dato está en el suministro. Se cita el campo.
 *  · INFERENCIA     — lectura de un dato existente contra un umbral del modelo.
 *  · RECOMENDACIÓN  — propuesta comercial derivada del diagnóstico.
 *
 * Regla dura: `null` significa "no sabemos", nunca "no tiene". Un campo nulo
 * jamás produce una señal afirmativa; produce, como mucho, un vacío declarado.
 */
import { NICHE_LABEL, WEB_CLASS, sourceLabel } from "./taxonomy";
import type { Lead, Niche } from "./types";

export type ClaimKind = "fact" | "inference" | "recommendation";

export type SignalTone = "critical" | "warning" | "neutral" | "positive";

export type Signal = {
  id: string;
  kind: ClaimKind;
  tone: SignalTone;
  label: string;
  detail: string;
  /** Campo del esquema canónico que respalda la señal. */
  evidence: string;
};

export type DataGap = {
  field: string;
  label: string;
  impact: string;
};

export const CLAIM_LABEL: Record<ClaimKind, string> = {
  fact: "Hecho",
  inference: "Inferencia",
  recommendation: "Recomendación",
};

export const CLAIM_DESCRIPTION: Record<ClaimKind, string> = {
  fact: "El dato está registrado en el dataset canónico. Se cita el campo de origen.",
  inference:
    "Lectura de un dato existente contra los umbrales del modelo de scoring del documento.",
  recommendation:
    "Propuesta comercial derivada del diagnóstico. No es un dato observado del negocio.",
};

/* ------------------------------------------------------------------------- */
/* Señales                                                                    */
/* ------------------------------------------------------------------------- */

const DEPENDENCY_SOURCES: Record<string, { label: string; detail: string }> = {
  agendapro: {
    label: "Depende de una plataforma de agendamiento externa",
    detail:
      "Su descubrimiento comercial ocurre dentro de AgendaPro, donde comparte espacio con competidores directos y no controla su propio posicionamiento.",
  },
  fresha: {
    label: "Depende de una plataforma de agendamiento externa",
    detail:
      "Su descubrimiento comercial ocurre dentro de Fresha, donde comparte espacio con competidores directos y no controla su propio posicionamiento.",
  },
  delivery_app: {
    label: "Depende de aplicaciones de delivery",
    detail:
      "El canal de pedidos vive en plataformas de terceros que intermedian la relación con el cliente y erosionan el margen por comisiones.",
  },
  social_news: {
    label: "Descubierto a través de prensa y redes sociales",
    detail:
      "No se localizó un canal corporativo propio durante la ingesta; la trazabilidad proviene de cobertura externa.",
  },
};

export function buildSignals(lead: Lead): Signal[] {
  const signals: Signal[] = [];
  const webClass = WEB_CLASS[lead.website_classification];

  /* --- Presencia web (HECHO: clasificación explícita del dataset) --------- */
  if (lead.website_classification === 4) {
    signals.push({
      id: "web-none",
      kind: "fact",
      tone: "critical",
      label: "No se encontró sitio web propio",
      detail:
        "Tras agotar los protocolos de búsqueda no se localizó dominio ni perfil digital propio. El documento canónico lo interpreta como ausencia no detectada, no como certeza de inexistencia.",
      evidence: "website_classification = 4 (NO_WEBSITE_FOUND)",
    });
  } else if (lead.website_classification === 3) {
    signals.push({
      id: "web-social-only",
      kind: "fact",
      tone: "critical",
      label: "Presencia únicamente social o en agregadores",
      detail:
        "Opera su presencia digital a través de redes sociales o perfiles de terceros, sin activo web propio.",
      evidence: "website_classification = 3 (SOCIAL_ONLY)",
    });
  } else if (lead.website_classification === 2) {
    signals.push({
      id: "web-minimal",
      kind: "fact",
      tone: "warning",
      label: "Presencia web mínima",
      detail:
        "Mono-página sin contenido transaccional o plantilla genérica sin configurar.",
      evidence: "website_classification = 2 (MINIMAL)",
    });
  } else if (lead.website_classification === 1) {
    signals.push({
      id: "web-improvable",
      kind: "fact",
      tone: "warning",
      label: "Presencia digital mejorable",
      detail:
        "Existe sitio propio, pero con deficiencias técnicas o de diseño relevantes según la clasificación del suministro.",
      evidence: "website_classification = 1 (IMPROVABLE)",
    });
  } else {
    signals.push({
      id: "web-good",
      kind: "fact",
      tone: "positive",
      label: "Sitio web propio en buen estado",
      detail:
        "Dominio propio activo con diseño moderno y llamadas a la acción claras. La necesidad digital de base es baja.",
      evidence: "website_classification = 0 (GOOD)",
    });
  }

  if (lead.website_quality) {
    signals.push({
      id: "web-quality",
      kind: "fact",
      tone: "neutral",
      label: "Calidad web observada",
      detail: lead.website_quality,
      evidence: "website_quality",
    });
  }

  /* --- Dependencia de terceros (HECHO: fuente primaria de descubrimiento) - */
  const dependency = DEPENDENCY_SOURCES[lead.source_primary];
  if (dependency) {
    signals.push({
      id: "third-party-dependency",
      kind: "fact",
      tone: lead.source_primary === "social_news" ? "neutral" : "critical",
      label: dependency.label,
      detail: dependency.detail,
      evidence: `source_primary = "${lead.source_primary}" (${sourceLabel(lead.source_primary)})`,
    });
  }

  /* --- Carencias de conversión: SÓLO cuando el dataset dice false --------- */
  if (lead.online_booking === false && (lead.niche === "barbershop" || lead.niche === "restaurant")) {
    signals.push({
      id: "no-booking",
      kind: "fact",
      tone: "warning",
      label: "Sin motor de reservas propio",
      detail:
        "No dispone de sistema de agendamiento o reserva bajo su control, pese a ser un rubro donde la reserva es el acto de conversión principal.",
      evidence: "online_booking = false",
    });
  }
  if (lead.online_menu === false && (lead.niche === "restaurant" || lead.niche === "bar")) {
    signals.push({
      id: "no-menu",
      kind: "fact",
      tone: "warning",
      label: "Sin menú digital estructurado",
      detail:
        "La carta no está publicada en un formato navegable propio, lo que obliga al cliente a buscarla en canales de terceros.",
      evidence: "online_menu = false",
    });
  }
  if (lead.online_catalog === false && lead.niche === "boutique") {
    signals.push({
      id: "no-catalog",
      kind: "fact",
      tone: "warning",
      label: "Sin catálogo de producto visible",
      detail: "No se detectó catálogo o muestrario estructurado bajo dominio propio.",
      evidence: "online_catalog = false",
    });
  }

  /* --- Tracción comercial (HECHO cuando hay número, INFERENCIA al calificar) */
  if (lead.review_count !== null) {
    const volumeTone = lead.review_count >= 150 ? "positive" : "neutral";
    signals.push({
      id: "review-volume",
      kind: "fact",
      tone: volumeTone,
      label:
        lead.review_count >= 150
          ? `Alto volumen de reseñas (${lead.review_count})`
          : `Volumen de reseñas registrado (${lead.review_count})`,
      detail:
        lead.review_count >= 150
          ? "Demuestra flujo comercial maduro y sostenido: hay demanda real que hoy no aterriza en un activo propio."
          : "Existe registro público de reseñas asociado al establecimiento.",
      evidence: `review_count = ${lead.review_count}`,
    });
  }

  if (lead.rating !== null) {
    signals.push({
      id: "rating",
      kind: "fact",
      tone: lead.rating >= 4.5 ? "positive" : "neutral",
      label: `Calificación pública ${lead.rating.toFixed(1)} / 5`,
      detail:
        lead.rating >= 4.5
          ? "Reputación sobresaliente: el activo reputacional ya existe y puede capitalizarse en una landing propia."
          : "Calificación pública registrada en el dataset.",
      evidence: `rating = ${lead.rating}`,
    });
  }

  if (lead.social_activity === "high") {
    signals.push({
      id: "social-activity",
      kind: "fact",
      tone: "positive",
      label: "Actividad digital alta",
      detail:
        "Publica con frecuencia en redes sociales, lo que indica un equipo capaz de mantener contenido actualizado.",
      evidence: 'social_activity = "high"',
    });
  }

  if (lead.multiple_locations === true) {
    signals.push({
      id: "multi-location",
      kind: "fact",
      tone: "positive",
      label: "Opera múltiples sucursales",
      detail: "La estructura operativa sugiere capacidad de inversión superior a la media del rubro.",
      evidence: "multiple_locations = true",
    });
  }

  if (lead.business_age_signal) {
    signals.push({
      id: "age-signal",
      kind: "fact",
      tone: "neutral",
      label: "Señal de antigüedad operativa",
      detail: lead.business_age_signal,
      evidence: "business_age_signal",
    });
  }

  /* --- Canales de contacto (HECHO: presencia del campo) ------------------- */
  const channels: string[] = [];
  if (lead.whatsapp_business) channels.push("WhatsApp Business");
  if (lead.public_business_phone) channels.push("teléfono comercial");
  if (lead.public_business_email) channels.push("correo corporativo");
  if (lead.instagram_url) channels.push("Instagram");
  if (channels.length) {
    signals.push({
      id: "channels",
      kind: "fact",
      tone: "positive",
      label: `${channels.length} canal${channels.length === 1 ? "" : "es"} público${channels.length === 1 ? "" : "s"} disponible${channels.length === 1 ? "" : "s"}`,
      detail: `Canales corporativos registrados: ${channels.join(", ")}.`,
      evidence: "whatsapp_business · public_business_phone · public_business_email · instagram_url",
    });
  }

  /* --- Inferencias sobre los sub-scores del modelo ------------------------ */
  if (lead.digital_need_score >= 30) {
    signals.push({
      id: "need-critical",
      kind: "inference",
      tone: "critical",
      label: "Necesidad digital crítica",
      detail: `Digital Need ${lead.digital_need_score}/40 sitúa al prospecto en el tramo alto de carencia de infraestructura digital propia.`,
      evidence: `digital_need_score = ${lead.digital_need_score}`,
    });
  } else if (lead.digital_need_score >= 16) {
    signals.push({
      id: "need-moderate",
      kind: "inference",
      tone: "warning",
      label: "Necesidad digital moderada",
      detail: `Digital Need ${lead.digital_need_score}/40: hay margen de mejora, pero no partimos de cero.`,
      evidence: `digital_need_score = ${lead.digital_need_score}`,
    });
  }

  if (lead.commercial_attractiveness_score >= 20) {
    signals.push({
      id: "attractiveness-high",
      kind: "inference",
      tone: "positive",
      label: "Alta atractividad comercial",
      detail: `Commercial Attractiveness ${lead.commercial_attractiveness_score}/25: reputación, demanda y robustez aparente por encima de la media del piloto.`,
      evidence: `commercial_attractiveness_score = ${lead.commercial_attractiveness_score}`,
    });
  }

  if (lead.contactability_score >= 12) {
    signals.push({
      id: "contactability-high",
      kind: "inference",
      tone: "positive",
      label: "Buen nivel de contactabilidad",
      detail: `Contactability ${lead.contactability_score}/15: existen vías directas para abrir conversación comercial.`,
      evidence: `contactability_score = ${lead.contactability_score}`,
    });
  } else if (lead.contactability_score <= 7) {
    signals.push({
      id: "contactability-low",
      kind: "inference",
      tone: "warning",
      label: "Contactabilidad limitada",
      detail: `Contactability ${lead.contactability_score}/15: los canales corporativos públicos son escasos y habrá que abrir vía en terreno o por directorio.`,
      evidence: `contactability_score = ${lead.contactability_score}`,
    });
  }

  if (lead.landing_fit_score >= 9) {
    signals.push({
      id: "fit-high",
      kind: "inference",
      tone: "positive",
      label: "Alta adecuación para landing page",
      detail: `Landing Fit ${lead.landing_fit_score}/10: el rubro obtiene valor directo de una landing, sin necesidad de plataforma transaccional compleja.`,
      evidence: `landing_fit_score = ${lead.landing_fit_score}`,
    });
  } else if (lead.landing_fit_score <= 6) {
    signals.push({
      id: "fit-low",
      kind: "inference",
      tone: "warning",
      label: "Adecuación parcial para landing page",
      detail: `Landing Fit ${lead.landing_fit_score}/10: el rubro suele pedir funcionalidades de catálogo o inventario que exceden el alcance de una landing.`,
      evidence: `landing_fit_score = ${lead.landing_fit_score}`,
    });
  }

  if (lead.local_opportunity_score >= 9) {
    signals.push({
      id: "local-gap",
      kind: "inference",
      tone: "positive",
      label: "Brecha competitiva alta en su cuadrante",
      detail: `Local Opportunity ${lead.local_opportunity_score}/10: ubicación en eje comercial relevante con baja densidad de competidores digitalizados.`,
      evidence: `local_opportunity_score = ${lead.local_opportunity_score}`,
    });
  }

  if (lead.confidence_score < 65) {
    signals.push({
      id: "confidence-low",
      kind: "inference",
      tone: "warning",
      label: "Fiabilidad del dato por debajo del umbral",
      detail: `Confidence ${lead.confidence_score}/100: valida los datos con una segunda fuente antes de invertir tiempo comercial.`,
      evidence: `confidence_score = ${lead.confidence_score}`,
    });
  }

  return signals;
}

/* ------------------------------------------------------------------------- */
/* Vacíos de información                                                      */
/* ------------------------------------------------------------------------- */

export function buildDataGaps(lead: Lead): DataGap[] {
  const gaps: DataGap[] = [];

  const add = (field: string, label: string, impact: string) =>
    gaps.push({ field, label, impact });

  if (lead.rating === null) add("rating", "Calificación pública", "No se puede calificar la reputación con un número.");
  if (lead.review_count === null)
    add("review_count", "Volumen de reseñas", "No se puede dimensionar el flujo comercial observado.");
  if (!lead.whatsapp_business)
    add("whatsapp_business", "WhatsApp Business", "No hay canal directo verificado para abrir la conversación.");
  if (!lead.public_business_email)
    add("public_business_email", "Correo corporativo", "No hay vía asíncrona para enviar la propuesta.");
  if (!lead.instagram_url)
    add("instagram_url", "Perfil de Instagram", "No se puede revisar el material visual existente del negocio.");
  if (lead.online_booking === null && (lead.niche === "barbershop" || lead.niche === "restaurant"))
    add("online_booking", "Sistema de reservas", "Se desconoce si ya resuelve el agendamiento por otra vía.");
  if (lead.online_menu === null && (lead.niche === "restaurant" || lead.niche === "bar"))
    add("online_menu", "Menú digital", "Se desconoce si la carta está publicada en algún formato.");
  if (!lead.address || lead.address === lead.commune)
    add("address", "Dirección exacta", "La ubicación está resuelta sólo a nivel de sector o comuna.");

  return gaps;
}

/* ------------------------------------------------------------------------- */
/* Problema digital                                                           */
/* ------------------------------------------------------------------------- */

const NICHE_ASSET: Record<Niche, string> = {
  barbershop: "su marca, su carta de servicios y su agenda",
  restaurant: "su carta, su ubicación y su canal de pedidos",
  bar: "su propuesta, su cartelera y sus reservas",
  boutique: "su identidad, sus colecciones y su vitrina",
};

export function buildProblem(lead: Lead) {
  const traction: string[] = [];
  if (lead.review_count !== null && lead.review_count >= 50)
    traction.push(`${lead.review_count} reseñas registradas`);
  if (lead.rating !== null && lead.rating >= 4.0)
    traction.push(`una calificación de ${lead.rating.toFixed(1)}`);
  if (lead.social_activity === "high") traction.push("publicación frecuente en redes");
  if (lead.commercial_attractiveness_score >= 20 && !traction.length)
    traction.push(`una atractividad comercial de ${lead.commercial_attractiveness_score}/25`);

  const tractionPhrase = traction.length
    ? `El dataset registra ${traction.join(", ")}`
    : `El modelo le asigna una atractividad comercial de ${lead.commercial_attractiveness_score}/25`;

  const asset = NICHE_ASSET[lead.niche];

  if (lead.website_classification >= 3) {
    const where =
      lead.source_primary === "agendapro" || lead.source_primary === "fresha"
        ? `Hoy ese flujo aterriza en ${sourceLabel(lead.source_primary)}, junto a sus competidores directos.`
        : lead.source_primary === "delivery_app"
          ? "Hoy ese flujo aterriza en aplicaciones de delivery que intermedian la relación con el cliente."
          : "Hoy ese flujo aterriza en redes sociales, donde el contenido caduca y no hay estructura de conversión.";

    return {
      headline: "Demanda comprobada sin activo digital propio",
      body: `${tractionPhrase}, es decir: hay tracción comercial real. Lo que no existe es un activo web bajo control del negocio capaz de centralizar ${asset} y convertir esa demanda en una acción concreta. ${where}`,
    };
  }

  if (lead.website_classification === 2) {
    return {
      headline: "Activo web existente pero sin capacidad de conversión",
      body: `${tractionPhrase}. Existe una presencia web, pero es mínima: no centraliza ${asset} ni ofrece un camino claro hacia la acción que el negocio necesita que ocurra.`,
    };
  }

  if (lead.website_classification === 1) {
    return {
      headline: "Sitio propio con deficiencias que frenan la conversión",
      body: `${tractionPhrase}. El negocio ya invirtió en un sitio propio, pero la clasificación del suministro lo marca como mejorable: la brecha no está en tener presencia, sino en que esa presencia trabaje a favor de ${asset}.`,
    };
  }

  return {
    headline: "Sin brecha digital estructural detectada",
    body: `${tractionPhrase}. El negocio ya cuenta con un sitio propio en buen estado, de modo que la necesidad digital de base es baja (Digital Need ${lead.digital_need_score}/40). Cualquier propuesta debería centrarse en optimización de conversión, no en construcción desde cero.`,
  };
}

/* ------------------------------------------------------------------------- */
/* Oportunidad comercial                                                      */
/* ------------------------------------------------------------------------- */

export const CONVERSION_GOAL: Record<Niche, string> = {
  barbershop: "Convertir el descubrimiento digital en una reserva de hora directa",
  restaurant: "Convertir el descubrimiento en reserva, visita o pedido directo",
  bar: "Convertir el descubrimiento en reserva de mesa y asistencia a la cartelera",
  boutique: "Convertir el descubrimiento en visita a tienda y consulta directa",
};

const NICHE_IMPROVEMENT: Record<Niche, string> = {
  barbershop:
    "centralizar servicios, precios y equipo en un solo lugar controlado por el negocio, y llevar el agendamiento a un canal propio",
  restaurant:
    "publicar la carta en formato navegable, resolver ubicación y horarios sin fricción, y abrir un canal de pedido o reserva directo",
  bar:
    "sustituir la carta en PDF y las historias caducas por una cartelera y una carta permanentes, con reserva de mesa",
  boutique:
    "ordenar la identidad y las colecciones en una vitrina propia que dirija hacia la tienda física y el canal directo",
};

const NICHE_ACTION: Record<Niche, string> = {
  barbershop: "reservar una hora",
  restaurant: "reservar mesa o pedir directamente",
  bar: "reservar mesa o consultar la cartelera",
  boutique: "visitar la tienda o consultar por una pieza",
};

export function buildOpportunity(lead: Lead) {
  const contactChannel = lead.whatsapp_business
    ? "WhatsApp Business"
    : lead.public_business_phone
      ? "el teléfono comercial"
      : lead.instagram_url
        ? "Instagram"
        : "el canal de contacto que se verifique en terreno";

  const value =
    lead.website_classification >= 3
      ? `Una landing propia convierte un flujo que hoy vive en canales de terceros en un activo del negocio: posicionamiento propio en búsquedas locales, control del mensaje y un camino directo a ${NICHE_ACTION[lead.niche]}.`
      : lead.website_classification === 0
        ? `El valor de una landing aquí no está en existir —ya existe— sino en optimizar el tramo final: reducir los pasos entre llegar al sitio y ${NICHE_ACTION[lead.niche]}.`
        : `Una landing bien construida corrige el tramo donde hoy se pierde la conversión: llegar, entender la propuesta y ${NICHE_ACTION[lead.niche]} sin fricción.`;

  return {
    improvement: `Se puede ${NICHE_IMPROVEMENT[lead.niche]}.`,
    value,
    facilitatedAction: `La landing debe facilitar una acción concreta: ${NICHE_ACTION[lead.niche]}, con ${contactChannel} como vía de salida principal.`,
    conversionGoal: CONVERSION_GOAL[lead.niche],
    caveat:
      "El alcance se define sobre lo que el dataset respalda. Cualquier estimación de retorno económico requiere datos de facturación que este dataset no contiene.",
  };
}

/* ------------------------------------------------------------------------- */
/* Diagnóstico completo                                                       */
/* ------------------------------------------------------------------------- */

export type Diagnosis = ReturnType<typeof buildDiagnosis>;

export function buildDiagnosis(lead: Lead) {
  const signals = buildSignals(lead);
  return {
    lead,
    nicheLabel: NICHE_LABEL[lead.niche],
    signals,
    facts: signals.filter((s) => s.kind === "fact"),
    inferences: signals.filter((s) => s.kind === "inference"),
    gaps: buildDataGaps(lead),
    problem: buildProblem(lead),
    opportunity: buildOpportunity(lead),
  };
}
