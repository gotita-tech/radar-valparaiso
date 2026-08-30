"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SectionLabel } from "@/components/radar/ui";

type Mode = "magic_link" | "password";

/**
 * Acceso a la plataforma.
 *
 * Dos métodos, los dos sin credenciales de terceros: enlace mágico por correo y
 * contraseña. Google OAuth encaja en el mismo flujo, pero exige un client id y
 * un secret que hoy no existen; añadir el botón sin ellos sólo produciría un
 * error al pulsarlo, así que no se pinta.
 */
export default function AccessPanel({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("magic_link");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectTo =
    typeof window === "undefined"
      ? undefined
      : `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);

    try {
      const supabase = createClient();

      if (mode === "magic_link") {
        const { error: linkError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });

        if (linkError) throw linkError;

        // El mismo mensaje exista o no la cuenta: decir "ese correo no está
        // registrado" convierte el formulario en un comprobador de usuarios.
        setMessage(
          "Si ese correo es válido, te llega un enlace de acceso en unos segundos.",
        );
        return;
      }

      if (creating) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });

        if (signUpError) throw signUpError;

        setMessage("Cuenta creada. Revisa tu correo para confirmarla.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      router.push(next);
      router.refresh();
    } catch (caught) {
      // El mensaje de Supabase es genérico y seguro de mostrar; cualquier otra
      // cosa se reduce a una frase neutra.
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "No se pudo completar la operación.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-3 rounded-lg border border-white/[0.07] bg-ink-900/40 px-5 py-6"
    >
      <SectionLabel>Acceso</SectionLabel>

      <div className="flex gap-1.5">
        <ModeButton
          active={mode === "magic_link"}
          onClick={() => setMode("magic_link")}
          icon={<Mail size={12} strokeWidth={1.7} />}
          label="Enlace por correo"
        />
        <ModeButton
          active={mode === "password"}
          onClick={() => setMode("password")}
          icon={<KeyRound size={12} strokeWidth={1.7} />}
          label="Contraseña"
        />
      </div>

      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-paper-dim/45">
          Correo
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-sm border border-white/[0.08] bg-ink-950 px-2.5 py-2 text-xs text-paper outline-none transition-colors duration-200 focus:border-gold/40"
        />
      </label>

      {mode === "password" ? (
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-paper-dim/45">
            Contraseña
          </span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={creating ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-sm border border-white/[0.08] bg-ink-950 px-2.5 py-2 text-xs text-paper outline-none transition-colors duration-200 focus:border-gold/40"
          />
        </label>
      ) : null}

      {error ? (
        <p className="rounded-sm border border-[#8C4A45]/40 bg-[#8C4A45]/[0.12] px-2.5 py-2 text-[11px] text-[#E8A19B]">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-sm border border-[#5FA463]/35 bg-[#5FA463]/[0.10] px-2.5 py-2 text-[11px] text-[#8FCE93]">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-gold/30 bg-gold/[0.10] px-3 py-2 text-[11px] text-gold transition-colors duration-200 hover:bg-gold/[0.16] disabled:opacity-50"
      >
        {busy ? <Loader2 size={13} strokeWidth={1.6} className="animate-spin" /> : null}
        {mode === "magic_link"
          ? "Enviarme un enlace"
          : creating
            ? "Crear cuenta"
            : "Entrar"}
      </button>

      {mode === "password" ? (
        <button
          type="button"
          onClick={() => setCreating((value) => !value)}
          className="w-full text-center text-[10px] text-paper-dim/45 transition-colors duration-200 hover:text-paper-dim"
        >
          {creating ? "Ya tengo cuenta" : "Crear una cuenta nueva"}
        </button>
      ) : null}

      <p className="pt-1 text-[10px] leading-relaxed text-paper-dim/35">
        Ver el radar no requiere cuenta. Identificarse sólo hace falta para publicar,
        confirmar o comentar un incidente.
      </p>
    </form>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm border px-2 py-1.5 text-[10px] transition-colors duration-200 ${
        active
          ? "border-gold/35 bg-gold/[0.08] text-gold"
          : "border-white/[0.08] text-paper-dim/60 hover:text-paper-dim"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
