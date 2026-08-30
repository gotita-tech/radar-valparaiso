import type { Metadata } from "next";
import Link from "next/link";
import AccessPanel from "@/components/incidents/AccessPanel";

export const metadata: Metadata = {
  title: "Acceso",
  description: "Entra o crea una cuenta para publicar y confirmar incidentes.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "El enlace no traía código de acceso. Pide uno nuevo.",
  exchange_failed: "El enlace ya se usó o caducó. Pide uno nuevo.",
};

export default async function AccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  // Sólo rutas internas: un `next` externo convertiría el login en un
  // redirector abierto.
  const next =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/incidentes";

  const error = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 py-16">
      <div className="text-center">
        <h1 className="font-serif text-2xl text-paper">Radar ciudadano</h1>
        <p className="mt-1 text-xs text-paper-dim/50">Región de Valparaíso</p>
      </div>

      {error ? (
        <p className="max-w-sm rounded-sm border border-[#8C4A45]/40 bg-[#8C4A45]/[0.12] px-3 py-2 text-center text-[11px] text-[#E8A19B]">
          {error}
        </p>
      ) : null}

      <AccessPanel next={next} />

      <Link
        href="/incidentes"
        className="text-[11px] text-paper-dim/45 underline-offset-2 transition-colors duration-200 hover:text-paper-dim hover:underline"
      >
        Ver el radar sin entrar
      </Link>
    </main>
  );
}
