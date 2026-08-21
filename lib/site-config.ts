/**
 * Fuente única de verdad para datos del sitio que se repiten en metadata,
 * sitemap, robots, structured data y los distintos puntos de contacto.
 *
 * SITE_URL: si tienes un dominio propio o confirmas la URL final de Vercel,
 * actualízala aquí (o define NEXT_PUBLIC_SITE_URL en las variables de
 * entorno de Vercel) y se propaga a todo el proyecto automáticamente.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://experimento-02.vercel.app";

export const AUTHOR_NAME = "Vicente Tomás Jara Valdés";
export const AUTHOR_SHORT_NAME = "Vicente Jara";
export const EMAIL = "vicentetomasjara@gmail.com";

// Número real mostrado en el sitio, normalizado a formato internacional E.164 sin "+" ni espacios.
export const PHONE_DISPLAY = "+56 9 6598 8361";
export const WHATSAPP_NUMBER = "56965988361";

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hola, quisiera realizar una consulta. Mi nombre es [nombre] y el problema que necesito resolver es el siguiente:";

export function buildWhatsAppUrl(message: string = WHATSAPP_DEFAULT_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
