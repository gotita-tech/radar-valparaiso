"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const projects = [
  {
    title: "Agente de soporte con IA",
    category: "Automatización · IA",
    text: "Agente conversacional que resuelve el 70% de las consultas de primer nivel sin intervención humana.",
  },
  {
    title: "Plataforma interna de gestión",
    category: "Desarrollo a medida",
    text: "Herramienta a medida que centraliza procesos que antes vivían repartidos en hojas de cálculo.",
  },
  {
    title: "Rediseño de arquitectura de datos",
    category: "Consultoría técnica",
    text: "Reestructuración de flujos de datos para reducir tiempos de proceso y errores manuales.",
  },
];

export default function Projects() {
  return (
    <section id="proyectos" className="relative py-28 md:py-36 bg-ink-900/40">
      <div className="max-w-content mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="font-jp text-gold text-xs tracking-widest2 uppercase">Proyectos</span>
          <h2 className="font-serif text-3xl md:text-4xl text-paper mt-4">Trabajo reciente</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.a
              href="#contacto"
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="group relative rounded-2xl overflow-hidden border border-white/[0.07] bg-ink-950 aspect-[4/5] flex flex-col justify-end p-7 hover:border-gold/40 transition-colors duration-300"
            >
              <div
                className="absolute inset-0 pattern-seigaiha opacity-20 group-hover:opacity-35 transition-opacity duration-300"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent"
                aria-hidden="true"
              />
              <div className="relative z-10">
                <span className="text-xs tracking-wide text-gold uppercase">{project.category}</span>
                <h3 className="font-serif text-xl text-paper mt-2 mb-2">{project.title}</h3>
                <p className="text-paper-dim text-sm leading-relaxed mb-4">{project.text}</p>
                <span className="inline-flex items-center gap-1.5 text-sm text-paper group-hover:text-gold transition-colors duration-300">
                  Ver detalle
                  <ArrowUpRight
                    size={15}
                    strokeWidth={1.5}
                    className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                  />
                </span>
              </div>
            </motion.a>
          ))}
        </div>

        <p className="text-center text-paper-dim/50 text-xs mt-10">
          Ejemplos representativos. Sustitúyelos por tus propios proyectos y casos reales.
        </p>
      </div>
    </section>
  );
}
