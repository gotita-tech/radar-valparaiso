import "server-only";

/**
 * Registro de errores de datos.
 *
 * El detalle técnico —mensaje de Postgres, código, pista— se queda en el log
 * del servidor. Lo que llega al navegador es una frase corta y sin información
 * de esquema: un error de base de datos filtrado a la interfaz es a la vez una
 * mala experiencia y un mapa del backend para quien lo lea.
 */

type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

export function logDataError(operation: string, error: unknown): void {
  const detail: SupabaseLikeError =
    error && typeof error === "object" ? (error as SupabaseLikeError) : {};

  console.error("[data] %s failed", operation, {
    code: detail.code,
    message: detail.message ?? String(error),
    details: detail.details,
    hint: detail.hint,
  });
}

/** Mensajes de cara al usuario. Nunca incluyen nada del esquema. */
export const USER_FACING_ERRORS = {
  unavailable: "No pudimos conectar con la base de datos. Reintenta en unos segundos.",
  invalid: "Revisa los datos del formulario: hay algún campo que no es válido.",
  unauthenticated: "Inicia sesión para publicar un reporte.",
  forbidden: "No tienes permiso para hacer esto.",
  unexpected: "Algo no salió bien. Vuelve a intentarlo.",
} as const;
