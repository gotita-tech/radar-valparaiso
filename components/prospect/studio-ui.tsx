"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Download } from "lucide-react";
import { CLAIM_DESCRIPTION, CLAIM_LABEL, type ClaimKind } from "@/lib/radar/diagnosis";

const CLAIM_STYLE: Record<ClaimKind, { color: string; soft: string }> = {
  fact: { color: "#7FA8C9", soft: "rgba(127,168,201,0.13)" },
  inference: { color: "#C9A227", soft: "rgba(201,162,39,0.13)" },
  recommendation: { color: "#B08CC4", soft: "rgba(176,140,196,0.13)" },
};

export function ClaimBadge({ kind }: { kind: ClaimKind }) {
  const style = CLAIM_STYLE[kind];
  return (
    <span
      title={CLAIM_DESCRIPTION[kind]}
      className="inline-flex shrink-0 items-center rounded-sm px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest"
      style={{ color: style.color, backgroundColor: style.soft }}
    >
      {CLAIM_LABEL[kind]}
    </span>
  );
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
  id,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="overflow-hidden rounded-lg border border-white/[0.07] bg-ink-900/25"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 md:px-5">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] uppercase tracking-widest2 text-gold/60">{eyebrow}</p>
          ) : null}
          <h2 className="mt-0.5 font-serif text-base text-paper">{title}</h2>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="px-4 py-4 md:px-5 md:py-5">{children}</div>
    </section>
  );
}

export function DataRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.04] py-2 last:border-0">
      <dt className="shrink-0 text-[11px] uppercase tracking-widest text-paper-dim/40" title={hint}>
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right text-xs text-paper">{value}</dd>
    </div>
  );
}

/** Nunca mostramos null, undefined o NaN al usuario. */
export function orNA(value: string | number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return <NotAvailable />;
  if (typeof value === "number" && !Number.isFinite(value)) return <NotAvailable />;
  const text = String(value).trim();
  if (!text) return <NotAvailable />;
  return `${text}${suffix}`;
}

export function NotAvailable() {
  return <span className="text-paper-dim/30">No disponible</span>;
}

/**
 * Botón de copia con confirmación visible. Usa la Clipboard API y cae a
 * `execCommand` cuando el navegador la bloquea (contextos no seguros).
 */
export function CopyButton({
  value,
  label = "Copiar",
  className = "",
  onCopied,
}: {
  value: string;
  label?: string;
  className?: string;
  onCopied?: () => void;
}) {
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async () => {
    const fallback = () => {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    };

    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        ok = true;
      } else {
        ok = fallback();
      }
    } catch {
      try {
        ok = fallback();
      } catch {
        ok = false;
      }
    }

    setState(ok ? "done" : "error");
    if (ok) onCopied?.();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2200);
  }, [value, onCopied]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors duration-200 ${
        state === "done"
          ? "border-[#5FA463]/50 bg-[#5FA463]/[0.12] text-[#7FBE83]"
          : state === "error"
            ? "border-[#D9503F]/50 bg-[#D9503F]/[0.10] text-[#E08573]"
            : "border-white/[0.09] bg-white/[0.02] text-paper-dim hover:border-gold/40 hover:text-gold"
      } ${className}`}
    >
      {state === "done" ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.6} />}
      {state === "done" ? "Copiado" : state === "error" ? "No se pudo copiar" : label}
    </button>
  );
}

export function DownloadButton({
  filename,
  content,
  mime = "text/markdown",
  label = "Descargar .md",
  onDownloaded,
}: {
  filename: string;
  content: string;
  mime?: string;
  label?: string;
  onDownloaded?: () => void;
}) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const download = useCallback(() => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setDone(true);
    onDownloaded?.();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 2200);
  }, [content, filename, mime, onDownloaded]);

  return (
    <button
      type="button"
      onClick={download}
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors duration-200 ${
        done
          ? "border-[#5FA463]/50 bg-[#5FA463]/[0.12] text-[#7FBE83]"
          : "border-white/[0.09] bg-white/[0.02] text-paper-dim hover:border-gold/40 hover:text-gold"
      }`}
    >
      {done ? <Check size={13} strokeWidth={2} /> : <Download size={13} strokeWidth={1.6} />}
      {done ? "Descargado" : label}
    </button>
  );
}

export function MarkdownPreview({ content, maxHeight = 320 }: { content: string; maxHeight?: number }) {
  return (
    <pre
      className="overflow-auto rounded-md border border-white/[0.06] bg-ink-950/70 p-3 text-[11px] leading-relaxed text-paper-dim/75"
      style={{ maxHeight }}
    >
      <code className="whitespace-pre-wrap break-words font-mono">{content}</code>
    </pre>
  );
}
