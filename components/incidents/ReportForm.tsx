"use client";

import { useState } from "react";
import { Loader2, MapPin, Send } from "lucide-react";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_SEVERITY_COLORS,
  INCIDENT_SEVERITY_LABELS,
  type IncidentCategory,
  type IncidentSeverity,
} from "@/lib/incidents/types";
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  validateIncidentDraft,
} from "@/lib/incidents/validation";
import { SectionLabel } from "@/components/radar/ui";

type Point = { latitude: number; longitude: number } | null;

type Props = {
  categories: IncidentCategory[];
  point: Point;
  isAuthenticated: boolean;
  onCreated: () => void;
  onCancel: () => void;
};

/**
 * Alta de un reporte.
 *
 * Valida con el mismo módulo que la ruta de API, así que el mensaje que ve el
 * usuario antes de enviar es exactamente el criterio que aplicará el servidor.
 * La validación del cliente es cortesía; la que cuenta es la del servidor y,
 * detrás, las restricciones de la tabla.
 */
export default function ReportForm({
  categories,
  point,
  isAuthenticated,
  onCreated,
  onCancel,
}: Props) {
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("medium");
  const [address, setAddress] = useState("");
  const [commune, setCommune] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const draft = {
      category_slug: categorySlug,
      title,
      description,
      severity,
      latitude: point?.latitude ?? null,
      longitude: point?.longitude ?? null,
      address,
      commune,
    };

    const validation = validateIncidentDraft(
      draft,
      categories.map((category) => category.slug),
    );

    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.value),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const detail =
          payload && typeof payload === "object"
            ? (payload as { error?: string; fields?: Record<string, string> })
            : {};

        if (detail.fields) setErrors(detail.fields);
        setFormError(detail.error ?? "No se pudo publicar el reporte.");
        return;
      }

      setTitle("");
      setDescription("");
      setAddress("");
      setCommune("");
      setSeverity("medium");
      onCreated();
    } catch {
      setFormError("No se pudo contactar con el servidor. Reintenta en unos segundos.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-white/[0.07] bg-ink-900/30 px-4 py-5">
        <SectionLabel>Publicar un reporte</SectionLabel>
        <p className="text-[11px] leading-relaxed text-paper-dim/55">
          Ver el radar es público y no necesita cuenta. Para publicar sí hace falta
          identificarse: es lo que permite que un reporte tenga autor, se pueda confirmar y
          se pueda moderar.
        </p>
        <a
          href="/acceso?next=/incidentes"
          className="mt-3 inline-flex items-center gap-2 rounded-sm border border-gold/30 bg-gold/[0.08] px-3 py-1.5 text-[11px] text-gold transition-colors duration-200 hover:bg-gold/[0.14]"
        >
          Entrar o crear cuenta
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-white/[0.07] bg-ink-900/30 px-4 py-4"
    >
      <SectionLabel>Nuevo reporte</SectionLabel>

      <Field label="Categoría" error={errors.category_slug}>
        <select
          value={categorySlug}
          onChange={(event) => setCategorySlug(event.target.value)}
          className="w-full rounded-sm border border-white/[0.08] bg-ink-950 px-2.5 py-2 text-xs text-paper outline-none transition-colors duration-200 focus:border-gold/40"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Título" error={errors.title}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={TITLE_MAX}
          placeholder="Qué está pasando, en pocas palabras"
          className="w-full rounded-sm border border-white/[0.08] bg-ink-950 px-2.5 py-2 text-xs text-paper placeholder:text-paper-dim/25 outline-none transition-colors duration-200 focus:border-gold/40"
        />
      </Field>

      <Field label="Descripción" hint="Opcional" error={errors.description}>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={DESCRIPTION_MAX}
          rows={3}
          placeholder="Detalles útiles para quien pase por ahí"
          className="w-full resize-none rounded-sm border border-white/[0.08] bg-ink-950 px-2.5 py-2 text-xs text-paper placeholder:text-paper-dim/25 outline-none transition-colors duration-200 focus:border-gold/40"
        />
      </Field>

      <Field label="Gravedad">
        <div className="flex flex-wrap gap-1.5">
          {INCIDENT_SEVERITIES.map((level) => {
            const active = severity === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setSeverity(level)}
                className="rounded-sm border px-2 py-1 text-[10px] uppercase tracking-wider transition-colors duration-200"
                style={{
                  borderColor: active
                    ? INCIDENT_SEVERITY_COLORS[level]
                    : "rgba(255,255,255,0.08)",
                  color: active ? INCIDENT_SEVERITY_COLORS[level] : "#D9D9D9",
                  backgroundColor: active
                    ? `${INCIDENT_SEVERITY_COLORS[level]}1F`
                    : "transparent",
                }}
              >
                {INCIDENT_SEVERITY_LABELS[level]}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Ubicación" error={errors.location}>
        <div className="flex items-center gap-2 rounded-sm border border-white/[0.08] bg-ink-950 px-2.5 py-2">
          <MapPin size={13} strokeWidth={1.6} className="shrink-0 text-gold/70" />
          {point ? (
            <span className="font-mono text-[10px] tabular-nums text-paper-dim">
              {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
            </span>
          ) : (
            <span className="text-[11px] text-paper-dim/40">
              Pincha en el mapa para situarlo
            </span>
          )}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Dirección" hint="Opcional">
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            maxLength={200}
            className="w-full rounded-sm border border-white/[0.08] bg-ink-950 px-2.5 py-2 text-xs text-paper outline-none transition-colors duration-200 focus:border-gold/40"
          />
        </Field>
        <Field label="Comuna" hint="Opcional">
          <input
            value={commune}
            onChange={(event) => setCommune(event.target.value)}
            maxLength={80}
            className="w-full rounded-sm border border-white/[0.08] bg-ink-950 px-2.5 py-2 text-xs text-paper outline-none transition-colors duration-200 focus:border-gold/40"
          />
        </Field>
      </div>

      {formError ? (
        <p className="rounded-sm border border-[#8C4A45]/40 bg-[#8C4A45]/[0.12] px-2.5 py-2 text-[11px] text-[#E8A19B]">
          {formError}
        </p>
      ) : null}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-sm border border-gold/30 bg-gold/[0.10] px-3 py-1.5 text-[11px] text-gold transition-colors duration-200 hover:bg-gold/[0.16] disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 size={13} strokeWidth={1.6} className="animate-spin" />
          ) : (
            <Send size={13} strokeWidth={1.6} />
          )}
          {submitting ? "Publicando…" : "Publicar reporte"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm px-2.5 py-1.5 text-[11px] text-paper-dim/50 transition-colors duration-200 hover:text-paper-dim"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-paper-dim/45">
          {label}
        </span>
        {hint ? <span className="text-[9px] text-paper-dim/25">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1 block text-[10px] text-[#E8A19B]">{error}</span> : null}
    </label>
  );
}
