/**
 * Motor de soluciones por nicho.
 *
 * Devuelve un blueprint de landing: qué módulos incluir, por qué, y qué dato
 * del prospecto alimenta cada uno. Los módulos que dependen de un dato que el
 * dataset no tiene se marcan como `needsData`, para que nadie los venda como
 * si estuvieran resueltos.
 *
 * Regla explícita del alcance: nunca se propone e-commerce completo cuando los
 * datos sólo justifican una landing.
 */
import { CONVERSION_GOAL } from "./diagnosis";
import { NICHE_LABEL } from "./taxonomy";
import type { Lead, Niche } from "./types";

export type ModulePriority = "core" | "recommended" | "optional";

export type SolutionModule = {
  id: string;
  label: string;
  rationale: string;
  priority: ModulePriority;
  /** Dato del prospecto que alimenta el módulo, si lo hay. */
  source?: string;
  /** Qué falta por confirmar antes de construirlo. */
  needsData?: string;
};

export type Blueprint = {
  landingType: string;
  conversionGoal: string;
  scopeNote: string;
  modules: SolutionModule[];
};

const PRIORITY_ORDER: Record<ModulePriority, number> = {
  core: 0,
  recommended: 1,
  optional: 2,
};

export const PRIORITY_LABEL: Record<ModulePriority, string> = {
  core: "Núcleo",
  recommended: "Recomendado",
  optional: "Opcional",
};

function contactModules(lead: Lead): SolutionModule[] {
  const modules: SolutionModule[] = [];

  modules.push(
    lead.whatsapp_business
      ? {
          id: "whatsapp",
          label: "Botón directo a WhatsApp",
          rationale:
            "Canal de salida principal: el visitante pasa de la landing a una conversación real en un toque.",
          priority: "core",
          source: `whatsapp_business = ${lead.whatsapp_business}`,
        }
      : {
          id: "whatsapp",
          label: "Botón directo a WhatsApp",
          rationale:
            "Es la vía de contacto dominante en el rubro y en la región. Debe existir en la landing.",
          priority: "core",
          needsData: "Confirmar el número de WhatsApp Business con el negocio antes de publicarlo.",
        },
  );

  if (lead.instagram_url) {
    modules.push({
      id: "instagram",
      label: "Enlace y feed de Instagram",
      rationale:
        "El perfil existente ya concentra el material visual del negocio: la landing lo capitaliza en vez de duplicarlo.",
      priority: "recommended",
      source: `instagram_url = ${lead.instagram_url}`,
    });
  }

  modules.push({
    id: "location",
    label: "Ubicación y mapa",
    rationale:
      lead.latitude !== null && lead.longitude !== null
        ? "Las coordenadas ya están validadas en el dataset y alimentan el mapa directamente."
        : "Elemento indispensable para un negocio de atención presencial.",
    priority: "core",
    source:
      lead.latitude !== null && lead.longitude !== null
        ? `latitude/longitude = ${lead.latitude}, ${lead.longitude}`
        : undefined,
    needsData:
      lead.latitude === null || lead.longitude === null
        ? "Falta la coordenada exacta del local."
        : !lead.address || lead.address === lead.commune
          ? "La dirección está resuelta sólo a nivel de sector: confirmar calle y número."
          : undefined,
  });

  modules.push({
    id: "hours",
    label: "Horarios de atención",
    rationale: "Reduce las consultas repetitivas y las visitas fallidas.",
    priority: "recommended",
    needsData: "El dataset no registra horarios: hay que pedirlos al negocio.",
  });

  return modules;
}

const NICHE_BLUEPRINT: Record<
  Niche,
  { landingType: string; scopeNote: string; modules: SolutionModule[] }
> = {
  barbershop: {
    landingType: "Landing de agendamiento directo y marca",
    scopeNote:
      "Alcance de una sola página. No incluye plataforma de gestión interna ni sistema de pagos.",
    modules: [
      {
        id: "hero",
        label: "Hero de marca",
        rationale:
          "Primer bloque: qué es el local y por qué elegirlo, con la reserva siempre a la vista.",
        priority: "core",
      },
      {
        id: "services",
        label: "Servicios",
        rationale: "El visitante necesita saber qué se hace antes de decidir reservar.",
        priority: "core",
        needsData: "La lista real de servicios debe confirmarse con el negocio.",
      },
      {
        id: "pricing",
        label: "Precios",
        rationale:
          "La transparencia de precios reduce la fricción previa a la reserva en un rubro de ticket bajo y decisión rápida.",
        priority: "core",
        needsData: "Los precios no están en el dataset: son un placeholder hasta que el negocio los aporte.",
      },
      {
        id: "booking",
        label: "Reserva de hora",
        rationale:
          "Acto de conversión del rubro. Debe ocurrir en un canal propio, no en un agregador de terceros.",
        priority: "core",
      },
      {
        id: "team",
        label: "Equipo",
        rationale:
          "En barbería la relación es con el barbero concreto: mostrar el equipo sostiene la recurrencia.",
        priority: "recommended",
        needsData: "Nombres y fotografías del equipo requieren autorización del negocio.",
      },
      {
        id: "gallery",
        label: "Galería de trabajos",
        rationale: "Prueba visual directa del resultado que el cliente va a recibir.",
        priority: "recommended",
        needsData: "Requiere fotografías reales del local y de los cortes.",
      },
      {
        id: "testimonials",
        label: "Testimonios",
        rationale: "Capitaliza la reputación pública ya existente.",
        priority: "optional",
        needsData:
          "No se deben redactar testimonios: sólo pueden usarse reseñas reales con atribución verificable.",
      },
    ],
  },

  restaurant: {
    landingType: "Landing de menú interactivo y pedido directo",
    scopeNote:
      "Alcance de una sola página con menú navegable. No incluye carrito con pasarela de pago ni gestión de inventario.",
    modules: [
      {
        id: "identity",
        label: "Identidad y propuesta",
        rationale: "Qué tipo de cocina es y qué experiencia ofrece, en el primer pantallazo.",
        priority: "core",
      },
      {
        id: "menu",
        label: "Menú digital por categorías",
        rationale:
          "Es lo primero que busca quien descubre un restaurante. Debe ser navegable, no un PDF.",
        priority: "core",
        needsData: "Los platos y precios reales debe aportarlos el negocio.",
      },
      {
        id: "photos",
        label: "Fotografía de platos y local",
        rationale: "En gastronomía la fotografía es el principal motor de decisión.",
        priority: "core",
        needsData: "Requiere fotografías reales; no se deben usar imágenes de banco como si fueran del local.",
      },
      {
        id: "reservation",
        label: "Reservas",
        rationale: "Convierte el interés en una mesa asignada sin pasar por intermediarios.",
        priority: "core",
      },
      {
        id: "ordering",
        label: "Pedido directo a WhatsApp",
        rationale:
          "Alternativa directa a las aplicaciones de delivery: la comanda se arma en la landing y sale por WhatsApp.",
        priority: "recommended",
      },
      {
        id: "social",
        label: "Redes sociales",
        rationale: "Continuidad con los canales donde el negocio ya publica.",
        priority: "optional",
      },
    ],
  },

  bar: {
    landingType: "Landing de cartelera, carta y reservas",
    scopeNote:
      "Alcance de una sola página. No incluye venta de entradas ni sistema de aforo.",
    modules: [
      {
        id: "identity",
        label: "Propuesta del local",
        rationale: "Qué tipo de bar es y qué ambiente ofrece: es la decisión principal del visitante.",
        priority: "core",
      },
      {
        id: "drinks",
        label: "Carta de tragos",
        rationale: "Sustituye el PDF alojado en Drive por una carta legible en móvil.",
        priority: "core",
        needsData: "La carta real debe aportarla el negocio.",
      },
      {
        id: "events",
        label: "Cartelera de eventos",
        rationale:
          "El rubro depende de Instagram para difundir eventos: una cartelera propia deja de perder esa información al caducar las historias.",
        priority: "core",
        needsData: "La programación la mantiene el negocio.",
      },
      {
        id: "reservation",
        label: "Reserva de mesa",
        rationale: "Acto de conversión principal en horario nocturno.",
        priority: "recommended",
      },
      {
        id: "gallery",
        label: "Galería de ambiente",
        rationale: "El ambiente es el producto: hay que mostrarlo.",
        priority: "recommended",
        needsData: "Requiere fotografías reales del local.",
      },
    ],
  },

  boutique: {
    landingType: "Landing de identidad y vitrina de colecciones",
    scopeNote:
      "Alcance de una sola página como vitrina. NO se propone e-commerce con inventario ni pasarela de pago: los datos disponibles no lo justifican y ampliaría el ciclo de venta.",
    modules: [
      {
        id: "identity",
        label: "Identidad de marca",
        rationale: "En moda la marca es el producto: la landing debe sostener ese relato.",
        priority: "core",
      },
      {
        id: "collections",
        label: "Colecciones",
        rationale: "Organiza la oferta por temporada sin necesidad de inventario en tiempo real.",
        priority: "core",
        needsData: "Las colecciones reales debe aportarlas el negocio.",
      },
      {
        id: "lookbook",
        label: "Lookbook",
        rationale: "Formato visual nativo del rubro, reutilizable en redes.",
        priority: "recommended",
        needsData: "Requiere fotografía de producto real.",
      },
      {
        id: "catalog",
        label: "Catálogo de vitrina (sin carrito)",
        rationale:
          "Muestra piezas y deriva la consulta a WhatsApp. Mantiene el alcance en landing y evita el coste de un e-commerce.",
        priority: "recommended",
        needsData: "Las piezas y precios los define el negocio.",
      },
      {
        id: "cta-visit",
        label: "CTA de visita a tienda",
        rationale: "El objetivo realista es la visita presencial y la consulta directa, no la venta online.",
        priority: "core",
      },
    ],
  },
};

export function buildBlueprint(lead: Lead): Blueprint {
  const base = NICHE_BLUEPRINT[lead.niche];
  const modules = [...base.modules, ...contactModules(lead)].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  return {
    landingType: base.landingType,
    conversionGoal: CONVERSION_GOAL[lead.niche],
    scopeNote: base.scopeNote,
    modules,
  };
}

export function blueprintSummary(lead: Lead) {
  const blueprint = buildBlueprint(lead);
  return {
    ...blueprint,
    nicheLabel: NICHE_LABEL[lead.niche],
    core: blueprint.modules.filter((m) => m.priority === "core"),
    pendingData: blueprint.modules.filter((m) => m.needsData),
  };
}
