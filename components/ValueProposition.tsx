"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const points = [
  {
    title: "Atención que no descansa",
    text: "Un agente de IA en tu web responde consultas y filtra clientes potenciales las 24 horas, no solo en horario de oficina.",
  },
  {
    title: "Más conversión, menos fricción",
    text: "Automatizo lo repetitivo del proceso de venta para que cada visita tenga más probabilidad de convertirse en cliente.",
  },
  {
    title: "Pensamiento estratégico",
    text: "Cada decisión técnica responde a un objetivo de negocio concreto, no a la moda tecnológica del momento.",
  },
  {
    title: "Comunicación clara",
    text: "Explico lo técnico en términos que un equipo no técnico puede usar y decidir con confianza.",
  },
  {
    title: "Ventaja frente a la competencia",
    text: "La mayoría de los negocios todavía tiene una web pasiva. La tuya trabaja para ti mientras la de al lado solo se muestra.",
  },
];

export default function ValueProposition() {
  return (
    <section className="relative py-28 md:py-36 bg-ink-900/40">
      <div className="max-w-content mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-12 md:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.3 }}
          className="md:col-span-5"
        >
          <span className="font-jp text-gold text-xs tracking-widest2 uppercase">Por qué trabajar conmigo</span>
          <h2 className="font-serif text-3xl md:text-4xl text-paper mt-4 leading-tight text-balance">
            Una web que trabaja, no que solo se ve bien
          </h2>
          <p className="text-paper-dim mt-6 leading-relaxed">
            No vendo tecnología por sí misma. Contratar una página web impulsada por IA es
            contratar una herramienta que capta, atiende y convierte clientes mientras tú te
            dedicas al resto del negocio.
          </p>
        </motion.div>

        <div className="md:col-span-7 grid sm:grid-cols-2 gap-x-8 gap-y-8">
          {points.map((point, i) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="flex gap-3.5"
            >
              <Check size={18} strokeWidth={1.5} className="text-gold shrink-0 mt-1" />
              <div>
                <h3 className="text-paper font-medium mb-1">{point.title}</h3>
                <p className="text-paper-dim text-sm leading-relaxed">{point.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
