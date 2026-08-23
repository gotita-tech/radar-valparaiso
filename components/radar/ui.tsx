"use client";

import type { ReactNode } from "react";
import { TIER } from "@/lib/radar/taxonomy";
import type { PriorityTier } from "@/lib/radar/types";

export function TierBadge({
  tier,
  size = "sm",
}: {
  tier: PriorityTier;
  size?: "sm" | "md";
}) {
  const meta = TIER[tier];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm font-medium uppercase tracking-widest ${
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"
      }`}
      style={{ color: meta.color, backgroundColor: meta.soft }}
      title={meta.action}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}

export function Meter({
  value,
  max,
  color = "#C9A227",
  height = 4,
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-white/[0.07]"
      style={{ height }}
      role="presentation"
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function ScoreDial({
  value,
  max = 100,
  label,
  color = "#C9A227",
  size = 112,
}: {
  value: number;
  max?: number;
  label: string;
  color?: string;
  size?: number;
}) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, value / max));

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-3xl leading-none text-paper tabular-nums">
            {value}
          </span>
          <span className="mt-1 text-[10px] text-paper-dim/60">/ {max}</span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-widest2 text-paper-dim/70">
        {label}
      </span>
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  count,
  dotColor,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
  dotColor?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={`group inline-flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors duration-200 ${
        active
          ? "border-gold/50 bg-gold/[0.10] text-paper"
          : "border-white/[0.07] bg-white/[0.02] text-paper-dim hover:border-white/20 hover:text-paper"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        {dotColor ? (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: dotColor }}
            aria-hidden="true"
          />
        ) : null}
        <span className="truncate">{children}</span>
      </span>
      {typeof count === "number" ? (
        <span className="shrink-0 text-[10px] tabular-nums text-paper-dim/50">{count}</span>
      ) : null}
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-md border border-white/[0.07] bg-white/[0.02] p-0.5"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-xs transition-colors duration-200 ${
              active
                ? "bg-gold/[0.14] text-gold"
                : "text-paper-dim hover:bg-white/[0.04] hover:text-paper"
            }`}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ToolButton({
  onClick,
  children,
  icon,
  active = false,
  disabled = false,
  title,
}: {
  onClick: () => void;
  children?: ReactNode;
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-gold/50 bg-gold/[0.12] text-gold"
          : "border-white/[0.07] bg-white/[0.02] text-paper-dim hover:border-white/20 hover:text-paper"
      }`}
    >
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2.5 text-[10px] uppercase tracking-widest2 text-paper-dim/50">
      {children}
    </h3>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-1.5 px-6 text-center">
      <p className="font-serif text-base text-paper-dim">{title}</p>
      {hint ? <p className="max-w-xs text-xs text-paper-dim/50">{hint}</p> : null}
    </div>
  );
}
