/**
 * Diagnóstico comercial por nicho y por estado web.
 *
 * Todo el contenido proviene del documento canónico:
 *  · § "Ranking de Oportunidad por Nicho"
 *  · § "Recomendaciones Comerciales para Prospectos Prioritarios"
 *  · § "Sistema de Clasificación de Presencia Web"
 *
 * No se generan argumentos nuevos ni se personalizan mensajes automáticamente.
 */
import type { Lead, Niche, WebsiteClassification } from "./types";

export type NichePlaybook = {
  opportunityRating: string;
  opportunity: string;
  landingType: string;
  features: string[];
  pitch: string | null;
};

export const NICHE_PLAYBOOK: Record<Niche, NichePlaybook> = {
  barbershop: {
    opportunityRating: "9.3 / 10",
    opportunity:
      "Mayor brecha de digitalización estructural del territorio: la mayoría opera sobre plataformas de agendamiento de terceros (AgendaPro, Fresha) sin sitio propio que centralice su propuesta de valor ni capture tráfico orgánico local en Google Maps.",
    landingType: "Landing Page de Agendamiento Directo y Marca (Single-Page App)",
    features: [
      "Catálogo visual de servicios y cortes",
      "Lista de precios transparente",
      "Presentación del equipo",
      "Galería de trabajos",
      "Widget de agendamiento sin comisiones",
      "Botón directo a WhatsApp Business",
      "Mapa interactivo y ubicación",
    ],
    pitch:
      "Actualmente tus clientes dependen de una plataforma de terceros para agendar, donde compites codo a codo con otros locales y pierdes la oportunidad de construir tu propia marca en Google. Con tu propia landing page profesional, posicionas tu local en Viña/Valparaíso, automatizas tus reservas por WhatsApp y eres el dueño exclusivo de tu canal de clientes.",
  },
  restaurant: {
    opportunityRating: "8.9 / 10",
    opportunity:
      "Mayor volumen de negocios y el ticket potencial más elevado. La dependencia de plataformas de delivery erosiona el margen por comisiones de terceros, lo que habilita un argumento centrado en landings transaccionales independientes.",
    landingType: "Landing Page de Menú Interactivo y Pedidos Directos",
    features: [
      "Menú estructurado por categorías con fotografías",
      "Autoselección de productos que genera la comanda",
      "Comanda enrutada a WhatsApp Business",
      "Horarios de atención automáticos",
      "Geolocalización del local",
      "Canal directo de reservas",
    ],
    pitch:
      "Estás cediendo hasta un 30% de tus ventas en comisiones a las aplicaciones de delivery. Con tu propio menú digital interactivo, tus clientes habituales pueden pedir directamente a tu WhatsApp, aumentas el ticket promedio mediante ventas cruzadas visuales y aseguras la rentabilidad directa de tu local.",
  },
  bar: {
    opportunityRating: "7.6 / 10",
    opportunity:
      "Altísima dependencia de Instagram para difundir eventos. La oportunidad está en sustituir los menús en PDF alojados en Google Drive por landings dinámicas adaptadas a móvil.",
    landingType: "Landing Page de Cartelera y Reservas",
    features: [
      "Cartelera de eventos actualizable",
      "Carta de tragos legible en móvil",
      "Módulo de reserva de mesas",
      "Galería de ambiente",
      "Ubicación y horarios",
    ],
    pitch: null,
  },
  boutique: {
    opportunityRating: "6.5 / 10",
    opportunity:
      "Existe masa crítica de locales, pero la conversión para landings simples enfrenta que el rubro suele requerir e-commerce transaccional con inventario en tiempo real, lo que eleva costo y alarga el ciclo de venta.",
    landingType: "Landing Page de Showroom / Lookbook",
    features: [
      "Catálogo de temporada",
      "Lookbook de colecciones",
      "Showroom visual enlazado a Instagram",
      "Contacto directo por WhatsApp",
      "Ubicación y horarios",
    ],
    pitch: null,
  },
};

/** Diagnóstico digital derivado de la clasificación web canónica. */
export const WEB_DIAGNOSIS: Record<WebsiteClassification, string> = {
  0: "Cuenta con sitio propio en buen estado. La necesidad digital es baja: el ángulo comercial pasa por optimización o funcionalidades de conversión, no por construcción desde cero.",
  1: "Tiene sitio propio pero con deficiencias técnicas o de diseño relevantes. Existe margen para rediseño y mejora de conversión.",
  2: "Presencia web mínima, sin contenido transaccional. Requiere una landing real que sustituya la página existente.",
  3: "Sin sitio propio: opera únicamente vía redes sociales o agregadores de terceros, compartiendo espacio con competidores directos y sin control sobre su posicionamiento.",
  4: "No se localizó sitio web propio tras agotar los protocolos de búsqueda. Requiere infraestructura digital desde cero.",
};

export function diagnosisFor(lead: Lead) {
  return WEB_DIAGNOSIS[lead.website_classification];
}

export function playbookFor(lead: Lead) {
  return NICHE_PLAYBOOK[lead.niche];
}
