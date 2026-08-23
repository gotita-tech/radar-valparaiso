"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Layers, MapPin, Radar, Target } from "lucide-react";
import { computeMetrics, FACETS, LEADS } from "@/lib/radar/data";
import { NICHE_LABEL, TIER } from "@/lib/radar/taxonomy";

const metrics = computeMetrics(LEADS);

const capabilities = [
  {
    icon: MapPin,
    title: "Cartografía de oportunidad",
    text: "Mapa interactivo con densidad territorial ponderada por Priority Score sobre coordenadas reales del dataset.",
  },
  {
    icon: Target,
    title: "Priorización explicable",
    text: "Cada score se descompone en Digital Need, Attractiveness, Contactability, Landing Fit y Local Opportunity.",
  },
  {
    icon: Layers,
    title: "Filtros que mueven todo",
    text: "Comuna, nicho, umbral de score y estado web actualizan métricas, ranking, listado y mapa a la vez.",
  },
];

export default function RadarShowcase() {
  const stats = [
    { label: "Negocios analizados", value: String(metrics.total) },
    {
      label: "Prospectos HIGH+",
      value: String(metrics.high + metrics.veryHigh),
      accent: TIER.HIGH.color,
    },
    { label: "Sin sitio web propio", value: String(metrics.withoutWebsite), accent: "#D67E33" },
    { label: "Priority promedio", value: metrics.avgPriority.toFixed(1) },
  ];

  return (
    <section id="radar" className="relative py-28 md:py-36">
      <div className="max-w-content mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="font-jp text-gold text-xs tracking-widest2 uppercase">Producto</span>
          <h2 className="font-serif text-3xl md:text-4xl text-paper mt-4">Opportunity Radar</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-paper-dim">
            Inteligencia comercial y geoespacial para la Región de Valparaíso: detecta negocios con
            brecha digital y tracción comercial real, los prioriza y explica por qué.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-950"
        >
          <div className="pattern-seigaiha absolute inset-0 opacity-20" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gold/[0.05]"
            aria-hidden="true"
          />

          <div className="relative z-10 grid gap-px bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-ink-950/90 px-6 py-7">
                <p className="font-serif text-4xl leading-none tabular-nums text-paper" style={stat.accent ? { color: stat.accent } : undefined}>
                  {stat.value}
                </p>
                <p className="mt-2 text-xs text-paper-dim/60">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="relative z-10 grid gap-8 border-t border-white/[0.06] p-7 md:grid-cols-3 md:p-10">
            {capabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <div key={capability.title}>
                  <Icon size={22} strokeWidth={1.25} className="text-gold" />
                  <h3 className="mt-4 font-serif text-lg text-paper">{capability.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper-dim">{capability.text}</p>
                </div>
              );
            })}
          </div>

          <div className="relative z-10 flex flex-col items-start gap-5 border-t border-white/[0.06] px-7 py-6 md:flex-row md:items-center md:justify-between md:px-10">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px] text-paper-dim/45">
              <span className="inline-flex items-center gap-1.5 text-gold/70">
                <Radar size={12} strokeWidth={1.6} />
                Cobertura
              </span>
              {FACETS.communes.map((commune) => (
                <span key={commune}>{commune}</span>
              ))}
              <span className="text-paper-dim/20">·</span>
              {FACETS.niches.map((niche) => (
                <span key={niche}>{NICHE_LABEL[niche]}</span>
              ))}
            </div>

            <Link
              href="/radar"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink-950 transition-colors duration-300 hover:bg-gold-soft"
            >
              Abrir el Radar
              <ArrowUpRight
                size={16}
                strokeWidth={1.8}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
