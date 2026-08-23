"use client";

import { AlertTriangle, ChevronRight, Globe, Instagram, MessageCircle } from "lucide-react";
import { DATA_FLAG, NICHE_LABEL, TIER, WEB_CLASS } from "@/lib/radar/taxonomy";
import type { DataFlag, Lead } from "@/lib/radar/types";
import { EmptyState, Meter } from "./ui";

function hasFlag(lead: Lead, flag: DataFlag) {
  return (lead.data_flags ?? []).includes(flag);
}

export default function RankingPanel({
  leads,
  selectedId,
  onSelect,
  onOpenChannel,
}: {
  leads: Lead[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenChannel: (lead: Lead, channel: "website" | "instagram" | "whatsapp") => void;
}) {
  if (!leads.length) {
    return (
      <EmptyState
        title="Ningún prospecto coincide"
        hint="Ajusta los filtros o limpia la búsqueda para volver al dataset completo."
      />
    );
  }

  return (
    <ol className="divide-y divide-white/[0.05]">
      {leads.map((lead, index) => {
        const tier = TIER[lead.priority_tier];
        const isSelected = lead.business_id === selectedId;

        return (
          <li key={lead.business_id}>
            <div
              className={`group relative w-full px-4 py-3 transition-colors duration-200 ${
                isSelected ? "bg-gold/[0.06]" : "hover:bg-white/[0.025]"
              }`}
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[2px] transition-opacity duration-200"
                style={{ backgroundColor: tier.color, opacity: isSelected ? 1 : 0 }}
              />

              <button
                type="button"
                onClick={() => onSelect(lead.business_id)}
                className="w-full text-left"
                aria-label={`Ver ficha de ${lead.business_name}`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 shrink-0 text-right font-serif text-xs tabular-nums text-paper-dim/35">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm text-paper group-hover:text-gold">
                        {lead.business_name}
                      </p>
                      <span
                        className="shrink-0 font-serif text-lg leading-none tabular-nums"
                        style={{ color: tier.color }}
                      >
                        {lead.priority_score}
                      </span>
                    </div>

                    <p className="mt-0.5 truncate text-[11px] text-paper-dim/55">
                      {NICHE_LABEL[lead.niche]} · {lead.commune} ·{" "}
                      {WEB_CLASS[lead.website_classification].label}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <Meter value={lead.priority_score} max={100} color={tier.color} height={3} />
                      <span className="shrink-0 text-[10px] tabular-nums text-paper-dim/40">
                        conf. {lead.confidence_score}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    size={14}
                    strokeWidth={1.5}
                    className="mt-1 shrink-0 text-paper-dim/25 transition-colors duration-200 group-hover:text-gold"
                  />
                </div>
              </button>

              <div className="mt-2 flex items-center gap-1 pl-8">
                {lead.website_url ? (
                  <QuickAction
                    label="Abrir sitio web"
                    onClick={() => onOpenChannel(lead, "website")}
                    icon={<Globe size={12} strokeWidth={1.6} />}
                  />
                ) : null}
                {lead.instagram_url ? (
                  <QuickAction
                    label="Abrir Instagram"
                    onClick={() => onOpenChannel(lead, "instagram")}
                    icon={<Instagram size={12} strokeWidth={1.6} />}
                  />
                ) : null}
                {/* El acceso directo a WhatsApp se oculta cuando el número está
                    marcado como no fiable: sólo se ofrece desde la ficha, junto
                    a la advertencia correspondiente. */}
                {lead.whatsapp_business && !hasFlag(lead, "placeholder_phone") ? (
                  <QuickAction
                    label="Abrir WhatsApp Business"
                    onClick={() => onOpenChannel(lead, "whatsapp")}
                    icon={<MessageCircle size={12} strokeWidth={1.6} />}
                  />
                ) : null}
                {hasFlag(lead, "placeholder_phone") ? (
                  <span
                    title={DATA_FLAG.placeholder_phone}
                    className="inline-flex h-6 items-center gap-1 rounded border border-[#D9503F]/30 px-1.5 text-[10px] text-[#E08573]"
                  >
                    <AlertTriangle size={10} strokeWidth={1.8} />
                    Teléfono no fiable
                  </span>
                ) : null}
                {!lead.website_url && !lead.instagram_url && !lead.whatsapp_business ? (
                  <span className="text-[10px] text-paper-dim/30">
                    Sin canal público en el dataset
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function QuickAction({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-6 w-6 items-center justify-center rounded border border-white/[0.07] text-paper-dim/60 transition-colors duration-200 hover:border-gold/40 hover:text-gold"
    >
      {icon}
    </button>
  );
}
