"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import HankoSeal from "./ui/HankoSeal";
import LuxuryButton from "./ui/LuxuryButton";
import GoldParticlesCanvas from "./three/GoldParticlesCanvas";

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-ink-950"
    >
      {/* Niebla / tinta japonesa en movimiento sutil */}
      <div className="absolute inset-0 pattern-ink-bloom animate-drift" aria-hidden="true" />
      <div className="absolute inset-0 pattern-seigaiha opacity-40" aria-hidden="true" />

      {/* Partículas doradas 3D flotando en el fondo, muy sutiles */}
      <div className="absolute inset-0" aria-hidden="true">
        <GoldParticlesCanvas />
      </div>

      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-content w-full px-6 md:px-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <HankoSeal className="w-10 h-10 md:w-12 md:h-12" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="font-jp text-gold text-xs md:text-sm tracking-widest2 uppercase mb-6"
        >
          Estrategia · Tecnología · Inteligencia Artificial
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="font-serif text-balance text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] text-paper max-w-4xl"
        >
          Transformo ideas complejas en soluciones impulsadas por Inteligencia Artificial.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-6 text-base md:text-lg text-paper-dim max-w-2xl text-balance"
        >
          Diseño, automatizo y construyo sistemas que combinan estrategia, tecnología e innovación.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-12 flex flex-col sm:flex-row items-center gap-4"
        >
          <LuxuryButton href="#contacto" className="w-full sm:w-auto">
            Agendar reunión
          </LuxuryButton>
          <LuxuryButton href="#proyectos" variant="outline" className="w-full sm:w-auto">
            Ver proyectos
          </LuxuryButton>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-paper-dim/60"
        aria-hidden="true"
      >
        <ArrowDown size={18} strokeWidth={1.25} />
      </motion.div>
    </section>
  );
}
